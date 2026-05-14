/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries AND ensures the auto-incrementing ID resets to 1
  await knex.raw('TRUNCATE TABLE drug_manufacturers RESTART IDENTITY CASCADE;')
  await knex('drug_manufacturers').insert([
    {
      "name": "UPSA",
      "website": "https://www.upsa.com/"
    },
    {
      "name": "Ipsen",
      "website": "https://www.ipsen.com/"
    },
    {
      "name": "Sun Pharmaceuticals Industries",
      "website": "https://sunpharma.com/"
    },
    {
      "name": "Sanofi",
      "website": "https://www.sanofi.com/"
    },
    {
      "name": "Cooper Pharma",
      "website": "https://cooperpharma.com/"
    },
    {
      "name": "MSD",
      "website": "https://www.msd.com/"
    },
    {
      "name": "Aspen Pharmacare",
      "website": "https://www.aspenpharma.com/"
    },
    {
      "name": "Delpharm",
      "website": "https://www.delpharm.com/"
    },
    {
      "name": "Africure Pharmaceuticals",
      "website": "https://www.africurepharma.com/"
    },
    {
      "name": "Gracure Pharmaceuticals",
      "website": "https://www.gracure.com/"
    },
    {
      "name": "Zeta Farmaceutici",
      "website": "https://www.zetafarm.it/"
    },
    {
      "name": "Ahaan Healthcare",
      "website": "https://ahpl.co/"
    },
    {
      "name": "Biofar Laboratories",
      "website": "https://www.biofar.fr/"
    },
    {
      "name": "Anhui Fulai Pharmaceutical",
      "website": "https://www.fulaipharmaceutical.com/"
    }
  ]);
};
