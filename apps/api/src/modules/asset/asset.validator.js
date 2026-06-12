/**
 * Asset Validator
 * Zod schemas for asset-related query parameters.
 */
const { z } = require('zod');

/** Schema for the market search query param: ?q=<search term> */
const searchQuerySchema = z.object({
  q: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must not exceed 100 characters')
    .trim(),
}).strict();

module.exports = { searchQuerySchema };
