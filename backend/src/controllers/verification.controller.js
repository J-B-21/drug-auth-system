// Controller layer for verification requests.
// Delegates incoming HTTP requests to the verification service and handles asynchronous errors.
const asyncHandler = require('../middleware/asyncHandler');
const VerificationService = require('../services/verification.service');

const verificationService = new VerificationService();

const verifyDrug = asyncHandler(async (req, res) => {
  const result = await verificationService.verify(req.body);
  res.status(200).json(result);
});

module.exports = {
  verifyDrug,
};
