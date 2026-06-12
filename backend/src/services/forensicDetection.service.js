const config = require('../config/env');
const { sha256 } = require('../utils/hash');

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const haversineDistanceKm = (from, to) => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const isValidLocation = (location) => {
  return location
    && Number.isFinite(location.latitude)
    && Number.isFinite(location.longitude)
    && location.latitude >= -90
    && location.latitude <= 90
    && location.longitude >= -180
    && location.longitude <= 180;
};

class ForensicDetectionService {
  constructor({ scanLogRepository, nowProvider = () => new Date() } = {}) {
    this.scanLogRepository = scanLogRepository;
    this.nowProvider = nowProvider;
  }

  async assessScan({ payload = {}, outcome = {}, context = {} } = {}) {
    const now = this.nowProvider();
    const windowStart = new Date(now.getTime() - config.forensics.windowMs);
    const rapidWindowStart = new Date(now.getTime() - config.forensics.rapidScanWindowMs);
    const geoWindowStart = new Date(now.getTime() - config.forensics.geoScanWindowMs);
    const statusWindowStart = new Date(now.getTime() - config.forensics.statusWindowMs);

    const value = payload.code
      ? payload.code
      : `gtin:${payload.gtin || ''}|sn:${payload.serial_number || ''}|bn:${payload.batch_number || ''}`;

    const scannedValueHash = sha256(value);
    const ipHash = context.ipAddress ? sha256(context.ipAddress) : null;
    const location = payload.client_telemetry?.location;
    const recordedStatus = payload.client_telemetry?.status;
    const matchedProductId = outcome.log?.matchedProductId;
    const matchedBatchId = outcome.log?.matchedBatchId;
    const matchedItemId = outcome.log?.matchedItemId;

    const forensicFlags = new Set();
    const forensicDetails = {};

    if (ipHash && scannedValueHash) {
      const recentSameValue = await this.scanLogRepository.findRecentLogsByScannedValueHash(scannedValueHash, windowStart);
      const distinctIpHashes = new Set(recentSameValue.map((row) => row.ip_hash).filter(Boolean));

      if (distinctIpHashes.size >= config.forensics.distinctIpThreshold && recentSameValue.length > 1) {
        forensicFlags.add('repeated_scans_different_ip_ranges');
        forensicDetails.repeatedScansDifferentIpRanges = {
          window_ms: config.forensics.windowMs,
          recent_attempt_count: recentSameValue.length,
          distinct_ip_count: distinctIpHashes.size,
        };
      }
    }

    if (matchedItemId) {
      const itemAttempts = await this.scanLogRepository.countRecentLogsByMatchedItemId(matchedItemId, windowStart);
      if (itemAttempts + 1 >= config.forensics.excessiveItemAttempts) {
        forensicFlags.add('excessive_item_attempts');
        forensicDetails.excessiveItemAttempts = {
          window_ms: config.forensics.windowMs,
          historical_attempt_count: itemAttempts,
          threshold: config.forensics.excessiveItemAttempts,
        };
      }
    }

    if (matchedBatchId) {
      const batchAttempts = await this.scanLogRepository.countRecentLogsByMatchedBatchId(matchedBatchId, windowStart);
      if (batchAttempts + 1 >= config.forensics.excessiveBatchAttempts) {
        forensicFlags.add('excessive_batch_attempts');
        forensicDetails.excessiveBatchAttempts = {
          window_ms: config.forensics.windowMs,
          historical_attempt_count: batchAttempts,
          threshold: config.forensics.excessiveBatchAttempts,
        };
      }
    }

    if (matchedProductId) {
      const productAttempts = await this.scanLogRepository.countRecentLogsByMatchedProductId(matchedProductId, windowStart);
      if (productAttempts + 1 >= config.forensics.excessiveProductAttempts) {
        forensicFlags.add('excessive_product_attempts');
        forensicDetails.excessiveProductAttempts = {
          window_ms: config.forensics.windowMs,
          historical_attempt_count: productAttempts,
          threshold: config.forensics.excessiveProductAttempts,
        };
      }
    }

    if (ipHash) {
      const rapidScanCount = await this.scanLogRepository.countRecentLogsByIpHash(ipHash, rapidWindowStart);
      if (rapidScanCount + 1 >= config.forensics.rapidScanThreshold) {
        forensicFlags.add('rapid_sequential_scans');
        forensicDetails.rapidSequentialScans = {
          window_ms: config.forensics.rapidScanWindowMs,
          recent_attempt_count: rapidScanCount + 1,
          threshold: config.forensics.rapidScanThreshold,
        };
      }
    }

    if (matchedItemId) {
      const statusEvents = await this.scanLogRepository.findRecentLogsByMatchedItemIdWithStatuses(
        matchedItemId,
        statusWindowStart,
        ['consumed', 'recalled', 'invalid'],
      );

      if (statusEvents.length > 0) {
        forensicFlags.add('item_status_reuse');
        forensicDetails.itemStatusReuse = {
          window_ms: config.forensics.statusWindowMs,
          events: statusEvents.map((event) => ({
            scanned_at: event.scanned_at,
            recorded_status: event.metadata?.recorded_status || null,
          })),
        };
      }
    }

    if (isValidLocation(location)) {
      const previousGeographicScans = matchedItemId
        ? await this.scanLogRepository.findRecentLogsByMatchedItemIdWithLocation(matchedItemId, geoWindowStart)
        : await this.scanLogRepository.findRecentLogsByScannedValueHashWithLocation(scannedValueHash, geoWindowStart);

      for (const previous of previousGeographicScans) {
        const previousLocation = previous.metadata?.client_telemetry?.location;
        if (isValidLocation(previousLocation)) {
          const distanceKm = haversineDistanceKm(location, previousLocation);
          if (distanceKm >= config.forensics.geoInconsistentDistanceKm) {
            forensicFlags.add('geo_inconsistent_scan');
            forensicDetails.geoInconsistentScan = {
              distance_km: Number(distanceKm.toFixed(2)),
              threshold_km: config.forensics.geoInconsistentDistanceKm,
              current_location: location,
              previous_location: previousLocation,
              previous_scanned_at: previous.scanned_at,
            };
            break;
          }
        }
      }
    }

    const forensicFlagsArray = Array.from(forensicFlags);
    const forensicMetadata = {
      forensic_flags: forensicFlagsArray,
      forensic_details: forensicDetails,
    };

    if (recordedStatus) {
      forensicMetadata.recorded_status = recordedStatus;
    }

    return {
      forensicFlags: forensicFlagsArray,
      forensicMetadata,
    };
  }
}

module.exports = ForensicDetectionService;
