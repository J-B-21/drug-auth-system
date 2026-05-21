/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_item_codes RESTART IDENTITY;')
  await knex('drug_item_codes').insert([
    {
      "item_id": 1,
      "value": "01590553843587"
    },
    {
      "item_id": 3,
      "value": "ALB0135CJPQRRP"
    },
    {
      "item_id": 4,
      "value": "8JNFV2NR8Y7"
    },
    {
      "item_id": 5,
      "value": "0013501"
    },
    {
      "item_id": 6,
      "value": "1748449803040"
    },
    {
      "item_id": 7,
      "value": "C202009"
    },
    {
      "item_id": 7,
      "value": "1750956335488"
    },
    {
      "item_id": 8,
      "value": "1751124696127"
    },
    {
      "item_id": 9,
      "value": "1751359337888"
    },
    {
      "item_id": 10,
      "value": "1750268866236"
    },
    {
      "item_id": 14,
      "value": "26SGA010N1YIALR01RB"
    },
    {
      "item_id": 14,
      "value": "1751444220552"
    },
    {
      "item_id": 15,
      "value": "3040000"
    },
    {
      "item_id": 16,
      "value": "05525346333492"
    },
    {
      "item_id": 17,
      "value": "1771915087736"
    },
    {
      "item_id": 18,
      "value": "1746554101211"
    },
    {
      "item_id": 19,
      "value": "8437481"
    },
    {
      "item_id": 20,
      "value": "3760049890075"
    }
  ]);
};
