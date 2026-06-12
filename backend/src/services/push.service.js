const https = require('node:https');
const ScanLogRepository = require('../repositories/scanLog.repository');
const DeviceTokenRepository = require('../repositories/deviceToken.repository');
const { sha256 } = require('../utils/hash');

const scanLogRepo = new ScanLogRepository();
const deviceRepo = new DeviceTokenRepository();

class PushService {
  async notifyPreviousScanners({ scannedValue, excludeTokens = [], title, body, payload = {} }) {
    if (!scannedValue) return;
    const scannedHash = sha256(scannedValue);
    const cutoff = Date.now() - (1000 * 60 * 60 * 24 * 7); // 7 days

    const recentLogs = await scanLogRepo.findRecentLogsByScannedValueHash(scannedHash, new Date(cutoff).toISOString());
    const ipHashes = [...new Set(recentLogs.map(l => l.ip_hash).filter(Boolean))];
    if (ipHashes.length === 0) return;

    const tokens = await deviceRepo.findByIpHashes(ipHashes);
    const tokensToNotify = tokens.map(t => t.token).filter(t => !excludeTokens.includes(t));
    if (tokensToNotify.length === 0) return;

    // Build messages
    const messages = tokensToNotify.map(token => ({
      to: token,
      title,
      body,
      data: { payload },
    }));

    // Send in batches of 100
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const chunk = messages.slice(i, i + batchSize);
      await this._sendChunk(chunk);
    }
  }

  _sendChunk(messages) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(messages);
      const options = {
        hostname: 'exp.host',
        path: '/--/api/v2/push/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            resolve(parsed);
          } catch (e) {
            resolve({ ok: false, raw: body });
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(data);
      req.end();
    });
  }
}

module.exports = new PushService();
