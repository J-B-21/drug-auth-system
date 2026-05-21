// Service layer that contains the core verification business logic.
const DrugVerificationRepository = require('../repositories/drugVerification.repository');
const ScanLogRepository = require('../repositories/scanLog.repository');
const { SCAN_INPUT_TYPES } = require('../models/scanLog.model');
const { isExpiredDate, toDateOnly } = require('../utils/date');

const VERIFICATION_SOURCES = Object.freeze({
  BARCODE: 'barcode',
  QR_CODE: 'qr_code',
  BATCH_NUMBER: 'batch_number',
  RAW_CODE: 'raw_code',
});

const VERIFICATION_LEVELS = Object.freeze({
  BATCH: 'batch',
  ITEM: 'item',
  PRODUCT: 'product',
});

const FAILURE_REASONS = Object.freeze({
  AMBIGUOUS_MATCH: 'ambiguous_match',
  COMPONENT_MISMATCH: 'component_mismatch',
  EXPIRED: 'expired',
  NOT_FOUND: 'not_found',
});

class VerificationService {
  constructor({
    drugRepository = new DrugVerificationRepository(),
    scanLogRepository = new ScanLogRepository(),
    nowProvider = () => new Date(),
  } = {}) {
    this.drugRepository = drugRepository;
    this.scanLogRepository = scanLogRepository;
    this.nowProvider = nowProvider;
  }

  async verify(payload) {
    let normalizedPayload = this.normalizePayload(payload);
    let wasParsedGs1 = false;

    // 1. Try to decompose GS1 Matrix patterns natively
    if (normalizedPayload.code) {
      const parsedComponents = this.parseGs1DataMatrix(normalizedPayload.code);
      if (parsedComponents) {
        normalizedPayload = { ...normalizedPayload, ...parsedComponents };
        wasParsedGs1 = true;
      }
    }

    // 2. Select execution pipeline
    let outcome;
    if (!wasParsedGs1 && normalizedPayload.code) {
      outcome = await this.verifyRawCode(normalizedPayload.code, normalizedPayload.scan_medium);
    } else if (normalizedPayload.gtin || normalizedPayload.serial_number || normalizedPayload.batch_number) {
      // Map verification source based on how the components arrived
      const source = wasParsedGs1 ? VERIFICATION_SOURCES.QR_CODE : 
                     (!normalizedPayload.gtin && !normalizedPayload.serial_number) ? VERIFICATION_SOURCES.BATCH_NUMBER : 
                     VERIFICATION_SOURCES.QR_CODE;

      outcome = await this.verifyQrComponents(normalizedPayload, source);
    } else {
      outcome = this.failureOutcome({
        reason: FAILURE_REASONS.NOT_FOUND,
        message: 'Invalid request payload composition.',
        inputType: SCAN_INPUT_TYPES.RAW_CODE,
      });
    }

    // 3. Persist log metrics safely
    try {
      await this.logAttempt(normalizedPayload, outcome);
    } catch (logError) {
      console.error('Audit trail logging failed:', logError);
    }

    return outcome.response;
  }

  async verifyRawCode(code, scanMedium = null) {
    const productCodes = await this.drugRepository.findProductCodeByValue(code);

    // Map source labels directly to client device metadata declarations
    const resolvedSource = scanMedium === 'Bar' ? VERIFICATION_SOURCES.BARCODE :
                             scanMedium === 'QR' ? VERIFICATION_SOURCES.QR_CODE : 
                             VERIFICATION_SOURCES.RAW_CODE;

    const assignedInputType = scanMedium === 'Bar' ? SCAN_INPUT_TYPES.BARCODE :
                              scanMedium === 'QR' ? SCAN_INPUT_TYPES.QR_CODE : 
                              SCAN_INPUT_TYPES.RAW_CODE;

    if (productCodes && productCodes.length > 0) {
      const match = productCodes[0]; // Extract first matching element from array query result
      return this.buildMatchedOutcome({
        productId: match.product_id,
        verificationSource: resolvedSource,
        verificationLevel: VERIFICATION_LEVELS.PRODUCT,
        inputType: assignedInputType,
      });
    }

    const itemCode = await this.drugRepository.findItemCodeByValue(code);

    if (itemCode) {
      return this.buildMatchedOutcome({
        productId: itemCode.product_id,
        batchId: itemCode.batch_id,
        itemId: itemCode.item_id,
        verificationSource: resolvedSource,
        verificationLevel: VERIFICATION_LEVELS.ITEM,
        inputType: assignedInputType,
      });
    }

    return this.failureOutcome({
      reason: FAILURE_REASONS.NOT_FOUND,
      message: 'Product not registered. Please report to the nearest health facility.',
      inputType: assignedInputType,
      verificationSource: resolvedSource,
    });
  }

