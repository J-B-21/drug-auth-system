// Repository responsible for querying product, item, and batch data.
// Exposes methods used by the verification service to resolve codes and metadata.
const db = require('../config/database');
const { TABLES } = require('../models/drug.model');

class DrugVerificationRepository {
  constructor(knex = db) {
    this.db = knex;
  }

  productCodeBaseQuery() {
    return this.db(`${TABLES.PRODUCT_CODES} as product_code`).select(
      'product_code.id as product_code_id',
      'product_code.product_id',
      'product_code.value as code_value'
    );
  }

  itemCodeBaseQuery() {
    return this.db(`${TABLES.ITEM_CODES} as item_code`)
      .join(`${TABLES.ITEMS} as item`, 'item.id', 'item_code.item_id')
      .join(`${TABLES.BATCHES} as batch`, 'batch.id', 'item.batch_id')
      .select(
        'item_code.id as item_code_id',
        'item_code.item_id',
        'item_code.value as code_value',
        'item.batch_id',
        'batch.product_id',
      );
  }

  async findProductCodeByValue(value) {
    return this.productCodeBaseQuery()
      .where('product_code.value', value);
  }

  async findItemCodeByValue(value) {
    return this.itemCodeBaseQuery()
      .where('item_code.value', value)
      .first();
  }

  async findBatchByNumber(batchNumber) {
    return this.db(`${TABLES.BATCHES} as batch`)
      .select(
        'batch.id as batch_id',
        'batch.product_id',
        'batch.number as batch_number',
        'batch.expiry_date',
      )
      .where('batch.number', batchNumber)
      .orderBy('batch.id', 'asc');
  }

  async getProductMetadata({ productId, batchId = null, itemId = null }) {
    const query = this.db(`${TABLES.PRODUCTS} as product`)
      .join(`${TABLES.BRANDS} as brand`, 'brand.id', 'product.brand_id')
      .join(`${TABLES.MANUFACTURERS} as manufacturer`, 'manufacturer.id', 'brand.manufacturer_id')
      .leftJoin(`${TABLES.PRODUCT_ACTIVE_INGREDIENTS} as product_ingredient`, 'product_ingredient.product_id', 'product.id')
      .leftJoin(`${TABLES.ACTIVE_INGREDIENTS} as active_ingredient`, 'active_ingredient.id', 'product_ingredient.ingredient_id')
      .select(
        'product.id as product_id',
        this.db.raw('?::integer as item_id', [itemId]),
        'brand.name as brand',
        'manufacturer.name as manufacturer',
        'manufacturer.website as manufacturer_website',
        'product.form',
        'product.quantity',
        'product.dosage_unit',
        'product.leaflet_url',
        batchId ? 'batch.id as batch_id' : this.db.raw('NULL::integer as batch_id'),
        batchId ? 'batch.number as batch_number' : this.db.raw('NULL::text as batch_number'),
        batchId ? 'batch.expiry_date as expiry_date' : this.db.raw('NULL::date as expiry_date'),
        this.db.raw(`
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_build_object(
                'name', active_ingredient.name,
                'dosage_per_unit', product_ingredient.dosage_per_unit
              )
            ) FILTER (WHERE active_ingredient.id IS NOT NULL),
            '[]'::jsonb
          ) as active_ingredients
        `),
      )
      .where('product.id', productId)
      .modify((query) => {
        if (batchId) {
          query.leftJoin(`${TABLES.BATCHES} as batch`, 'batch.product_id', 'product.id');
          query.where('batch.id', batchId);
        }
      })
      .groupBy(
        'product.id',
        'brand.name',
        'manufacturer.name',
        'manufacturer.website',
        'product.form',
        'product.quantity',
        'product.dosage_unit',
        'product.leaflet_url',
        ...(batchId ? ['batch.id', 'batch.number', 'batch.expiry_date'] : []),
      );

    if (batchId) {
      query.orderByRaw('batch.expiry_date asc nulls last, batch.id asc nulls last');
    }

    return query.first();
  }
}

module.exports = DrugVerificationRepository;
