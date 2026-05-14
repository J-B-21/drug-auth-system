/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_item_codes', (table) => {
    table.increments('id').primary();
    table.integer('item_id').notNullable().references('id').inTable('drug_items').onDelete('CASCADE').onUpdate('CASCADE');
    table.enum('type', ['QR', 'Bar']).notNullable();
    table.enum('location', ['Face', 'Flap', 'Bottle', 'Tube', 'Leaflet']).notNullable();
    table.string('value').unique().notNullable();
    
    table.timestamps(true, true); // Adds created_at and updated_at

    table.unique(['item_id', 'type', 'location']); // Ensures an item can't have the same code type on the same location more than once
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_item_codes')
};
