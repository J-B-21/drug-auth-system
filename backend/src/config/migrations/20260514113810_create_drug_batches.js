/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_batches', (table) => {
    table.increments('id').primary();
    table.integer('product_id').notNullable().references('id').inTable('drug_products').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('number').notNullable();
    table.date('expiry_date').notNullable();
    
    table.timestamps(true, true); // Adds created_at and updated_at

    table.unique(['product_id', 'number']); // Ensures a product cannot have duplicate batch numbers

    table.index(['number']); // Indexes the batch number for faster lookups
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_batches')
};
