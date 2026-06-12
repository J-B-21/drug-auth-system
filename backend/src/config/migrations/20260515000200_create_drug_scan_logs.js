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
    table.string('request_id', 80).nullable();
    table.string('scanned_value_hash', 64).nullable();
    table.string('ip_hash', 64).nullable();
    table.string('user_agent_hash', 64).nullable();
    table.boolean('suspicious').notNullable().defaultTo(false);
    table.jsonb('security_flags').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.timestamp('scanned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.timestamps(true, true);

    table.index(['scanned_value'], 'drug_scan_logs_scanned_value_idx');
    table.index(['input_type'], 'drug_scan_logs_input_type_idx');
    table.index(['success'], 'drug_scan_logs_success_idx');
    table.index(['matched_product_id'], 'drug_scan_logs_matched_product_id_idx');
    table.index(['matched_item_id'], 'drug_scan_logs_matched_item_id_idx');
    table.index(['matched_batch_id'], 'drug_scan_logs_matched_batch_id_idx');
    table.index(['scanned_value', 'scanned_at'], 'drug_scan_logs_value_scanned_at_idx');
    table.index(['request_id'], 'drug_scan_logs_request_id_idx');
    table.index(['scanned_value_hash', 'scanned_at'], 'drug_scan_logs_value_hash_scanned_at_idx');
    table.index(['ip_hash', 'scanned_at'], 'drug_scan_logs_ip_hash_scanned_at_idx');
    table.index(['ip_hash', 'success', 'scanned_at'], 'drug_scan_logs_ip_success_scanned_at_idx');
    table.index(['failure_reason', 'scanned_at'], 'drug_scan_logs_failure_scanned_at_idx');
  });

  return knex.schema.raw(`
    CREATE INDEX drug_scan_logs_suspicious_scanned_at_idx
    ON drug_scan_logs (scanned_at)
    WHERE suspicious = true
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drug_scan_logs');
};
