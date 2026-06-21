/**
 * Chart Validator
 *
 * Zod schemas for chart query-parameter validation.
 */
const { z } = require('zod');

const chartQuerySchema = z.object({
  range: z
    .enum(['1D', '1W', '1M', '3M', '1Y'], {
      errorMap: () => ({ message: 'range must be one of: 1D, 1W, 1M, 3M, 1Y' }),
    })
    .default('1D'),
});

module.exports = { chartQuerySchema };
