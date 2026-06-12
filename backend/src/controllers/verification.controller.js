// Controller layer for verification requests.
// Delegates incoming HTTP requests to the verification service and handles asynchronous errors.
const asyncHandler = require('../middleware/asyncHandler');
const abuseDetectionService = require('../services/abuseDetection.service');
const VerificationService = require('../services/verification.service');
const pushService = require('../services/push.service');

const verificationService = new VerificationService();

const verifyDrug = asyncHandler(async (req, res) => {
  const result = await verificationService.verify(req.body, {
    requestId: req.id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    securityFlags: req.securityFlags || [],
  });

  abuseDetectionService.recordVerificationAttempt({
    req,
    payload: req.body,
    result,
  });

  // If this result is suspicious, attempt to notify previous scanners
  try {
    if (result && result.suspicious) {
      const scannedValue = req.body.code || req.body.serial_number || req.body.gtin || null;
      const excludeTokens = req.body.client_push_token ? [req.body.client_push_token] : [];
      await pushService.notifyPreviousScanners({
        scannedValue,
        excludeTokens,
        title: 'Security Alert: Suspicious Scan',
        body: 'A previously scanned code has been flagged as suspicious. Tap to view details.',
        payload: result,
      });
    }
  } catch (e) {
    // fail silently
  }

  res.status(200).json(result);
});

module.exports = {
  verifyDrug,
};
