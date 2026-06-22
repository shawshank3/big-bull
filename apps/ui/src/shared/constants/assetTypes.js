// Asset Type Constants - UI Version (mirrors API constants)
export const ASSET_TYPES = {
  STOCK: 'STOCK',
  MUTUAL_FUND: 'MUTUAL_FUND',
};

export const ASSET_TYPE_VALUES = Object.values(ASSET_TYPES);

// Display labels for asset types
export const ASSET_TYPE_LABELS = {
  [ASSET_TYPES.STOCK]: 'Stock',
  [ASSET_TYPES.MUTUAL_FUND]: 'Mutual Fund',
};

// Price field labels for different asset types
export const PRICE_LABELS = {
  [ASSET_TYPES.STOCK]: 'Price',
  [ASSET_TYPES.MUTUAL_FUND]: 'NAV',
};

// Legacy holding types (for backward compatibility)
export const HOLDING_TYPES = {
  MUTUAL: 'mutual',
  STOCK: 'stock',
};

// Mapping between new and legacy types
export const ASSET_TYPE_MAPPING = {
  [ASSET_TYPES.STOCK]: HOLDING_TYPES.STOCK,
  [ASSET_TYPES.MUTUAL_FUND]: HOLDING_TYPES.MUTUAL,
};

export default ASSET_TYPES;
