const { rateLimit } = require('express-rate-limit');

const config = require('../config/env');
const logger = require('../utils/logger');

const rateLimitLogger = {
  warn: (error) => logger.warn('rate_limiter_warning', {
    message: error && error.message ? error.message : String(error),
  }),
  error: (error) => logger.error('rate_limiter_error', {
    message: error && error.message ? error.message : String(error),
  }),
};

const buildHandler = (policyName) => (req, res) => {
  logger.security('rate_limit_exceeded', {
    policy: policyName,
    ip: req.ip,
    path: req.originalUrl,
  });

  res.status(429).json({
    error: {
      message: 'Too many requests. Please try again later.',
      request_id: req.id,
    },
  });
};

const globalRateLimiter = rateLimit({
  windowMs: config.rateLimits.global.windowMs,
  limit: config.rateLimits.global.maxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  identifier: 'public-api',
  skip: (req) => req.path.startsWith('/health'),
  handler: buildHandler('public-api'),
  logger: rateLimitLogger,
});

const verificationRateLimiter = rateLimit({
  windowMs: config.rateLimits.verification.windowMs,
  limit: config.rateLimits.verification.maxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  identifier: 'verification',
  handler: buildHandler('verification'),
  logger: rateLimitLogger,
});

module.exports = {
  globalRateLimiter,
  verificationRateLimiter,
};
