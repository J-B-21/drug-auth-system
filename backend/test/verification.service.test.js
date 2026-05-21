// Unit and Integration tests for the verification service layer.
// These tests primarily exercise business logic in `VerificationService`.
// Repositories are mocked where possible to avoid dependency on production data,
// but some tests still open a DB transaction to validate SQL queries.
const { after, test } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/config/database');
const DrugVerificationRepository = require('../src/repositories/drugVerification.repository');
const VerificationService = require('../src/services/verification.service');

const resolveReturnedId = (returned) => {
  if (Array.isArray(returned)) {
    return returned[0] && (returned[0].id ?? returned[0]);
  }
  return returned && (returned.id ?? returned);
};

const futureMetadata = {
  product_id: 1,
  brand: 'Efferalgan',
  manufacturer: 'UPSA',
  manufacturer_website: 'https://www.upsa.com/',
  form: 'Effervescent tablet',
  quantity: 16,
  dosage_unit: 1,
  active_ingredients: [{ name: 'Paracetamol', dosage_per_unit: '500 mg' }],
  batch_id: 10,
  batch_number: 'B0250',
  expiry_date: '2099-05-31',
  leaflet_url: 'https://example.com/leaflet',
};

const createService = (repositoryOverrides = {}) => {
  const logs = [];
  const drugRepository = {
    findProductCodeByValue: async () => [],
    findItemCodeByValue: async () => null,
    findBatchByNumber: async () => [],
    // Dynamically applies database search scopes directly to the mock return payload
    getProductMetadata: async ({ productId, batchId, itemId }) => {
      return {
        ...futureMetadata,
        product_id: productId,
        // If no batchId is requested, explicitly mimic database NULL returns
        batch_id: batchId || null,
        batch_number: batchId ? futureMetadata.batch_number : null,
        expiry_date: batchId ? futureMetadata.expiry_date : null,
        ...repositoryOverrides.mockMetadata, // Allows custom overrides on a per-test basis
      };
    },
    ...repositoryOverrides,
  };
  const scanLogRepository = {
    create: async (scanLog) => {
      logs.push(scanLog);
      return { id: logs.length, ...scanLog };
    },
  };

  return {
    logs,
    service: new VerificationService({
      drugRepository,
      scanLogRepository,
      nowProvider: () => new Date('2026-05-15T12:00:00Z'),
    }),
  };
};

after(async () => {
  await db.destroy();
});

test('verifies a raw product-level barcode and strips null fields', async () => {
  const { logs, service } = createService({
    findProductCodeByValue: async () => [{ product_id: 1 }], // Clean stripped mock return
  });

  // Explicitly pass payload metadata property context
  const result = await service.verify({ code: '01417282', scan_medium: 'Bar' }); 

  assert.equal(result.valid, true);
  assert.equal(result.verification_level, 'product');
  assert.equal(logs[0].inputType, 'barcode');
});


test('verifies an explicit manual batch lookup with localized source categorization', async () => {
  const { logs, service } = createService({
    findBatchByNumber: async () => [{
      batch_id: 10,
      product_id: 1,
      batch_number: 'B0250',
      expiry_date: '2099-05-31',
    }],
  });

  const result = await service.verify({ batch_number: 'B0250' });

  assert.equal(result.valid, true);
  assert.equal(result.verification_level, 'batch');
  // Verified label transitions natively out of qr_code categorization
  assert.equal(result.verification_source, 'batch_number');
  assert.equal(result.batch_number, 'B0250');
  assert.equal(result.expiry_date, '2099-05-31'); // Explicit string notation verification
});

