/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_product_active_ingredients', (table) => {
    table.increments('id').primary();
    table.integer('product_id').notNullable().references('id').inTable('drug_products').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('ingredient_id').notNullable().references('id').inTable('drug_active_ingredients').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('dosage_per_unit').notNullable();
    
    table.timestamps(true, true); // Adds created_at and updated_at

    table.unique(['product_id', 'ingredient_id']); // Ensures a product having the same ingredient can't be listed multiple times
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_product_active_ingredients')
};
