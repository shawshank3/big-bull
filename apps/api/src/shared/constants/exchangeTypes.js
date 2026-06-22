// Exchange Type Constants
const EXCHANGE_TYPES = {
  NSE: 'NSE',
  BSE: 'BSE',
};

const EXCHANGE_TYPE_VALUES = Object.values(EXCHANGE_TYPES);

// Display labels for exchanges
const EXCHANGE_TYPE_LABELS = {
  [EXCHANGE_TYPES.NSE]: 'National Stock Exchange',
  [EXCHANGE_TYPES.BSE]: 'Bombay Stock Exchange',
};

module.exports = {
  EXCHANGE_TYPES,
  EXCHANGE_TYPE_VALUES,
  EXCHANGE_TYPE_LABELS,
};
