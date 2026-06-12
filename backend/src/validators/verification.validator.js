// Joi schema that validates the verification request payload.
const Joi = require('joi');

const rawCodeValue = Joi.string()
  .trim()
  .min(1)
  .max(160)
  .pattern(/^[\u001dA-Za-z0-9\s()[\]{}:;.,_~!@#$%&'*+=?/\-\\|]+$/)
  .messages({
    'string.pattern.base': 'code contains unsupported characters.',
  });

const gtinValue = Joi.string()
  .trim()
  .pattern(/^\d{8,14}$/)
  .messages({
    'string.pattern.base': 'gtin must contain 8 to 14 digits.',
  });

const serialValue = Joi.string()
  .trim()
  .min(1)
  .max(20)
  .pattern(/^[A-Za-z0-9._~!@#$%&*+=:;,\-/]+$/)
  .messages({
    'string.pattern.base': 'serial_number contains unsupported characters.',
  });

const batchValue = Joi.string()
  .trim()
  .min(1)
  .max(20)
  .pattern(/^[A-Za-z0-9._~!@#$%&*+=:;,\-/]+$/)
  .messages({
    'string.pattern.base': 'batch_number contains unsupported characters.',
  });

const clientTelemetrySchema = Joi.object({
  device_id: Joi.string().trim().max(128).optional(),
  app_version: Joi.string().trim().max(64).optional(),
  status: Joi.string().valid('consumed', 'recalled', 'invalid').optional(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).optional(),
}).unknown(true);

const verifyDrugSchema = Joi.object({
  code: rawCodeValue,
  gtin: gtinValue,
  serial_number: serialValue,
  batch_number: batchValue,
  scan_medium: Joi.string().valid('QR', 'Bar').optional(),
  client_telemetry: clientTelemetrySchema.optional(),
})
  .unknown(false)
  // 1. Core mutual exclusivity constraint
  .without('code', ['gtin', 'serial_number', 'batch_number'])
  
  // 2. Clear, targeted property dependencies (pins errors to exact fields)
  .when(Joi.object({ gtin: Joi.exist() }).unknown(), {
    then: Joi.object({
      serial_number: Joi.required().messages({ 'any.required': 'serial_number is required when gtin is provided.' }),
      batch_number: Joi.required().messages({ 'any.required': 'batch_number is required when gtin is provided.' })
    })
  })
  .when(Joi.object({ serial_number: Joi.exist() }).unknown(), {
    then: Joi.object({
      gtin: Joi.required().messages({ 'any.required': 'gtin is required when serial_number is provided.' }),
      batch_number: Joi.required().messages({ 'any.required': 'batch_number is required when serial_number is provided.' })
    })
  })
  // 3. Fallback: If no components are provided at all, verify that 'code' or 'batch_number' exists
  .when(Joi.object({ gtin: Joi.forbidden(), serial_number: Joi.forbidden() }).unknown(), {
    then: Joi.object({
      code: rawCodeValue,
    }).or('code', 'batch_number')
  })
  .messages({
    'object.without': 'Provide either code or QR components, not both.',
    'object.missing': 'Provide code, batch_number, or the full QR component triplet.',
  });

module.exports = {
  verifyDrugSchema,
};
