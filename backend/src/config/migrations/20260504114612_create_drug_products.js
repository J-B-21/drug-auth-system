/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_products', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('manufacturer').notNullable();
    table.string('batch_number').notNullable();
    table.date('expiry_date').notNullable();
    
    // Optimized lookup fields: unique() creates a B-Tree index for faster (O(log n)) lookups
    table.string('barcode', 13).unique().notNullable();
    table.string('qr_token', 255).unique().nullable();
    
    table.enum('status', ['authentic', 'recalled', 'expired', 'suspicious']).defaultTo('authentic');
    table.timestamps(true, true); // Adds created_at and updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_products')
};
