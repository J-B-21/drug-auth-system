const config = require('../config/env');
const { getRequestContext } = require('../middleware/requestContext');

const LEVEL_WEIGHTS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

const configuredLevel = LEVEL_WEIGHTS[config.app.logLevel] || LEVEL_WEIGHTS.info;

const redact = (value) => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redact);
  }

  return Object.entries(value).reduce((safe, [key, entry]) => {
    if (/password|secret|token|authorization|api[_-]?key/i.test(key)) {
      safe[key] = '[REDACTED]';
    } else {
      safe[key] = redact(entry);
    }

    return safe;
  }, {});
};

const write = (level, message, fields = {}) => {
  if ((LEVEL_WEIGHTS[level] || LEVEL_WEIGHTS.info) < configuredLevel) {
    return;
  }

  const context = getRequestContext();
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: config.app.name,
    message,
    request_id: fields.request_id || context.requestId,
    ...redact(fields),
  };

  const output = JSON.stringify(payload);

  if (level === 'error') {
    console.error(output);
    return;
  }

  console.log(output);
};

module.exports = {
  debug: (message, fields) => write('debug', message, fields),
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
  security: (event, fields = {}) => write('warn', 'security_event', {
    event,
    security_event: true,
    ...fields,
  }),
};
