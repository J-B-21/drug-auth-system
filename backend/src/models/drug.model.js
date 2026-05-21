// Database table name constants and code type enums used across repositories.
// Centralizing names helps avoid hard-to-debug typos in SQL queries.
const TABLES = Object.freeze({
  ACTIVE_INGREDIENTS: 'drug_active_ingredients',
  BATCHES: 'drug_batches',
  BRANDS: 'drug_brands',
  ITEM_CODES: 'drug_item_codes',
  ITEMS: 'drug_items',
  MANUFACTURERS: 'drug_manufacturers',
  PRODUCT_ACTIVE_INGREDIENTS: 'drug_product_active_ingredients',
  PRODUCT_CODES: 'drug_product_codes',
  PRODUCTS: 'drug_products',
});

const CODE_TYPES = Object.freeze({
  BARCODE: 'Bar',
  QR: 'QR',
});

module.exports = {
  CODE_TYPES,
  TABLES,
};