  async verifyQrComponents(components, verificationSource) {
    const [productCodes, itemCode, batchRecords] = await Promise.all([
      components.gtin ? this.drugRepository.findProductCodeByValue(components.gtin) : Promise.resolve([]),
      components.serial_number ? this.drugRepository.findItemCodeByValue(components.serial_number) : Promise.resolve(null),
      components.batch_number ? this.drugRepository.findBatchByNumber(components.batch_number) : Promise.resolve([]),
    ]);

    const assignedInputType = (verificationSource === VERIFICATION_SOURCES.BATCH_NUMBER) 
      ? SCAN_INPUT_TYPES.BATCH_NUMBER 
      : SCAN_INPUT_TYPES.QR_CODE;

    const hasAnyMatch = productCodes.length > 0 || Boolean(itemCode) || batchRecords.length > 0;
    if (!hasAnyMatch) {
      return this.failureOutcome({
        reason: FAILURE_REASONS.NOT_FOUND,
        message: 'Product not registered. Please report to the nearest health facility.',
        inputType: assignedInputType,
        verificationSource,
      });
    }

    const missingProvidedComponent = (
      (components.gtin && productCodes.length === 0) ||
      (components.serial_number && !itemCode) ||
      (components.batch_number && batchRecords.length === 0)
    );

    if (missingProvidedComponent) {
      return this.failureOutcome({
        reason: FAILURE_REASONS.COMPONENT_MISMATCH,
        message: 'One or more QR components do not match a registered item.',
        inputType: assignedInputType,
        verificationSource,
        matchedProductId: this.firstKnownProductId({ productCodes, itemCode, batchRecords }),
      });
    }

    const productIds = this.intersectProductIds({ productCodes, itemCode, batchRecords }, components);

    if (productIds.size === 0) {
      return this.failureOutcome({
        reason: FAILURE_REASONS.COMPONENT_MISMATCH,
        message: 'QR components do not point to the same registered product package.',
        inputType: assignedInputType,
        verificationSource,
      });
    }

    if (productIds.size > 1) {
      return this.failureOutcome({
        reason: FAILURE_REASONS.AMBIGUOUS_MATCH,
        message: 'QR components match more than one registered product.',
        inputType: assignedInputType,
        verificationSource,
      });
    }

    const [productId] = Array.from(productIds);

    const matchedBatch = components.batch_number
      ? batchRecords.find((b) => Number(b.product_id) === productId)
      : null;

    if (components.batch_number && !matchedBatch) {
      return this.failureOutcome({
        reason: FAILURE_REASONS.COMPONENT_MISMATCH,
        message: 'Batch number does not belong to the matched product.',
        inputType: assignedInputType,
        verificationSource,
        matchedProductId: productId,
      });
    }

    if (itemCode && matchedBatch && Number(itemCode.batch_id) !== Number(matchedBatch.batch_id)) {
      return this.failureOutcome({
        reason: FAILURE_REASONS.COMPONENT_MISMATCH,
        message: 'Serial number and batch number do not point to the same item package.',
        inputType: assignedInputType,
        verificationSource,
        matchedProductId: productId,
        matchedItemId: itemCode.item_id,
        matchedBatchId: matchedBatch.batch_id,
      });
    }

    if (itemCode) {
      return this.buildMatchedOutcome({
        productId,
        batchId: itemCode.batch_id,
        itemId: itemCode.item_id,
        verificationSource,
        verificationLevel: VERIFICATION_LEVELS.ITEM,
        inputType: assignedInputType,
      });
    }

    if (matchedBatch) {
      return this.buildMatchedOutcome({
        productId,
        batchId: matchedBatch.batch_id,
        verificationSource,
        verificationLevel: VERIFICATION_LEVELS.BATCH,
        inputType: assignedInputType,
      });
    }

    return this.buildMatchedOutcome({
      productId,
      verificationSource,
      verificationLevel: VERIFICATION_LEVELS.PRODUCT,
      inputType: assignedInputType,
    });
  }

  async buildMatchedOutcome({
    productId,
    batchId = null,
    itemId = null,
    verificationSource,
    verificationLevel,
    inputType,
  }) {
    const metadata = await this.drugRepository.getProductMetadata({ productId, batchId, itemId });

    if (!metadata) {
      return this.failureOutcome({
        reason: FAILURE_REASONS.NOT_FOUND,
        message: 'Product records could not be resolved.',
        inputType,
        verificationSource,
        verificationLevel,
      });
    }

    const logContext = {
      inputType,
      verificationSource,
      verificationLevel,
      matchedProductId: metadata.product_id,
      matchedItemId: itemId,
      matchedBatchId: metadata.batch_id,
    };

    if (isExpiredDate(metadata.expiry_date, this.nowProvider())) {
      return {
        response: {
          valid: true,
          expired: true,
          message: 'This drug is registered but has EXPIRED. Do not ingest or use this product.',
          brand: metadata.brand,
          manufacturer: metadata.manufacturer,
          batch_number: metadata.batch_number,
          expiry_date: toDateOnly(metadata.expiry_date),
          verification_source: verificationSource,
          verification_level: verificationLevel,
        },
        log: {
          ...logContext,
          failureReason: FAILURE_REASONS.EXPIRED,
          success: false,
        },
      };
    }

    return {
      response: this.formatSuccessResponse(metadata, verificationSource, verificationLevel),
      log: {
        ...logContext,
        success: true,
      },
    };
  }

