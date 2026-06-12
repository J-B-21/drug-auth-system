// Global Express error handler.
// Normalizes errors into a consistent JSON shape and hides stack traces in production.
const config = require('../config/env');
const logger = require('../utils/logger');

const isDatabaseError = (error) => Boolean(
  error &&
  (
    error.code ||
    error.routine ||
    error.severity ||
    /database|connection|ECONNREFUSED|ETIMEDOUT/i.test(error.message || '')
  )
);

const isMalformedJsonError = (error) => (
  error instanceof SyntaxError &&
  error.status === 400 &&
  'body' in error
);

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || error.status || 500;

  if (isMalformedJsonError(error)) {
    statusCode = 400;
    error.message = 'Malformed JSON request body.';
  } else if (statusCode >= 500 && isDatabaseError(error)) {
    statusCode = 503;
  }

  const message = statusCode >= 500 && config.app.isProduction
    ? 'Internal server error.'
    : statusCode === 503
      ? 'Service temporarily unavailable. Please try again later.'
    : error.message || 'Internal server error.';

  const payload = {
    error: {
      message,
      request_id: req.id,
    },
  };

  if (error.details && statusCode < 500) {
    payload.error.details = error.details;
  }

  if (error.retryAfterSeconds) {
    res.setHeader('Retry-After', String(error.retryAfterSeconds));
  }

  const logFields = {
    method: req.method,
    path: req.originalUrl,
    status_code: statusCode,
    message: error.message,
    stack: config.app.isProduction ? undefined : error.stack,
  };

  if (statusCode >= 500) {
    logger.error('request_failed', logFields);
  } else if (statusCode === 429 || statusCode === 403) {
    logger.security('request_rejected', logFields);
  } else {
    logger.warn('request_error', logFields);
  }

  if (statusCode >= 500 && !config.app.isProduction) {
    payload.error.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  errorHandler,
};
