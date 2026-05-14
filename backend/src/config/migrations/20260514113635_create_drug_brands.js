/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_brands', (table) => {
    table.increments('id').primary();
    table.string('name').unique().notNullable();
    table.integer('manufacturer_id').notNullable().references('id').inTable('drug_manufacturers').onDelete('CASCADE').onUpdate('CASCADE');
    
    table.timestamps(true, true); // Adds created_at and updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_brands')
};
