/**
 * Tax Validator
 * Zod schemas for validating incoming query parameters on tax endpoints.
 */
const { z } = require('zod');

/**
 * gainsQuerySchema
 * Validates query-string parameters for GET /tax/gains.
 *
 * Fields:
 *  - taxYear : 4-digit Indian FY start year (optional — defaults to current FY in service)
 *  - page    : Page number, >= 1 (default 1)
 *  - limit   : Records per page, 1–100 (default 20)
 */
const gainsQuerySchema = z.object({
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * summaryQuerySchema
 * Validates query-string parameters for GET /tax/summary.
 *
 * Fields:
 *  - taxYear : 4-digit Indian FY start year (optional — defaults to current FY in service)
 */
const summaryQuerySchema = z.object({
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * harvestingQuerySchema
 * Validates query-string parameters for GET /tax/harvesting.
 *
 * Fields:
 *  - taxYear : 4-digit Indian FY start year (optional — defaults to current FY in service)
 *  - minLoss : Minimum unrealized loss threshold in ₹ (>= 0, default 0)
 */
const harvestingQuerySchema = z.object({
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
  minLoss: z.coerce.number().min(0).default(0),
});

module.exports = { gainsQuerySchema, summaryQuerySchema, harvestingQuerySchema };
