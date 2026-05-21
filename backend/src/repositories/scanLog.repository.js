// Small repository to persist verification attempt logs into the DB.
// Keeps a single responsibility: create a scan log record and return it.
const db = require('../config/database');
const { SCAN_LOG_TABLE } = require('../models/scanLog.model');

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
        metadata: scanLog.metadata || {},
      })
      .returning('*');

    return createdLog;
  }
}

module.exports = ScanLogRepository;
