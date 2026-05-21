// Verification API route definitions.
// This router exposes the POST endpoint used to verify drug codes and QR components.
const express = require('express');

const verificationController = require('../controllers/verification.controller');
const validateRequest = require('../middleware/validateRequest');
const { verifyDrugSchema } = require('../validators/verification.validator');

const router = express.Router();

router.post('/', validateRequest(verifyDrugSchema), verificationController.verifyDrug);

module.exports = router;
