/**
 * Asset Model
 * Represents an investable instrument in the BigBull simulation.
 * Covers Indian equities (NSE/BSE) and Indian Mutual Funds.
 *
 * ⚠️  IMPORTANT: currentPrice is NOT stored here.
 *     Live/current price is always read from Redis (key: `price:<ticker>`, TTL: 60s).
 *     basePrice is only the seed price used when the asset is first introduced.
 */
const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  // NSE symbol for stocks (e.g. "RELIANCE", "INFY"); MFAPI scheme code for mutual funds
  ticker: {
    type: String,
    required: [true, 'Ticker is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },

  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
  },

  assetType: {
    type: String,
    required: [true, 'Asset type is required'],
    enum: {
      values: ['STOCK', 'MUTUAL_FUND'],
      message: 'assetType must be STOCK or MUTUAL_FUND',
    },
  },

  // Only applicable for STOCK type; null/undefined for mutual funds
  exchange: {
    type: String,
    enum: {
      values: ['NSE', 'BSE'],
      message: 'exchange must be NSE or BSE',
    },
    default: null,
  },

  // Sparse because mutual funds may not have an ISIN
  isin: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
  },

  // NSE/BSE sector classification (e.g. "BANKING", "IT", "PHARMA")
  // Used by MSE for SectorTrend (T_s) calculations
  sector: {
    type: String,
    trim: true,
    default: null,
  },

  // Asset-specific volatility multiplier V_a used in the MSE price formula.
  // Kept between 0 and 1 (inclusive).
  volatility: {
    type: Number,
    default: 0.01,
    min: [0, 'volatility must be >= 0'],
    max: [1, 'volatility must be <= 1'],
  },

  // Seed price in ₹. Used as initial price when the asset enters the simulation.
  // NOT the live/current price — always read live price from Redis.
  basePrice: {
    type: Number,
    required: [true, 'basePrice is required'],
    min: [1, 'basePrice must be at least ₹1'],
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// ── Indexes ─────────────────────────────────────────────────────────────────
// ticker unique index is created automatically by `unique: true` above.

// Sparse index on isin — allows multiple documents with null isin
assetSchema.index({ isin: 1 }, { sparse: true });

// Compound index for asset-type + sector lookups (used by MSE SectorTrend)
assetSchema.index({ assetType: 1, sector: 1 });

module.exports = mongoose.model('Asset', assetSchema);
