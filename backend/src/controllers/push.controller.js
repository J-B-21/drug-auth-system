const asyncHandler = require('../middleware/asyncHandler');
const DeviceTokenRepository = require('../repositories/deviceToken.repository');
const { sha256 } = require('../utils/hash');

const deviceRepo = new DeviceTokenRepository();

const registerToken = asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }

  const ipHash = req.ip ? sha256(req.ip) : null;
  const metadata = req.body.metadata || {};

  const row = await deviceRepo.upsert(token, ipHash, metadata);
  res.status(200).json({ ok: true, token: row.token });
});

const simulateNotify = asyncHandler(async (req, res) => {
  const { scannedValue, excludeTokens = [] } = req.body || {};
  if (!scannedValue) return res.status(400).json({ error: 'scannedValue required' });

  const pushService = require('../services/push.service');
  await pushService.notifyPreviousScanners({ scannedValue, excludeTokens, title: 'Simulated Alert', body: 'This is a test alert', payload: { simulated: true } });
  res.status(200).json({ ok: true });
});

module.exports = {
  registerToken,
  simulateNotify,
};
