/**
 * Chart Validator
 *
 * Zod schemas for chart query-parameter validation.
 */
const { z } = require('zod');
const { CHART_RANGE_VALUES, CHART_RANGES } = require('../../shared/constants');

const chartQuerySchema = z.object({
  range: z
    .enum(CHART_RANGE_VALUES, {
      errorMap: () => ({ message: `range must be one of: ${CHART_RANGE_VALUES.join(', ')}` }),
    })
    .default(CHART_RANGES.ONE_DAY),
});

module.exports = { chartQuerySchema };
