/**
 * MarketState Model  (Phase 2)
 *
 * Persists the latest authoritative runtime price for every simulated asset.
 * This is the durable layer that sits between Redis (volatile) and the Asset
 * catalog (seed/reference data).
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Recovery chain (highest to lowest priority)                            │
 * │                                                                         │
 * │  1. Redis  `price:<ticker>`  (TTL 60s)   → fastest, in-memory          │
 * │  2. MarketState.lastPrice   (MongoDB)    → survived restarts / flushes  │
 * │  3. Asset.basePrice                      → seed value, last resort      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Design rules:
 *   - Written ONLY by the mseWorker after each successful 30-second tick.
 *   - Never written by the 1s live ticker.
 *   - Never written by any HTTP request handler.
 *   - Asset.basePrice must not be modified at runtime (it is pure reference data).
 *   - This collection is NOT used as the source of truth for charts — it is
 *     exclusively a runtime recovery mechanism.
 *   - One document per ticker — upserted on every tick to avoid unbounded growth.
 *
 * Mutual funds are included: even though MF NAVs do not change intraday, we
 * still persist them here so that a Redis flush does not cause MF price quotes
 * to fall back to the original seed price.
 */
const mongoose = require('mongoose');

const marketStateSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: [true, 'ticker is required'],
      uppercase: true,
      trim: true,
      unique: true,
    },

    // The most recently computed authoritative price in ₹.
    // For stocks: the price from the last completed mseWorker tick.
    // For mutual funds: the NAV value (stable within a day).
    lastPrice: {
      type: Number,
      required: [true, 'lastPrice is required'],
      min: [0.01, 'lastPrice must be at least ₹0.01'],
    },

    // ISO timestamp of when this price was last written by the mseWorker.
    lastUpdatedAt: {
      type: Date,
      required: [true, 'lastUpdatedAt is required'],
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'marketstates',
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Unique index on ticker — enforced by `unique: true` above.
// No TTL: documents live indefinitely and are overwritten on each tick.

module.exports = mongoose.model('MarketState', marketStateSchema);
