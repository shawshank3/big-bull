/**
 * Watchlist Model
 * Schema for user watchlist items
 */
const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: {
    type: String,
    required: [true, 'Please provide symbol'],
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['mutual', 'stock'],
    required: true,
  },
  targetPrice: {
    type: Number,
    default: null,
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique watchlist item per user
watchlistSchema.index({ user: 1, symbol: 1 });

module.exports = mongoose.model('Watchlist', watchlistSchema);
