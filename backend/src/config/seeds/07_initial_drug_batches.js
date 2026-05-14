/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_batches RESTART IDENTITY CASCADE;')
  await knex('drug_batches').insert([
    {
      "product_id": 1,
      "number": "B0250",
      "expiry_date": "2026-05-31"
    },
    {
      "product_id": 2,
      "number": "C55283",
      "expiry_date": "2027-03-31",
    },
    {
      "product_id": 3,
      "number": "ALB0135",
      "expiry_date": "2026-06-30",
    },
    {
      "product_id": 4,
      "number": "DFG1012A",
      "expiry_date": "2027-01-31",
    },
    {
      "product_id": 5,
      "number": "350",
      "expiry_date": "2027-06-30",
    },
    {
      "product_id": 6,
      "number": "241207",
      "expiry_date": "2026-09-30",
    },
    {
      "product_id": 7,
      "number": "531W",
      "expiry_date": "2026-09-30",
    },
    {
      "product_id": 8,
      "number": "G7686",
      "expiry_date": "2026-07-31",
    },
    {
      "product_id": 9,
      "number": "4R1KL",
      "expiry_date": "2026-06-30",
    },
    {
      "product_id": 10,
      "number": "A2438",
      "expiry_date": "2026-07-31",
    },
    {
      "product_id": 11,
      "number": "B4361",
      "expiry_date": "2027-02-28",
    },
    {
      "product_id": 12,
      "number": "G1686",
      "expiry_date": "2027-08-31",
    },
    {
      "product_id": 13,
      "number": "AC240006A",
      "expiry_date": "2026-12-31",
    },
    {
      "product_id": 14,
      "number": "3R3A5",
      "expiry_date": "2026-10-31",
    },
    {
      "product_id": 15,
      "number": "250001Z",
      "expiry_date": "2027-12-31",
    },
    {
      "product_id": 16,
      "number": "SH1642403",
      "expiry_date": "2027-04-30",
    },
    {
      "product_id": 17,
      "number": "4235/5",
      "expiry_date": "2027-08-31",
    },
    {
      "product_id": 18,
      "number": "200CC",
      "expiry_date": "2028-07-28",
    }
  ]);
};
