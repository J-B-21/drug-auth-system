/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_item_codes', (table) => {
    table.increments('id').primary();
    table.integer('item_id').notNullable().references('id').inTable('drug_items').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('value').unique().notNullable();
    
    table.timestamps(true, true); // Adds created_at and updated_at

    table.index(['value']); // Indexes the code value for faster lookups
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_item_codes')
};
