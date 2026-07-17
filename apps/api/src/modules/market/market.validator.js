/**
 * Market Validator
 * Zod schemas for market-related query parameters.
 */
const { z } = require('zod');
const { STRING_LIMITS } = require('../../shared/constants');

const searchQuerySchema = z
  .object({
    q: z
      .string()
      .min(
        STRING_LIMITS.SEARCH_QUERY.MIN,
        `Search query must be at least ${STRING_LIMITS.SEARCH_QUERY.MIN} characters`
      )
      .max(100)
      .trim(),
  })
  .strict();

module.exports = { searchQuerySchema };
