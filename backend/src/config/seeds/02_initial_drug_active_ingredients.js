/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_active_ingredients RESTART IDENTITY CASCADE;')
  await knex('drug_active_ingredients').insert([
    {
      "name": "Paracetamol"
    },
    {
      "name": "Diosmectite"
    },
    {
      "name": "Iron"
    },
    {
      "name": "Vitamin B12"
    },
    {
      "name": "Folic Acid"
    },
    {
      "name": "Arterolane Maleate"
    },
    {
      "name": "Piperaquine Phosphate"
    },
    {
      "name": "Metopimazine"
    },
    {
      "name": "Betamethasone"
    },
    {
      "name": "Albendazole"
    },
    {
      "name": "Metronidazole"
    },
    {
      "name": "Calcium"
    },
    {
      "name": "Vitamin C"
    },
    {
      "name": "Quinine Sulphate"
    },
    {
      "name": "Fluconazole"
    },
    {
      "name": "Helicidine"
    },
    {
      "name": "Cyproheptadine hydrochloride"
    },
    {
      "name": "Carnitine hydrochloride"
    },
    {
      "name": "Lysine hydrochloride"
    },
    {
      "name": "Vitamin B1"
    },
    {
      "name": "Vitamin B6"
    },
    {
      "name": "Magnesium"
    },
    {
      "name": "Vitamin B2"
    },
    {
      "name": "Organic Spirulina"
    }
  ]);
};
