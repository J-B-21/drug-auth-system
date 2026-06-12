// Middleware to validate incoming request bodies against a Joi schema.
// Converts and strips unknown fields, and forwards a `ValidationError` on failure.
const { ValidationError } = require('../utils/AppError');

const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    convert: true,
    allowUnknown: false,
    stripUnknown: false,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return next(new ValidationError('Invalid verification request.', details));
  }

  req.body = value;
  return next();
};

module.exports = validateRequest;
