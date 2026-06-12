const { AsyncLocalStorage } = require('node:async_hooks');
const crypto = require('node:crypto');

const storage = new AsyncLocalStorage();

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{8,80}$/;

const normalizeRequestId = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return REQUEST_ID_PATTERN.test(trimmed) ? trimmed : null;
};

const requestContext = (req, res, next) => {
  const requestId = normalizeRequestId(req.get('X-Request-Id')) || crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  storage.run({
    requestId,
    startedAt: Date.now(),
  }, next);
};

const getRequestContext = () => storage.getStore() || {};

module.exports = {
  getRequestContext,
  requestContext,
};
