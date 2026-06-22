/**
 * Transaction Validator
 * Zod schemas for validating incoming order and history-query payloads.
 */
const { z } = require('zod');
const { TRANSACTION_TYPE_VALUES } = require('../../shared/constants');

/**
 * orderSchema
 * Validates the request body for placing a BUY or SELL order.
 *
 * Fields:
 *  - assetId        : MongoDB ObjectId string for the asset being traded
 *  - transactionType: 'BUY' or 'SELL'
 *  - quantity       : Positive number (supports fractional shares)
 *  - pricePerUnit   : Ignored by the server — execution price is resolved from Redis
 *  - fees           : Non-negative number (brokerage fees in ₹); defaults to 0
 *  - notes          : Optional free-text note, max 500 chars
 */
const orderSchema = z
  .object({
    assetId: z.string().min(1, 'assetId is required'),

    transactionType: z.enum(TRANSACTION_TYPE_VALUES, {
      errorMap: () => ({ message: 'transactionType must be BUY or SELL' }),
    }),

    quantity: z
      .number({ invalid_type_error: 'quantity must be a number' })
      .positive('Quantity must be positive'),

    // pricePerUnit is accepted for backward compatibility but ignored —
    // the server resolves the execution price from Redis.
    pricePerUnit: z
      .number({ invalid_type_error: 'pricePerUnit must be a number' })
      .positive('Price per unit must be positive')
      .optional(),

    fees: z
      .number({ invalid_type_error: 'fees must be a number' })
      .min(0, 'fees must be >= 0')
      .optional()
      .default(0),

    notes: z.string().max(500).optional(),
  })
  .strict();

/**
 * historyQuerySchema (LEGACY — kept for backward compatibility)
 * Validates query-string parameters for GET /transactions.
 */
const historyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    assetId: z.string().optional(),
  })
  .strict();

/**
 * transactionListSchema
 * Validates POST body for POST /transactions/list.
 *
 * Request body:
 *   {
 *     pagination: { page: 1, limit: 20 },
 *     filters: { assetId?, transactionType? },
 *     search: "",
 *     sort: { field: "executedAt", order: "desc" }
 *   }
 */
const { baseListQuerySchema } = require('../../shared/pagination');

const transactionFiltersSchema = z
  .object({
    assetId: z.string().optional(),
    transactionType: z.enum(TRANSACTION_TYPE_VALUES).optional(),
  })
  .optional()
  .default({});

const transactionListSchema = baseListQuerySchema.extend({
  filters: transactionFiltersSchema,
});

module.exports = { orderSchema, historyQuerySchema, transactionListSchema };
