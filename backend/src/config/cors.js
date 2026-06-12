const cors = require('cors');

const config = require('./env');
const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

const LOCAL_DEVELOPMENT_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const allowedOrigins = new Set(config.cors.origins);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  return !config.app.isProduction && LOCAL_DEVELOPMENT_ORIGIN.test(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    logger.security('cors_origin_blocked', {
      origin,
    });

    return callback(new AppError('CORS origin is not allowed.', 403));
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
  maxAge: config.cors.maxAgeSeconds,
  optionsSuccessStatus: 204,
};

module.exports = cors(corsOptions);
