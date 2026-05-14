/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_brands RESTART IDENTITY CASCADE;')
  await knex('drug_brands').insert([
    {
      "name": "Efferalgan",
      "manufacturer_id": 1
    },
    {
      "name": "Smecta Orange-Vanilla",
      "manufacturer_id": 2
    },
    {
      "name": "Ranferon -12",
      "manufacturer_id": 3
    },
    {
      "name": "Synriam",
      "manufacturer_id": 3
    },
    {
      "name": "Doliprane",
      "manufacturer_id": 4
    },
    {
      "name": "Vogalene",
      "manufacturer_id": 5
    },
    {
      "name": "Celestene",
      "manufacturer_id": 6
    },
    {
      "name": "Zentel",
      "manufacturer_id": 7
    },
    {
      "name": "Flagyl",
      "manufacturer_id": 4
    },
    {
      "name": "Ca-C1000",
      "manufacturer_id": 8
    },
    {
      "name": "Quinine Sulphate",
      "manufacturer_id": 9
    },
    {
      "name": "Flucazol",
      "manufacturer_id": 10
    },
    {
      "name": "Helicidine",
      "manufacturer_id": 11
    },
    {
      "name": "Neuheptavit",
      "manufacturer_id": 12
    },
    {
      "name": "Magnesium Vitamin B6",
      "manufacturer_id": 13
    },
    {
      "name": "Organic Spirulina",
      "manufacturer_id": 14
    }
  ]);
};
