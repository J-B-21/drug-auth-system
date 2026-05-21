// Database connection helper.
// Selects the Knex configuration based on NODE_ENV and exports a shared Knex instance.
const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  throw new Error(`Missing Knex configuration for environment: ${environment}`);
}

module.exports = knex(config);
