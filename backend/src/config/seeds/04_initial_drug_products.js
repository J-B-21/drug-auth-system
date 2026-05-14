/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_products RESTART IDENTITY CASCADE;')
  await knex('drug_products').insert([
    {
      "brand_id": 1,
      "form": "Effervescent tablet",
      "quantity": 16,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/67326925/extrait/"
    },
    {
      "brand_id": 2,
      "form": "Powder for oral suspension",
      "quantity": 30,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/69584073/extrait/"
    },
    {
      "brand_id": 3,
      "form": "Elixir",
      "quantity": 200,
      "dosage_unit": 5,
      "leaflet_url": "https://medecify.com/product/ranferon-12-tonic-syrup-x200ml/"
    },
    {
      "brand_id": 4,
      "form": "Tablet",
      "quantity": 3,
      "leaflet_url": "https://www.apollopharmacy.in/medicine/synriam-tablet/"
    },
    {
      "brand_id": 5,
      "form": "Effervescent tablet",
      "quantity": 8,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/60234100/extrait/"
    },
    {
      "brand_id": 6,
      "form": "Drinkable solution",
      "quantity": 150,
      "dosage_unit": 150,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/66745607/extrait/"
    },
    {
      "brand_id": 7,
      "form": "Dispersible tablet",
      "quantity": 20,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/66171354/extrait/"
    },
    {
      "brand_id": 8,
      "form": "Oral suspension",
      "quantity": 10,
      "dosage_unit": 10,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/69731801/extrait/"
    },
    {
      "brand_id": 9,
      "form": "Tablet",
      "quantity": 14,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/61659061/extrait/"
    },
    {
      "brand_id": 10,
      "form": "Effervescent tablet",
      "quantity": 10,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/60332103/extrait/"
    },
    {
      "brand_id": 1,
      "form": "Tablet",
      "quantity": 16,
      "leaflet_url": "https://agence-prd.ansm.sante.fr/php/ecodex/notice/N0264656.htm"
    },
    {
      "brand_id": 11,
      "form": "Tablet",
      "quantity": 20,
      "leaflet_url": "https://www.medicines.org.uk/emc/product/14316/smpc/"
    },
    {
      "brand_id": 12,
      "form": "Capsule",
      "quantity": 10,
      "leaflet_url": "https://sante.ouest-france.fr/medicament/fluconazole-100-mg-gelule-mv00001998/"
    },
    {
      "brand_id": 9,
      "form": "Tablet",
      "quantity": 20,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/68818192/extrait/"
    },
    {
      "brand_id": 13,
      "form": "Syrup",
      "quantity": 125,
      "dosage_unit": 100,
      "leaflet_url": "https://base-donnees-publique.medicaments.gouv.fr/medicament/61404858/extrait/"
    },
    {
      "brand_id": 14,
      "form": "Syrup",
      "quantity": 200,
      "dosage_unit": 5,
      "leaflet_url": "https://www.dapmed-africa.com/medicaments/view/neuheptavit-sirop-flacon-de-200-ml/"
    },
    {
      "brand_id": 15,
      "form": "Effervescent tablet",
      "quantity": 20,
      "leaflet_url": "https://www.biofar.fr/nos-produits/magnesium-vitamine-b-6/"
    },
    {
      "brand_id": 16,
      "form": "Tablet",
      "quantity": 120,
      "dosage_unit": 2,
      "leaflet_url": "https://justvitadeal.com/products/bio-organic-spirulina-120-capsules/"
    }
  ]);
};
