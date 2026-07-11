/**
 * Tax Validator
 * Zod schemas for validating incoming query parameters on tax endpoints.
 */
const { z } = require('zod');

/**
 * gainsQuerySchema
 * Validates query-string parameters for GET /tax/gains.
 */
const gainsQuerySchema = z.object({
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * summaryQuerySchema
 * Validates query-string parameters for GET /tax/summary.
 */
const summaryQuerySchema = z.object({
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * harvestingQuerySchema
 * Validates query-string parameters for GET /tax/harvesting.
 */
const harvestingQuerySchema = z.object({
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
  minLoss: z.coerce.number().min(0).default(0),
});

module.exports = { gainsQuerySchema, summaryQuerySchema, harvestingQuerySchema };
