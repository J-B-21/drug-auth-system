const path = require('node:path');
const Joi = require('joi');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const splitList = (value) => String(value || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const parseTrustProxy = (value) => {
  const normalized = String(value).trim().toLowerCase();

  if (!normalized || normalized === 'false' || normalized === '0') {
    return false;
  }

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  return value;
};

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  APP_NAME: Joi.string().trim().min(1).default('Drug Authentication API'),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),

  TRUST_PROXY: Joi.string().default('0'),
  REQUEST_BODY_LIMIT: Joi.string().trim().default('32kb'),
  REQUEST_TIMEOUT_MS: Joi.number().integer().min(1000).default(30000),
  KEEP_ALIVE_TIMEOUT_MS: Joi.number().integer().min(1000).default(65000),
  SERVER_SHUTDOWN_TIMEOUT_MS: Joi.number().integer().min(1000).default(10000),

  CORS_ORIGINS: Joi.string().allow('').default(''),
  CORS_MAX_AGE_SECONDS: Joi.number().integer().min(0).default(600),

  DB_HOST: Joi.string().trim().min(1).required(),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_USER: Joi.string().trim().min(1).required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_DATABASE: Joi.string().trim().min(1).required(),
  DB_SSL: Joi.boolean().truthy('true').truthy('1').falsy('false').falsy('0').default(false),
  DB_POOL_MIN: Joi.number().integer().min(0).default(0),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),

  HEALTH_DB_TIMEOUT_MS: Joi.number().integer().min(100).default(1500),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(120),
  VERIFY_RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  VERIFY_RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(30),

  ABUSE_WINDOW_MS: Joi.number().integer().min(10000).default(600000),
  ABUSE_FAILURE_THRESHOLD: Joi.number().integer().min(1).default(8),
  ABUSE_BASE_BLOCK_MS: Joi.number().integer().min(1000).default(30000),
  ABUSE_MAX_BLOCK_MS: Joi.number().integer().min(1000).default(900000),
  ABUSE_REPEATED_CODE_THRESHOLD: Joi.number().integer().min(2).default(12),
  ABUSE_UNIQUE_FAILURE_THRESHOLD: Joi.number().integer().min(2).default(40),
  ABUSE_MAX_TRACKED_CLIENTS: Joi.number().integer().min(100).default(10000),

  FORENSIC_WINDOW_MS: Joi.number().integer().min(1000).default(600000),
  FORENSIC_DISTINCT_IPS_THRESHOLD: Joi.number().integer().min(2).default(2),
  FORENSIC_EXCESSIVE_PRODUCT_ATTEMPTS: Joi.number().integer().min(1).default(20),
  FORENSIC_EXCESSIVE_BATCH_ATTEMPTS: Joi.number().integer().min(1).default(15),
  FORENSIC_EXCESSIVE_ITEM_ATTEMPTS: Joi.number().integer().min(1).default(10),
  FORENSIC_RAPID_SCAN_WINDOW_MS: Joi.number().integer().min(1000).default(30000),
  FORENSIC_RAPID_SCAN_THRESHOLD: Joi.number().integer().min(2).default(8),
  FORENSIC_GEO_INCONSISTENT_DISTANCE_KM: Joi.number().min(0).default(200),
  FORENSIC_GEO_INCONSISTENT_WINDOW_MS: Joi.number().integer().min(1000).default(86400000),
  FORENSIC_STATUS_WINDOW_MS: Joi.number().integer().min(1000).default(86400000),
}).unknown(true);

const { error, value: env } = schema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  const details = error.details.map((detail) => detail.message).join('; ');
  throw new Error(`Environment validation failed: ${details}`);
}

const corsOrigins = splitList(env.CORS_ORIGINS);

if (env.NODE_ENV === 'production' && corsOrigins.includes('*')) {
  throw new Error('Environment validation failed: CORS_ORIGINS cannot contain "*" in production.');
}

if (env.NODE_ENV === 'production' && !env.DB_PASSWORD) {
  throw new Error('Environment validation failed: DB_PASSWORD is required in production.');
}

const trustProxy = parseTrustProxy(env.TRUST_PROXY);

if (trustProxy === true) {
  throw new Error('Environment validation failed: TRUST_PROXY=true is too broad; use a hop count such as 1.');
}

const databaseEnvironment = ['production', 'staging'].includes(env.NODE_ENV)
  ? env.NODE_ENV
  : 'development';

module.exports = Object.freeze({
  app: {
    name: env.APP_NAME,
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    logLevel: env.LOG_LEVEL,
  },
  server: {
    port: env.PORT,
    trustProxy,
    requestBodyLimit: env.REQUEST_BODY_LIMIT,
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    keepAliveTimeoutMs: env.KEEP_ALIVE_TIMEOUT_MS,
    shutdownTimeoutMs: env.SERVER_SHUTDOWN_TIMEOUT_MS,
  },
  cors: {
    origins: corsOrigins,
    maxAgeSeconds: env.CORS_MAX_AGE_SECONDS,
  },
  database: {
    environment: databaseEnvironment,
    connection: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      ssl: env.DB_SSL ? { rejectUnauthorized: true } : false,
    },
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
    },
  },
  health: {
    dbTimeoutMs: env.HEALTH_DB_TIMEOUT_MS,
  },
  rateLimits: {
    global: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    verification: {
      windowMs: env.VERIFY_RATE_LIMIT_WINDOW_MS,
      maxRequests: env.VERIFY_RATE_LIMIT_MAX_REQUESTS,
    },
  },
  abuse: {
    windowMs: env.ABUSE_WINDOW_MS,
    failureThreshold: env.ABUSE_FAILURE_THRESHOLD,
    baseBlockMs: env.ABUSE_BASE_BLOCK_MS,
    maxBlockMs: env.ABUSE_MAX_BLOCK_MS,
    repeatedCodeThreshold: env.ABUSE_REPEATED_CODE_THRESHOLD,
    uniqueFailureThreshold: env.ABUSE_UNIQUE_FAILURE_THRESHOLD,
    maxTrackedClients: env.ABUSE_MAX_TRACKED_CLIENTS,
  },
  forensics: {
    windowMs: env.FORENSIC_WINDOW_MS,
    distinctIpThreshold: env.FORENSIC_DISTINCT_IPS_THRESHOLD,
    excessiveProductAttempts: env.FORENSIC_EXCESSIVE_PRODUCT_ATTEMPTS,
    excessiveBatchAttempts: env.FORENSIC_EXCESSIVE_BATCH_ATTEMPTS,
    excessiveItemAttempts: env.FORENSIC_EXCESSIVE_ITEM_ATTEMPTS,
    rapidScanWindowMs: env.FORENSIC_RAPID_SCAN_WINDOW_MS,
    rapidScanThreshold: env.FORENSIC_RAPID_SCAN_THRESHOLD,
    geoInconsistentDistanceKm: env.FORENSIC_GEO_INCONSISTENT_DISTANCE_KM,
    geoScanWindowMs: env.FORENSIC_GEO_INCONSISTENT_WINDOW_MS,
    statusWindowMs: env.FORENSIC_STATUS_WINDOW_MS,
  },
});
