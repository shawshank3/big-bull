// Chart Range Constants
const CHART_RANGES = {
  ONE_DAY: '1D',
  ONE_WEEK: '1W',
  ONE_MONTH: '1M',
  THREE_MONTHS: '3M',
  ONE_YEAR: '1Y',
};

const CHART_RANGE_VALUES = Object.values(CHART_RANGES);

// Display labels for chart ranges
const CHART_RANGE_LABELS = {
  [CHART_RANGES.ONE_DAY]: '1 Day',
  [CHART_RANGES.ONE_WEEK]: '1 Week',
  [CHART_RANGES.ONE_MONTH]: '1 Month',
  [CHART_RANGES.THREE_MONTHS]: '3 Months',
  [CHART_RANGES.ONE_YEAR]: '1 Year',
};

// Time periods in milliseconds for range calculations
const CHART_RANGE_PERIODS = {
  [CHART_RANGES.ONE_DAY]: 24 * 60 * 60 * 1000,
  [CHART_RANGES.ONE_WEEK]: 7 * 24 * 60 * 60 * 1000,
  [CHART_RANGES.ONE_MONTH]: 30 * 24 * 60 * 60 * 1000,
  [CHART_RANGES.THREE_MONTHS]: 90 * 24 * 60 * 60 * 1000,
  [CHART_RANGES.ONE_YEAR]: 365 * 24 * 60 * 60 * 1000,
};

module.exports = {
  CHART_RANGES,
  CHART_RANGE_VALUES,
  CHART_RANGE_LABELS,
  CHART_RANGE_PERIODS,
};
