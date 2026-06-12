// Knex configuration for different environments.
// Reads validated DB connection settings from centralized configuration.
// Do not include secrets in source control; `.env` is gitignored.
const config = require('./src/config/env');

const buildConfig = ({ includeSeeds = false } = {}) => ({
  client: 'pg',
  connection: config.database.connection,
  pool: config.database.pool,
  migrations: {
    directory: './src/config/migrations'
  },
  ...(includeSeeds ? {
    seeds: {
      directory: './src/config/seeds'
    }
  } : {})
});

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: buildConfig({ includeSeeds: true }),

  test: buildConfig({ includeSeeds: true }),

  staging: buildConfig(),

  production: buildConfig()

};
