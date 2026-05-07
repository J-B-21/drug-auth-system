/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_products', (table) => {
    table.increments('id').primary();
    table.integer('brand_id').notNullable().references('id').inTable('drug_brands').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('gtin').unique().notNullable();
    table.string('barcode').unique().notNullable();
    
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