  formatSuccessResponse(metadata, verificationSource, verificationLevel) {
    const response = {
      valid: true,
      expired: false,
      brand: metadata.brand,
      manufacturer: metadata.manufacturer,
      manufacturer_website: metadata.manufacturer_website,
      form: metadata.form,
      quantity: Number(metadata.quantity),
      dosage_unit: Number(metadata.dosage_unit),
      active_ingredients: metadata.active_ingredients,
      leaflet_url: metadata.leaflet_url,
      batch_number: metadata.batch_number,
      expiry_date: toDateOnly(metadata.expiry_date),
      verification_source: verificationSource,
      verification_level: verificationLevel,
    };

    Object.keys(response).forEach((key) => {
      if (response[key] === null) {
        delete response[key];
      }
    });

    return response;
  }

  failureOutcome({
    reason,
    message = undefined,
    inputType,
    verificationSource = null,
    verificationLevel = null,
    matchedProductId = null,
    matchedItemId = null,
    matchedBatchId = null,
  }) {
    const response = { valid: false, reason };
    if (message) response.message = message;

    return {
      response,
      log: {
        inputType,
        verificationSource,
        verificationLevel,
        matchedProductId,
        matchedItemId,
        matchedBatchId,
        failureReason: reason,
        success: false,
      },
    };
  }

  parseGs1DataMatrix(rawString) {
    if (!rawString || typeof rawString !== 'string') return null;

    let cleanStr = rawString.trim().replace(/[\x1d~]/g, ' ').replace(/\s+/g, ' ');

    const result = { gtin: null, serial_number: null, batch_number: null };
    let currentIndex = 0;
    let iterations = 0;

    while (currentIndex < cleanStr.length && iterations < 10) {
      iterations++;

      if (cleanStr[currentIndex] === ' ') {
        currentIndex++;
        continue;
      }

      const remainingText = cleanStr.slice(currentIndex);

      if (remainingText.startsWith('01')) {
        result.gtin = remainingText.slice(2, 16);
        currentIndex += 16;
        continue;
      }

      if (remainingText.startsWith('17')) {
        currentIndex += 8;
        continue;
      }

      if (remainingText.startsWith('21')) {
        const dataPart = remainingText.slice(2);
        const spaceIdx = dataPart.indexOf(' ');
        if (spaceIdx !== -1) {
          result.serial_number = dataPart.slice(0, spaceIdx);
          currentIndex += 2 + spaceIdx + 1;
        } else {
          result.serial_number = dataPart;
          currentIndex += 2 + dataPart.length;
        }
        continue;
      }

      if (remainingText.startsWith('10')) {
        const dataPart = remainingText.slice(2);
        const spaceIdx = dataPart.indexOf(' ');
        if (spaceIdx !== -1) {
          result.batch_number = dataPart.slice(0, spaceIdx);
          currentIndex += 2 + spaceIdx + 1;
        } else {
          result.batch_number = dataPart;
          currentIndex += 2 + dataPart.length;
        }
        continue;
      }

      currentIndex++;
    }

    if (result.gtin && (result.serial_number || result.batch_number)) {
      if (!result.serial_number) delete result.serial_number;
      if (!result.batch_number) delete result.batch_number;
      return result;
    }

    return null;
  }

  async logAttempt(payload, outcome) {
    const value = payload.code ? payload.code : `gtin:${payload.gtin || ''}|sn:${payload.serial_number || ''}|bn:${payload.batch_number || ''}`;
    await this.scanLogRepository.create({
      scannedValue: value,
      inputType: outcome.log.inputType,
      success: outcome.log.success,
      failureReason: outcome.log.failureReason,
      verificationSource: outcome.log.verificationSource,
      matchedProductId: outcome.log.matchedProductId,
      matchedItemId: outcome.log.matchedItemId,
      matchedBatchId: outcome.log.matchedBatchId,
      metadata: { verification_level: outcome.log.verificationLevel },
    });
  }

  normalizePayload(payload) {
    return Object.entries(payload).reduce((normalized, [key, value]) => {
      normalized[key] = typeof value === 'string' ? value.trim() : value;
      return normalized;
    }, {});
  }

  firstKnownProductId({ productCodes, itemCode, batchRecords }) {
    if (itemCode) return itemCode.product_id;
    // Accesses index position 0 to read properties out of the array result shell safely
    if (productCodes && productCodes.length > 0) return productCodes[0].product_id;
    if (batchRecords && batchRecords.length > 0) return batchRecords[0].product_id;
    return null;
  }


  intersectProductIds({ productCodes, itemCode, batchRecords }, payload) {
    const sets = [];
    if (payload.gtin) {
      sets.push(new Set(productCodes.map((c) => Number(c.product_id))));
    }
    if (payload.serial_number) {
      sets.push(itemCode ? new Set([Number(itemCode.product_id)]) : new Set());
    }
    if (payload.batch_number) {
      sets.push(new Set(batchRecords.map((b) => Number(b.product_id))));
    }
    if (sets.length === 0) return new Set();
    return sets.reduce((intersection, set) => new Set([...intersection].filter((id) => set.has(id))));
  }
}

module.exports = VerificationService;
