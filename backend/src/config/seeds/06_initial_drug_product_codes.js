/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_product_codes RESTART IDENTITY;')
  await knex('drug_product_codes').insert([
    {
      "product_id": 1,
      "value": "03585554088980"
    },
    {
      "product_id": 1,
      "value": "01417282"
    },
    {
      "product_id": 1,
      "value": "01417280"
    },
    {
      "product_id": 2,
      "value": "3400931923077"
    },
    {
      "product_id": 2,
      "value": "61063668"
    },
    {
      "product_id": 2,
      "value": "61063734"
    },
    {
      "product_id": 3,
      "value": "18901296108045"
    },
     {
      "product_id": 3,
      "value": "8901296108048"
    },
    {
      "product_id": 4,
      "value": "08901296111864"
    },
    {
      "product_id": 4,
      "value": "05238391"
    },
    {
      "product_id": 4,
      "value": "05232920"
    },
    {
      "product_id": 5,
      "value": "3582910075820"
    },
    {
      "product_id": 9,
      "value": "3582910089643"
    },
    {
      "product_id": 11,
      "value": "01417320"
    },
    {
      "product_id": 11,
      "value": "01417321"
    },
    {
      "product_id": 13,
      "value": "18902031004554"
    },
    {
      "product_id": 14,
      "value": "3582910089636"
    },
    {
      "product_id": 15,
      "value": "03400922385563"
    },
    {
      "product_id": 17,
      "value": "3760049895247"
    },
    {
      "product_id": 18,
      "value": "6940726915049"
    }
  ]);
};
