// Scan log table name and input type enums.
// These constants define how verification attempts are categorized and stored.
const SCAN_LOG_TABLE = 'drug_scan_logs';

const SCAN_INPUT_TYPES = Object.freeze({
  BARCODE: 'barcode',
  QR_CODE: 'qr_code',
  RAW_CODE: 'raw_code',
  BATCH_NUMBER: 'batch_number',
});

module.exports = {
  SCAN_INPUT_TYPES,
  SCAN_LOG_TABLE,
};
