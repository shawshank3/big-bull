const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(100).trim(),
}).strict();

module.exports = { searchQuerySchema };
