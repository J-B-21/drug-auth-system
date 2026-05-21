/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('drug_scan_logs', (table) => {
    table.bigIncrements('id').primary();
    table.text('scanned_value').notNullable();
    table.string('input_type', 50).notNullable();
    table.boolean('success').notNullable().defaultTo(false);
    table.string('failure_reason', 50).nullable();
    table.string('verification_source', 50).nullable();
    table.integer('matched_product_id').nullable().references('id').inTable('drug_products').onDelete('SET NULL').onUpdate('CASCADE');
    table.integer('matched_item_id').nullable().references('id').inTable('drug_items').onDelete('SET NULL').onUpdate('CASCADE');
    table.integer('matched_batch_id').nullable().references('id').inTable('drug_batches').onDelete('SET NULL').onUpdate('CASCADE');
    table.jsonb('metadata').notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    table.timestamp('scanned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.timestamps(true, true);

    table.index(['scanned_value'], 'drug_scan_logs_scanned_value_idx');
    table.index(['input_type'], 'drug_scan_logs_input_type_idx');
    table.index(['success'], 'drug_scan_logs_success_idx');
    table.index(['matched_product_id'], 'drug_scan_logs_matched_product_id_idx');
    table.index(['matched_item_id'], 'drug_scan_logs_matched_item_id_idx');
    table.index(['matched_batch_id'], 'drug_scan_logs_matched_batch_id_idx');
    table.index(['scanned_value', 'scanned_at'], 'drug_scan_logs_value_scanned_at_idx');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_scan_logs');
};
