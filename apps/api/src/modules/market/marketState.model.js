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
 * Mutual funds are NOT included anymore: their source of truth is the
 * DailyPrice collection (one record per IST day).  The `lastNavDate` field
 * below is retained for backwards compatibility with older deployments but
 * is no longer written by any code path.
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

    // [DEPRECATED] IST date (YYYY-MM-DD) of the most recent NAV rollover for
    // mutual funds.  Previously used to gate the per-day NAV rollover in
    // mseWorker.  Mutual funds now use DailyPrice as their source of truth so
    // this field is no longer written.  Retained on the schema only so older
    // documents continue to load without validation errors.
    lastNavDate: {
      type: String,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'lastNavDate must be in YYYY-MM-DD format'],
      default: undefined,
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
