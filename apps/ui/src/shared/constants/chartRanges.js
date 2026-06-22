// Chart Range Constants - UI Version (mirrors API constants)
export const CHART_RANGES = {
  ONE_DAY: '1D',
  ONE_WEEK: '1W',
  ONE_MONTH: '1M',
  THREE_MONTHS: '3M',
  ONE_YEAR: '1Y',
};

export const CHART_RANGE_VALUES = Object.values(CHART_RANGES);

// Display labels for chart ranges
export const CHART_RANGE_LABELS = {
  [CHART_RANGES.ONE_DAY]: '1D',
  [CHART_RANGES.ONE_WEEK]: '1W',
  [CHART_RANGES.ONE_MONTH]: '1M',
  [CHART_RANGES.THREE_MONTHS]: '3M',
  [CHART_RANGES.ONE_YEAR]: '1Y',
};

// Full labels for accessibility and tooltips
export const CHART_RANGE_FULL_LABELS = {
  [CHART_RANGES.ONE_DAY]: '1 Day',
  [CHART_RANGES.ONE_WEEK]: '1 Week',
  [CHART_RANGES.ONE_MONTH]: '1 Month',
  [CHART_RANGES.THREE_MONTHS]: '3 Months',
  [CHART_RANGES.ONE_YEAR]: '1 Year',
};

// Chart configuration for different ranges
export const CHART_RANGE_CONFIG = {
  [CHART_RANGES.ONE_DAY]: {
    interval: '5m',
    dataPoints: 288,
    refreshInterval: 30000,
  },
  [CHART_RANGES.ONE_WEEK]: {
    interval: '1h',
    dataPoints: 168,
    refreshInterval: 60000,
  },
  [CHART_RANGES.ONE_MONTH]: {
    interval: '1d',
    dataPoints: 30,
    refreshInterval: 300000,
  },
  [CHART_RANGES.THREE_MONTHS]: {
    interval: '1d',
    dataPoints: 90,
    refreshInterval: 300000,
  },
  [CHART_RANGES.ONE_YEAR]: {
    interval: '1w',
    dataPoints: 52,
    refreshInterval: 600000,
  },
};

export default CHART_RANGES;
