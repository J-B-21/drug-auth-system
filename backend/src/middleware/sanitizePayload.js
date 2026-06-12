const { ValidationError } = require('../utils/AppError');

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const CONTROL_CHARS_EXCEPT_GS1 = /[\u0000-\u0008\u000B\u000C\u000E-\u001C\u007F]/g;

const sanitizeString = (value) => value
  .normalize('NFKC')
  .replace(CONTROL_CHARS_EXCEPT_GS1, '')
  .trim();

const sanitizeValue = (value, depth = 0) => {
  if (depth > 3) {
    throw new ValidationError('Request payload is too deeply nested.');
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    if (value.length > 10) {
      throw new ValidationError('Request payload contains too many array items.');
    }

    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);

    if (entries.length > 20) {
      throw new ValidationError('Request payload contains too many fields.');
    }

    return entries.reduce((sanitized, [key, entry]) => {
      if (BLOCKED_KEYS.has(key)) {
        throw new ValidationError('Request payload contains a forbidden field.');
      }

      sanitized[key] = sanitizeValue(entry, depth + 1);
      return sanitized;
    }, {});
  }

  return value;
};

const sanitizePayload = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  next();
};

module.exports = sanitizePayload;
