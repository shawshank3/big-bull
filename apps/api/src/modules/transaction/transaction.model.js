/**
 * Transaction Model
 * Records every BUY / SELL order a user executes in the BigBull simulation.
 *
 * Design notes:
 *  - timestamps: false  — executedAt serves as the single time field.
 *  - quantity supports fractional shares (min 0.001) to accommodate mutual funds.
 *  - pricePerUnit and fees are stored in ₹.
 *  - This is the SOURCE OF TRUTH for all portfolio calculations.
 *    Derived totals (e.g. portfolio value, P&L) are NEVER stored — always
 *    computed via aggregateHoldings() from raw transactions.
 */
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'assetId is required'],
      index: true,
    },

    transactionType: {
      type: String,
      required: [true, 'transactionType is required'],
      enum: {
        values: ['BUY', 'SELL'],
        message: 'transactionType must be BUY or SELL',
      },
    },

    // Fractional quantities supported (e.g. 0.5 units of a mutual fund)
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
      min: [0.001, 'quantity must be at least 0.001'],
    },

    // Price per unit at the time of execution, in ₹
    pricePerUnit: {
      type: Number,
      required: [true, 'pricePerUnit is required'],
      min: [0.01, 'pricePerUnit must be at least ₹0.01'],
    },

    // Brokerage / platform fees in ₹
    fees: {
      type: Number,
      default: 0,
      min: [0, 'fees must be >= 0'],
    },

    // Optional trader note attached to the order
    notes: {
      type: String,
      maxlength: [500, 'notes must not exceed 500 characters'],
      default: undefined,
    },

    // When the order was executed; acts as the primary timestamp for this model
    executedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // executedAt replaces createdAt / updatedAt
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Single-field indexes on userId, assetId, and executedAt are defined inline
// via `index: true` above.

// Compound index for paginated user transaction history (most common query pattern)
transactionSchema.index({ userId: 1, executedAt: -1 });

// Compound index for holdings aggregation and sell-side validation
transactionSchema.index({ userId: 1, assetId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
