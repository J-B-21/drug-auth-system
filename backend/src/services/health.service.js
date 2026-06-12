const db = require('../config/database');
const config = require('../config/env');

const withTimeout = (promise, timeoutMs) => {
  let timeoutId;

  const timeout = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const checkDatabase = async () => {
  await withTimeout(db.raw('select 1 as ok'), config.health.dbTimeoutMs);

  return {
    status: 'ok',
  };
};

const getReadiness = async () => {
  const checks = {};

  try {
    checks.database = await checkDatabase();
  } catch (error) {
    checks.database = {
      status: 'unavailable',
    };
  }

  const ready = Object.values(checks).every((check) => check.status === 'ok');

  return {
    status: ready ? 'ready' : 'not_ready',
    ready,
    checks,
  };
};

module.exports = {
  getReadiness,
};
