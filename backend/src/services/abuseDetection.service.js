const config = require('../config/env');
const { TooManyRequestsError } = require('../utils/AppError');
const { sha256 } = require('../utils/hash');
const logger = require('../utils/logger');

const clientStates = new Map();

const now = () => Date.now();

const canonicalPayloadValue = (payload = {}) => {
  if (payload.code) {
    return `code:${payload.code}`;
  }

  return [
    `gtin:${payload.gtin || ''}`,
    `serial:${payload.serial_number || ''}`,
    `batch:${payload.batch_number || ''}`,
  ].join('|');
};

const fingerprintPayload = (payload) => sha256(canonicalPayloadValue(payload));

const pruneTimestamps = (timestamps, cutoff) => timestamps.filter((timestamp) => timestamp >= cutoff);

const getClientState = (clientKey) => {
  if (!clientStates.has(clientKey)) {
    clientStates.set(clientKey, {
      blockedUntil: 0,
      failures: [],
      scans: [],
      repeatedCodes: new Map(),
      failedFingerprints: new Map(),
      lastSeenAt: now(),
    });
  }

  return clientStates.get(clientKey);
};

const cleanupIfNeeded = () => {
  if (clientStates.size <= config.abuse.maxTrackedClients) {
    return;
  }

  const cutoff = now() - config.abuse.windowMs;

  for (const [clientKey, state] of clientStates.entries()) {
    if (state.lastSeenAt < cutoff && state.blockedUntil < now()) {
      clientStates.delete(clientKey);
    }

    if (clientStates.size <= config.abuse.maxTrackedClients) {
      break;
    }
  }
};

const pruneClientState = (state, cutoff) => {
  state.failures = pruneTimestamps(state.failures, cutoff);
  state.scans = pruneTimestamps(state.scans, cutoff);

  for (const [fingerprint, timestamps] of state.repeatedCodes.entries()) {
    const recent = pruneTimestamps(timestamps, cutoff);

    if (recent.length === 0) {
      state.repeatedCodes.delete(fingerprint);
    } else {
      state.repeatedCodes.set(fingerprint, recent);
    }
  }

  for (const [fingerprint, timestamp] of state.failedFingerprints.entries()) {
    if (timestamp < cutoff) {
      state.failedFingerprints.delete(fingerprint);
    }
  }
};

const retryAfterSeconds = (blockedUntil) => Math.max(1, Math.ceil((blockedUntil - now()) / 1000));

const calculateBlockMs = (failureCount) => {
  const overage = Math.max(0, failureCount - config.abuse.failureThreshold);
  return Math.min(config.abuse.maxBlockMs, config.abuse.baseBlockMs * (2 ** overage));
};

class AbuseDetectionService {
  assessRequest({ req, payload }) {
    cleanupIfNeeded();

    const clientKey = req.ip || 'unknown';
    const state = getClientState(clientKey);
    const currentTime = now();
    const cutoff = currentTime - config.abuse.windowMs;
    const fingerprint = fingerprintPayload(payload);
    const securityFlags = [];

    state.lastSeenAt = currentTime;
    pruneClientState(state, cutoff);

    if (state.blockedUntil > currentTime) {
      throw new TooManyRequestsError(
        'Too many failed verification attempts. Please wait before trying again.',
        retryAfterSeconds(state.blockedUntil),
      );
    }

    const repeatedScans = state.repeatedCodes.get(fingerprint) || [];
    if (repeatedScans.length >= config.abuse.repeatedCodeThreshold) {
      const blockedUntil = currentTime + config.abuse.baseBlockMs;
      state.blockedUntil = blockedUntil;

      logger.security('repeated_code_scan_blocked', {
        ip: req.ip,
        code_hash: fingerprint,
        count: repeatedScans.length,
      });

      throw new TooManyRequestsError(
        'Too many repeated verification attempts. Please wait before trying again.',
        retryAfterSeconds(blockedUntil),
      );
    }

    if (repeatedScans.length >= Math.floor(config.abuse.repeatedCodeThreshold / 2)) {
      securityFlags.push('repeated_code_scan');
    }

    if (state.failedFingerprints.size >= config.abuse.uniqueFailureThreshold) {
      securityFlags.push('high_unique_failure_volume');
    }

    return {
      securityFlags,
    };
  }

  recordVerificationAttempt({ req, payload, result }) {
    const clientKey = req.ip || 'unknown';
    const state = getClientState(clientKey);
    const currentTime = now();
    const cutoff = currentTime - config.abuse.windowMs;
    const fingerprint = fingerprintPayload(payload);
    const failed = result && result.valid === false;
    const securityFlags = new Set(req.securityFlags || []);

    state.lastSeenAt = currentTime;
    pruneClientState(state, cutoff);
    state.scans.push(currentTime);

    const repeatedScans = state.repeatedCodes.get(fingerprint) || [];
    repeatedScans.push(currentTime);
    state.repeatedCodes.set(fingerprint, pruneTimestamps(repeatedScans, cutoff));

    if (failed) {
      state.failures.push(currentTime);
      state.failedFingerprints.set(fingerprint, currentTime);
    }

    if (state.repeatedCodes.get(fingerprint).length >= config.abuse.repeatedCodeThreshold) {
      securityFlags.add('repeated_code_scan');

      logger.security('repeated_code_scan_detected', {
        ip: req.ip,
        code_hash: fingerprint,
        count: state.repeatedCodes.get(fingerprint).length,
      });
    }

    if (failed && state.failures.length >= config.abuse.failureThreshold) {
      const blockMs = calculateBlockMs(state.failures.length);
      state.blockedUntil = currentTime + blockMs;
      securityFlags.add('progressive_failure_throttle');

      logger.security('progressive_failure_throttle_applied', {
        ip: req.ip,
        failure_count: state.failures.length,
        block_ms: blockMs,
      });
    }

    if (state.failedFingerprints.size >= config.abuse.uniqueFailureThreshold) {
      securityFlags.add('high_unique_failure_volume');

      logger.security('high_unique_failure_volume_detected', {
        ip: req.ip,
        unique_failed_codes: state.failedFingerprints.size,
      });
    }

    req.securityFlags = Array.from(securityFlags);

    return {
      securityFlags: req.securityFlags,
      suspicious: req.securityFlags.length > 0,
    };
  }
}

module.exports = new AbuseDetectionService();
