/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_units', (table) => {
    table.increments('id').primary();
    table.integer('product_id').notNullable().references('id').inTable('drug_products').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('serial_number').unique().notNullable();
    table.string('batch_number').notNullable();
    table.date('expiry_date').notNullable();
    
    table.timestamps(true, true); // Adds created_at and updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_units')
};
