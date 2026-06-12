// Express application setup and route registration.
// This file configures middleware, health checks, and verification endpoints.
const express = require('express');
const helmet = require('helmet');

const config = require('./config/env');
const corsMiddleware = require('./config/cors');
const healthController = require('./controllers/health.controller');
const verificationRoutes = require('./routes/verification.routes');
const pushRoutes = require('./routes/push.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { globalRateLimiter, verificationRateLimiter } = require('./middleware/rateLimiters');
const { notFoundHandler } = require('./middleware/notFoundHandler');
const { requestContext } = require('./middleware/requestContext');
const requestLogger = require('./middleware/requestLogger');
const sanitizePayload = require('./middleware/sanitizePayload');
const securityHeaders = require('./middleware/securityHeaders');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.server.trustProxy);

app.use(requestContext);
app.use(requestLogger);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: config.app.isProduction
    ? { maxAge: 15552000, includeSubDomains: true }
    : false,
  referrerPolicy: { policy: 'no-referrer' },
}));
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(globalRateLimiter);
app.use(express.json({
  limit: config.server.requestBodyLimit,
  strict: true,
  type: 'application/json',
}));
app.use(express.urlencoded({
  extended: false,
  limit: config.server.requestBodyLimit,
  parameterLimit: 20,
}));
app.use(sanitizePayload);

app.get('/health', healthController.live);
app.get('/health/live', healthController.live);
app.get('/health/ready', healthController.ready);

app.use('/api/v1/verify', verificationRateLimiter, verificationRoutes);
app.use('/api/v1/push', pushRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
