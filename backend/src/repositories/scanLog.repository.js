// Small repository to persist verification attempt logs into the DB.
// Keeps a single responsibility: create a scan log record and return it.
const db = require('../config/database');
const { SCAN_LOG_TABLE } = require('../models/scanLog.model');
const { sha256 } = require('../utils/hash');

const hashOptional = (value) => (value ? sha256(value) : null);

class ScanLogRepository {
  constructor(knex = db) {
    this.db = knex;
  }

  async create(scanLog) {
    const [createdLog] = await this.db(SCAN_LOG_TABLE)
      .insert({
        scanned_value: scanLog.scannedValue,
        input_type: scanLog.inputType,
        success: scanLog.success,
        failure_reason: scanLog.failureReason || null,
        verification_source: scanLog.verificationSource || null,
        matched_product_id: scanLog.matchedProductId || null,
        matched_item_id: scanLog.matchedItemId || null,
        matched_batch_id: scanLog.matchedBatchId || null,
        request_id: scanLog.requestId || null,
        scanned_value_hash: hashOptional(scanLog.scannedValue),
        ip_hash: hashOptional(scanLog.ipAddress),
        user_agent_hash: hashOptional(scanLog.userAgent),
        suspicious: Boolean(scanLog.suspicious),
        security_flags: scanLog.securityFlags || [],
        metadata: scanLog.metadata || {},
      })
      .returning('*');

    return createdLog;
  }

  async findRecentLogsByScannedValueHash(scannedValueHash, cutoff) {
    if (!scannedValueHash) {
      return [];
    }

    return this.db(SCAN_LOG_TABLE)
      .select('id', 'ip_hash', 'metadata', 'scanned_at')
      .where('scanned_value_hash', scannedValueHash)
      .andWhere('scanned_at', '>=', cutoff)
      .orderBy('scanned_at', 'desc');
  }

  async countRecentLogsByMatchedProductId(productId, cutoff) {
    if (!productId) {
      return 0;
    }

    const [{ count }] = await this.db(SCAN_LOG_TABLE)
      .count('*')
      .where('matched_product_id', productId)
      .andWhere('scanned_at', '>=', cutoff);

    return Number(count);
  }

  async countRecentLogsByMatchedBatchId(batchId, cutoff) {
    if (!batchId) {
      return 0;
    }

    const [{ count }] = await this.db(SCAN_LOG_TABLE)
      .count('*')
      .where('matched_batch_id', batchId)
      .andWhere('scanned_at', '>=', cutoff);

    return Number(count);
  }

  async countRecentLogsByMatchedItemId(itemId, cutoff) {
    if (!itemId) {
      return 0;
    }

    const [{ count }] = await this.db(SCAN_LOG_TABLE)
      .count('*')
      .where('matched_item_id', itemId)
      .andWhere('scanned_at', '>=', cutoff);

    return Number(count);
  }

  async countRecentLogsByIpHash(ipHash, cutoff) {
    if (!ipHash) {
      return 0;
    }

    const [{ count }] = await this.db(SCAN_LOG_TABLE)
      .count('*')
      .where('ip_hash', ipHash)
      .andWhere('scanned_at', '>=', cutoff);

    return Number(count);
  }

  async findRecentLogsByMatchedItemIdWithStatuses(itemId, cutoff, statuses = []) {
    if (!itemId || statuses.length === 0) {
      return [];
    }

    const placeholders = statuses.map(() => '?').join(',');
    return this.db(SCAN_LOG_TABLE)
      .select('id', 'scanned_at', 'metadata')
      .where('matched_item_id', itemId)
      .andWhere('scanned_at', '>=', cutoff)
      .andWhereRaw(`metadata->>'recorded_status' IN (${placeholders})`, statuses)
      .orderBy('scanned_at', 'desc');
  }

  async findRecentLogsByMatchedItemIdWithLocation(itemId, cutoff) {
    if (!itemId) {
      return [];
    }

    return this.db(SCAN_LOG_TABLE)
      .select('id', 'scanned_at', 'metadata')
      .where('matched_item_id', itemId)
      .andWhere('scanned_at', '>=', cutoff)
      .andWhereRaw(`metadata->'client_telemetry'->'location' IS NOT NULL`)
      .orderBy('scanned_at', 'desc');
  }

  async findRecentLogsByScannedValueHashWithLocation(scannedValueHash, cutoff) {
    if (!scannedValueHash) {
      return [];
    }

    return this.db(SCAN_LOG_TABLE)
      .select('id', 'scanned_at', 'metadata')
      .where('scanned_value_hash', scannedValueHash)
      .andWhere('scanned_at', '>=', cutoff)
      .andWhereRaw(`metadata->'client_telemetry'->'location' IS NOT NULL`)
      .orderBy('scanned_at', 'desc');
  }
}

module.exports = ScanLogRepository;
