/**
 * Transaction Validator
 * Zod schemas for validating incoming order and history-query payloads.
 */
const { z } = require('zod');

/**
 * orderSchema
 * Validates the request body for placing a BUY or SELL order.
 *
 * Fields:
 *  - assetId        : MongoDB ObjectId string for the asset being traded
 *  - transactionType: 'BUY' or 'SELL'
 *  - quantity       : Positive number (supports fractional shares)
 *  - pricePerUnit   : Positive number — price in ₹ at execution time
 *  - fees           : Non-negative number (brokerage fees in ₹); defaults to 0
 *  - notes          : Optional free-text note, max 500 chars
 */
const orderSchema = z
  .object({
    assetId: z.string().min(1, 'assetId is required'),

    transactionType: z.enum(['BUY', 'SELL'], {
      errorMap: () => ({ message: 'transactionType must be BUY or SELL' }),
    }),

    quantity: z
      .number({ invalid_type_error: 'quantity must be a number' })
      .positive('Quantity must be positive'),

    pricePerUnit: z
      .number({ invalid_type_error: 'pricePerUnit must be a number' })
      .positive('Price per unit must be positive'),

    fees: z
      .number({ invalid_type_error: 'fees must be a number' })
      .min(0, 'fees must be >= 0')
      .optional()
      .default(0),

    notes: z.string().max(500).optional(),
  })
  .strict();

/**
 * historyQuerySchema
 * Validates query-string parameters for GET /transactions.
 *
 * Fields:
 *  - page  : Page number (1-based); defaults to 1
 *  - limit : Items per page (1–100); defaults to 20
 */
const historyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

module.exports = { orderSchema, historyQuerySchema };
