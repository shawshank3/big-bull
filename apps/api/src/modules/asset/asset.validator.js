/**
 * Asset Validator
 * Zod schemas for asset-related query parameters.
 */
const { z } = require('zod');
const { STRING_LIMITS } = require('../../shared/constants');

/** Schema for the market search query param: ?q=<search term> */
const searchQuerySchema = z
  .object({
    q: z
      .string()
      .min(
        STRING_LIMITS.SEARCH_QUERY.MIN,
        `Search query must be at least ${STRING_LIMITS.SEARCH_QUERY.MIN} characters`
      )
      .max(
        STRING_LIMITS.SEARCH_QUERY.MAX,
        `Search query must not exceed ${STRING_LIMITS.SEARCH_QUERY.MAX} characters`
      )
      .trim(),
  })
  .strict();

module.exports = { searchQuerySchema };
