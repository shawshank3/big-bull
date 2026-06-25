/**
 * AppInsights Model
 * Stores a single document with platform-wide statistics.
 * Updated on demand when the public /api/v1/insights endpoint is hit.
 */
const mongoose = require('mongoose');

const appInsightsSchema = new mongoose.Schema(
  {
    stockCount: { type: Number, default: 0 },
    mutualFundCount: { type: Number, default: 0 },
    userCount: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    lastComputedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

module.exports = mongoose.model('AppInsights', appInsightsSchema);
