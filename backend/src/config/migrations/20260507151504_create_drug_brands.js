/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_brands', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description').notNullable();
    table.string('manufacturer').notNullable();
    
    table.timestamps(true, true); // Adds created_at and updated_at

    table.unique(['name', 'manufacturer']); // Ensure a manufacturer can't have multiple brands with the same name
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_brands')
};
