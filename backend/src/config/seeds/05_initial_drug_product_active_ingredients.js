/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_product_active_ingredients RESTART IDENTITY;')
  await knex('drug_product_active_ingredients').insert([
    {
      "product_id": 1,
      "ingredient_id": 1,
      "dosage_per_unit": "500 mg"
    },
    {
      "product_id": 2,
      "ingredient_id": 2,
      "dosage_per_unit": "3 g"
    },
    {
      "product_id": 3,
      "ingredient_id": 3,
      "dosage_per_unit": "41 mg"
    },
    {
      "product_id": 3,
      "ingredient_id": 4,
      "dosage_per_unit": "50 mcg"
    },
    {
      "product_id": 3,
      "ingredient_id": 5,
      "dosage_per_unit": "1.5 mg"
    },
    {
      "product_id": 4,
      "ingredient_id": 6,
      "dosage_per_unit": "150 mg"
    },
    {
      "product_id": 4,
      "ingredient_id": 7,
      "dosage_per_unit": "750 mg"
    },
    {
      "product_id": 5,
      "ingredient_id": 1,
      "dosage_per_unit": "1000 mg"
    },
    {
      "product_id": 6,
      "ingredient_id": 8,
      "dosage_per_unit": "100 mg"
    },
    {
      "product_id": 7,
      "ingredient_id": 9,
      "dosage_per_unit": "2 mg"
    },
    {
      "product_id": 8,
      "ingredient_id": 10,
      "dosage_per_unit": "0.4 g"
    },
    {
      "product_id": 9,
      "ingredient_id": 11,
      "dosage_per_unit": "500 mg"
    },
    {
      "product_id": 10,
      "ingredient_id": 12,
      "dosage_per_unit": "130 mg"
    },
    {
      "product_id": 10,
      "ingredient_id": 13,
      "dosage_per_unit": "1000 mg"
    },
    {
      "product_id": 11,
      "ingredient_id": 1,
      "dosage_per_unit": "500 mg"
    },
    {
      "product_id": 12,
      "ingredient_id": 14,
      "dosage_per_unit": "300 mg"
    },
    {
      "product_id": 13,
      "ingredient_id": 15,
      "dosage_per_unit": "100 mg"
    },
    {
      "product_id": 14,
      "ingredient_id": 11,
      "dosage_per_unit": "250 mg"
    },
    {
      "product_id": 15,
      "ingredient_id": 16,
      "dosage_per_unit": "10 ml"
    },
    {
      "product_id": 16,
      "ingredient_id": 17,
      "dosage_per_unit": "1.5 mg"
    },
    {
      "product_id": 16,
      "ingredient_id": 18,
      "dosage_per_unit": "150 mcg"
    },
    {
      "product_id": 16,
      "ingredient_id": 19,
      "dosage_per_unit": "150 mg"
    },
    {
      "product_id": 16,
      "ingredient_id": 20,
      "dosage_per_unit": "10 mcg"
    },
    {
      "product_id": 16,
      "ingredient_id": 21,
      "dosage_per_unit": "10 mcg"
    },
    {
      "product_id": 16,
      "ingredient_id": 4,
      "dosage_per_unit": "10 mcg"
    },
    {
      "product_id": 17,
      "ingredient_id": 22,
      "dosage_per_unit": "200 mg"
    },
    {
      "product_id": 17,
      "ingredient_id": 20,
      "dosage_per_unit": "1.4 mg"
    },
    {
      "product_id": 17,
      "ingredient_id": 23,
      "dosage_per_unit": "1.6 mg"
    },
    {
      "product_id": 17,
      "ingredient_id": 21,
      "dosage_per_unit": "2 mg"
    },
    {
      "product_id": 17,
      "ingredient_id": 4,
      "dosage_per_unit": "1 mcg"
    },
    {
      "product_id": 18,
      "ingredient_id": 24,
      "dosage_per_unit": "500 mg"
    }
  ]);
};