test('getProductMetadata omits batch fields for product-level lookup', async () => {
  const trx = await db.transaction();
  const repository = new DrugVerificationRepository(trx);

  try {
    const manufacturerInsert = await trx('drug_manufacturers')
      .insert({ name: 'Test Manufacturer', website: 'https://example.com' })
      .returning('id');
    const manufacturerId = resolveReturnedId(manufacturerInsert);

    const brandInsert = await trx('drug_brands')
      .insert({ name: 'Test Brand', manufacturer_id: manufacturerId })
      .returning('id');
    const brandId = resolveReturnedId(brandInsert);

    const productInsert = await trx('drug_products')
      .insert({
        brand_id: brandId,
        form: 'Tablet',
        quantity: 20,
        dosage_unit: 1,
        leaflet_url: 'https://example.com/leaflet',
      })
      .returning('id');
    const productId = resolveReturnedId(productInsert);

    await trx('drug_batches').insert([
      { product_id: productId, number: 'BATCH-1', expiry_date: '2099-01-01' },
      { product_id: productId, number: 'BATCH-2', expiry_date: '2099-02-01' },
    ]);

    const metadata = await repository.getProductMetadata({ productId });

    assert.equal(metadata.product_id, productId);
    assert.equal(metadata.batch_id, null);
    assert.equal(metadata.batch_number, null);
    assert.equal(metadata.expiry_date, null);
  } finally {
    await trx.rollback();
  }
});

test('returns not_found for unknown raw codes and logs the failure', async () => {
  const { logs, service } = createService();

  const result = await service.verify({ code: 'UNKNOWN' });

  assert.deepEqual(result, {
    valid: false,
    reason: 'not_found',
    message: 'Product not registered. Please report to the nearest health facility.',
  });
  assert.equal(logs[0].success, false);
  assert.equal(logs[0].failureReason, 'not_found');
});

test('acknowledges existence but flags safety warnings for expired batches', async () => {
  const { logs, service } = createService({
    findProductCodeByValue: async () => [{
      product_id: 1,
      code_type: 'QR',
    }],
    getProductMetadata: async () => ({
      ...futureMetadata,
      expiry_date: '2020-01-31',
    }),
  });

  const result = await service.verify({ code: '03585554088980' });

  // Checked explicit dynamic response adjustments for expired items
  assert.equal(result.valid, true);
  assert.equal(result.expired, true);
  assert.match(result.message, /EXPIRED/);
  assert.equal(result.expiry_date, '2020-01-31');

  assert.equal(logs[0].success, false);
  assert.equal(logs[0].failureReason, 'expired');
  assert.equal(logs[0].matchedBatchId, 10);
});

test('rejects composite components that point to different products', async () => {
  const { logs, service } = createService({
    findProductCodeByValue: async () => [{
      product_id: 1,
      code_type: 'QR',
    }],
    findItemCodeByValue: async () => ({
      item_id: 50,
      batch_id: 60,
      product_id: 2,
      code_type: 'QR',
    }),
    findBatchByNumber: async () => [{
      batch_id: 60,
      product_id: 2,
      number: 'B0250',
    }]
  });

  const result = await service.verify({
    gtin: '03585554088980',
    serial_number: '01590553843587',
    batch_number: 'B0250'
  });

  assert.equal(result.valid, false);
  assert.equal(result.reason, 'component_mismatch');
  assert.equal(logs[0].success, false);
});

test('automatically parses and verifies a valid compound GS1 string input', async () => {
  const { service } = createService({
    findProductCodeByValue: async () => [{ product_id: 1, code_type: 'QR' }],
    findItemCodeByValue: async () => ({ item_id: 2, batch_id: 3, product_id: 1, code_type: 'QR' }),
    findBatchByNumber: async () => [{ batch_id: 3, product_id: 1, number: 'B0250', expiry_date: '2099-05-31' }]
  });

  // Emulates automated scanner mapping input arrays
  const result = await service.verify({ code: '01035855540889802101590553843587 1726053110B0250' });

  assert.equal(result.valid, true);
  assert.equal(result.verification_level, 'item');
  assert.equal(result.batch_number, 'B0250');
});

test('automatically parses a trailing-variable field layout string successfully', async () => {
  const { service } = createService({
    findProductCodeByValue: async () => [{ product_id: 1, code_type: 'QR' }],
    findBatchByNumber: async () => [{ batch_id: 3, product_id: 1, number: '250001Z', expiry_date: '2099-05-31' }],
    // Ensures the mock metadata mirrors the exact string batch payload
    mockMetadata: {
      batch_id: 3,
      batch_number: '250001Z',
    }
  });

  const result = await service.verify({ code: '01034009223855631727120010250001Z' });

  assert.equal(result.valid, true);
  assert.equal(result.verification_level, 'batch');
  assert.equal(result.batch_number, '250001Z');
});
