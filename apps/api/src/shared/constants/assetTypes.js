// Asset Type Constants
const ASSET_TYPES = {
  STOCK: 'STOCK',
  MUTUAL_FUND: 'MUTUAL_FUND',
};

const ASSET_TYPE_VALUES = Object.values(ASSET_TYPES);

// Display labels for asset types
const ASSET_TYPE_LABELS = {
  [ASSET_TYPES.STOCK]: 'Stock',
  [ASSET_TYPES.MUTUAL_FUND]: 'Mutual Fund',
};

// Price field labels for different asset types
const PRICE_LABELS = {
  [ASSET_TYPES.STOCK]: 'Price',
  [ASSET_TYPES.MUTUAL_FUND]: 'NAV',
};

module.exports = {
  ASSET_TYPES,
  ASSET_TYPE_VALUES,
  ASSET_TYPE_LABELS,
  PRICE_LABELS,
};
