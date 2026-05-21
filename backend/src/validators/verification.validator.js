// Joi schema that validates the verification request payload.
const Joi = require('joi');

const codeValue = Joi.string().trim().min(1).max(255);

const verifyDrugSchema = Joi.object({
  code: codeValue,
  gtin: codeValue,
  serial_number: codeValue,
  batch_number: codeValue,
  scan_medium: Joi.string().valid('QR', 'Bar').optional(),
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
      code: Joi.string().alter({
        empty: (schema) => schema.required().messages({ 'any.required': 'Provide code, batch_number, or the full QR component triplet.' })
      })
    }).or('code', 'batch_number')
  })
  .messages({
    'object.without': 'Provide either code or QR components, not both.',
    'object.missing': 'Provide code, batch_number, or the full QR component triplet.',
  });

module.exports = {
  verifyDrugSchema,
};
