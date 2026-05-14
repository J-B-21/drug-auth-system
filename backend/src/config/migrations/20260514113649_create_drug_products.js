/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_products', (table) => {
    table.increments('id').primary();
    table.integer('brand_id').notNullable().references('id').inTable('drug_brands').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('form').notNullable();
    table.integer('quantity').notNullable();
    table.integer('dosage_unit').notNullable().defaultTo(1);
    table.string('leaflet_url').notNullable();

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
