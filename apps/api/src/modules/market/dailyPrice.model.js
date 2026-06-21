/**
 * DailyPrice Model
 *
 * Stores one closing-price record per asset per calendar day.
 *
 * Covers both asset types:
 *   - STOCK       → end-of-day closing price computed from the last mseWorker
 *                   tick before market close (or the last tick of the day).
 *   - MUTUAL_FUND → daily NAV value persisted once per day by the
 *                   dailyCloseWorker.
 *
 * Used for all multi-day chart ranges: 1W / 1M / 3M / 1Y for stocks, and
 * all chart ranges for mutual funds (MFs have no intraday history).
 *
 * Design rules:
 *   - Written ONLY by the dailyCloseWorker BullMQ job.
 *   - One document per (ticker, date) pair — enforced by a unique index.
 *   - `date` is stored as a plain YYYY-MM-DD string for simple range queries
 *     without timezone arithmetic on the DB side.
 *   - Historical chart collections are READ-ONLY for all API query paths;
 *     runtime price resolution never touches this collection.
 */
const mongoose = require('mongoose');

const dailyPriceSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: [true, 'ticker is required'],
      uppercase: true,
      trim: true,
    },

    assetType: {
      type: String,
      required: [true, 'assetType is required'],
      enum: ['STOCK', 'MUTUAL_FUND'],
    },

    // Calendar date in YYYY-MM-DD format (IST wall-clock date of the trading session).
    date: {
      type: String,
      required: [true, 'date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'],
    },

    // Closing price (₹) for STOCK; NAV (₹) for MUTUAL_FUND.
    closePrice: {
      type: Number,
      required: [true, 'closePrice is required'],
      min: [0.01, 'closePrice must be at least ₹0.01'],
    },
  },
  {
    timestamps: false,
    collection: 'dailyprices',
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Unique constraint: exactly one closing-price record per asset per day.
dailyPriceSchema.index({ ticker: 1, date: 1 }, { unique: true });

// Range query index: retrieve N most-recent daily closes for a ticker.
dailyPriceSchema.index({ ticker: 1, date: -1 });

// Support filtering by asset type (e.g. "all MF NAVs for date X").
dailyPriceSchema.index({ assetType: 1, date: -1 });

module.exports = mongoose.model('DailyPrice', dailyPriceSchema);
