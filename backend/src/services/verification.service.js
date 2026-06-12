// Service layer that contains the core verification business logic.
const DrugVerificationRepository = require('../repositories/drugVerification.repository');
const ScanLogRepository = require('../repositories/scanLog.repository');
const ForensicDetectionService = require('./forensicDetection.service');
const { SCAN_INPUT_TYPES } = require('../models/scanLog.model');
const { isExpiredDate, toDateOnly } = require('../utils/date');
const { parseGs1DataMatrix } = require('../utils/gs1');
const logger = require('../utils/logger');

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
  MALFORMED_GS1: 'malformed_gs1',
  NOT_FOUND: 'not_found',
});

class VerificationService {
  constructor({
    drugRepository = new DrugVerificationRepository(),
    scanLogRepository = new ScanLogRepository(),
    forensicService = null,
    nowProvider = () => new Date(),
  } = {}) {
    this.drugRepository = drugRepository;
    this.scanLogRepository = scanLogRepository;
    this.nowProvider = nowProvider;
    this.forensicService = forensicService || new ForensicDetectionService({
      scanLogRepository: this.scanLogRepository,
      nowProvider: this.nowProvider,
    });
  }

  async verify(payload, context = {}) {
    let normalizedPayload = this.normalizePayload(payload);
    let wasParsedGs1 = false;

    // 1. Try to decompose GS1 Matrix patterns natively
    if (normalizedPayload.code) {
      const parsedComponents = this.parseGs1DataMatrix(normalizedPayload.code);

      if (parsedComponents && parsedComponents.malformed) {
        const outcome = this.failureOutcome({
          reason: FAILURE_REASONS.MALFORMED_GS1,
          message: 'Malformed GS1 payload. Please rescan the code or enter the values manually.',
          inputType: normalizedPayload.scan_medium === 'Bar'
            ? SCAN_INPUT_TYPES.BARCODE
            : SCAN_INPUT_TYPES.QR_CODE,
          verificationSource: VERIFICATION_SOURCES.QR_CODE,
          rawCode: normalizedPayload.code,
          exposeInput: false,
          exposeVerificationSource: false,
        });

        try {
          const securityFlags = await this.logAttempt(normalizedPayload, outcome, context);
          if (outcome.response && outcome.response.valid) {
            return {
              ...outcome.response,
              suspicious: securityFlags.length > 0,
              security_flags: securityFlags,
            };
          }

          return outcome.response;
        } catch (logError) {
          logger.error('verification_log_failed', {
            message: logError.message,
          });
          return outcome.response;
        }
      }

      if (parsedComponents && parsedComponents.components) {
        normalizedPayload = { ...normalizedPayload, ...parsedComponents.components };
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
      const securityFlags = await this.logAttempt(normalizedPayload, outcome, context);
      if (outcome.response && outcome.response.valid) {
        return {
          ...outcome.response,
          suspicious: securityFlags.length > 0,
          security_flags: securityFlags,
        };
      }

      return outcome.response;
    } catch (logError) {
      logger.error('verification_log_failed', {
        message: logError.message,
      });
      return outcome.response;
    }
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
        contextPayload: { code } // 🌟 Pass the explicit raw string context here
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
        contextPayload: { code } // 🌟 Pass the explicit raw string context here
      });
    }

    return this.failureOutcome({
      reason: FAILURE_REASONS.NOT_FOUND,
      message: 'Product not registered. Please report to the nearest health facility.',
      inputType: assignedInputType,
      verificationSource: resolvedSource,
      rawCode: code, // 🌟 Correctly assigns rawCode text strings
      exposeInput: false,
      exposeVerificationSource: false,
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
        // 🌟 FIXED: Directly strips values from components array layer to pass to response
        gtin: components.gtin || null,
        serialNumber: components.serial_number || null,
        batchNumber: components.batch_number || null
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
        // 🌟 FIXED: Map variables across down to the error payload wrapper
        gtin: components.gtin || null,
        serialNumber: components.serial_number || null,
        batchNumber: components.batch_number || null
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
        contextPayload: components // 🌟 Pass the parsed QR components object here
      });
    }

    if (matchedBatch) {
      return this.buildMatchedOutcome({
        productId,
        batchId: matchedBatch.batch_id,
        verificationSource,
        verificationLevel: VERIFICATION_LEVELS.BATCH,
        inputType: assignedInputType,
        contextPayload: components // 🌟 Pass the parsed QR components object here
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
    contextPayload = {}, // 🌟 Securely handle the passed context values
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
          // Fallback variables safe from scoping errors
          serial_number: contextPayload.serial_number || null,
          gtin: contextPayload.gtin || null,
          code: contextPayload.code || null
        },
        log: {
          ...logContext,
          failureReason: FAILURE_REASONS.EXPIRED,
          success: false,
        },
      };
    }

    return {
      response: this.formatSuccessResponse(
        metadata, 
        verificationSource, 
        verificationLevel, 
        contextPayload.serial_number || null, // 🌟 Stripped the greedy fallback to contextPayload.code
        contextPayload.gtin || null,
        contextPayload.code || null
      ),
      log: {
        ...logContext,
        success: true,
      },
    };
  }

  formatSuccessResponse(metadata, verificationSource, verificationLevel, serialNumber = null, gtinCode = null, rawCode = null) {
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
      
      // 🌟 CORRECTED: Strict key-value assignments to prevent ReferenceErrors
      serial_number: serialNumber, 
      gtin: gtinCode,
      code: rawCode
    };

    // Strip null fields to optimize network payload sizes safely
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
    rawCode = null, // 🌟 Accept the input code string context
    gtin = null,          // 🌟 NEW: Accept components
    serialNumber = null,  // 🌟 NEW: Accept components
    batchNumber = null,   // 🌟 NEW: Accept components
    exposeInput = true,
    exposeVerificationSource = true,
  }) {
    const response = { valid: false, reason };
    if (verificationSource && exposeVerificationSource) response.verification_source = verificationSource;
    if (message) response.message = message;

    // 🌟 FIXED: Conditionally append parameters back to the JSON payload matching your exact schema layout
    if (exposeInput && rawCode) response.code = rawCode;
    if (exposeInput && gtin) response.gtin = gtin;
    if (exposeInput && serialNumber) response.serial_number = serialNumber;
    if (exposeInput && batchNumber) response.batch_number = batchNumber;

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
    return parseGs1DataMatrix(rawString);
  }

  async logAttempt(payload, outcome, context = {}) {
    const value = payload.code ? payload.code : `gtin:${payload.gtin || ''}|sn:${payload.serial_number || ''}|bn:${payload.batch_number || ''}`;
    const securityFlags = Array.isArray(context.securityFlags) ? [...context.securityFlags] : [];
    const clientTelemetry = payload.client_telemetry || {};

    const forensicEvaluation = await this.forensicService.assessScan({
      payload,
      outcome,
      context,
    });

    forensicEvaluation.forensicFlags.forEach((flag) => {
      if (!securityFlags.includes(flag)) {
        securityFlags.push(flag);
      }
    });

    await this.scanLogRepository.create({
      scannedValue: value,
      inputType: outcome.log.inputType,
      success: outcome.log.success,
      failureReason: outcome.log.failureReason,
      verificationSource: outcome.log.verificationSource,
      matchedProductId: outcome.log.matchedProductId,
      matchedItemId: outcome.log.matchedItemId,
      matchedBatchId: outcome.log.matchedBatchId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      suspicious: securityFlags.length > 0,
      securityFlags,
      metadata: {
        verification_level: outcome.log.verificationLevel,
        verification_source: outcome.log.verificationSource,
        scan_source: outcome.log.verificationSource,
        client_telemetry: clientTelemetry,
        ...forensicEvaluation.forensicMetadata,
      },
    });

    return securityFlags;
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
