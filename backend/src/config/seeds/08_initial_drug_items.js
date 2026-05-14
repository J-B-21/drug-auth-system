/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_items RESTART IDENTITY CASCADE;')
  await knex('drug_items').insert([
    {
      "batch_id": 1,
    },
    {
      "batch_id": 2,
    },
    {
      "batch_id": 3,
    },
    {
      "batch_id": 4,
    },
    {
      "batch_id": 5,
    },
    {
      "batch_id": 6,
    },
    {
      "batch_id": 7,
    },
    {
      "batch_id": 8,
    },
    {
      "batch_id": 9,
    },
    {
      "batch_id": 8,
    },
    {
      "batch_id": 10,
    },
    {
      "batch_id": 11,
    },
    {
      "batch_id": 12,
    },
    {
      "batch_id": 13,
    },
    {
      "batch_id": 14,
    },
    {
      "batch_id": 1,
    },
    {
      "batch_id": 15,
    },
    {
      "batch_id": 6,
    },
    {
      "batch_id": 16,
    },
    {
      "batch_id": 17,
    },
    {
      "batch_id": 18,
    }
  ]);
};
