const config = require('../config/env');
const asyncHandler = require('../middleware/asyncHandler');
const healthService = require('../services/health.service');

const live = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: config.app.name,
    uptime_seconds: Math.floor(process.uptime()),
    request_id: req.id,
  });
};

const ready = asyncHandler(async (req, res) => {
  const readiness = await healthService.getReadiness();

  res.status(readiness.ready ? 200 : 503).json({
    status: readiness.status,
    checks: readiness.checks,
    request_id: req.id,
  });
});

module.exports = {
  live,
  ready,
};
