exports.up = function (knex) {
  return knex.schema.createTable('device_push_tokens', (table) => {
    table.increments('id').primary();
    table.text('token').notNullable().unique();
    table.text('ip_hash').nullable().index();
    table.jsonb('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_seen_at').defaultTo(knex.fn.now()).index();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('device_push_tokens');
};
