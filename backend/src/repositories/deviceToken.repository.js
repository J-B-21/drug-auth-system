const db = require('../config/database');

class DeviceTokenRepository {
  constructor(knex = db) {
    this.db = knex;
  }

  async upsert(token, ipHash = null, metadata = {}) {
    const existing = await this.db('device_push_tokens').where({ token }).first();
    if (existing) {
      await this.db('device_push_tokens').where({ token }).update({ ip_hash: ipHash, metadata, last_seen_at: this.db.fn.now() });
      return await this.db('device_push_tokens').where({ token }).first();
    }

    const [row] = await this.db('device_push_tokens').insert({ token, ip_hash: ipHash, metadata }).returning('*');
    return row;
  }

  async findByIpHashes(ipHashes = []) {
    if (!ipHashes || ipHashes.length === 0) return [];
    return this.db('device_push_tokens').select('*').whereIn('ip_hash', ipHashes);
  }

  async findByTokens(tokens = []) {
    if (!tokens || tokens.length === 0) return [];
    return this.db('device_push_tokens').select('*').whereIn('token', tokens);
  }
}

module.exports = DeviceTokenRepository;
