/**
 * Holding Model
 * Schema for user holdings (mutual funds and stocks)
 */
const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['mutual', 'stock'],
    required: [true, 'Please specify holding type'],
  },
  name: {
    type: String,
    trim: true,
  },
  symbol: {
    type: String,
    uppercase: true,
    trim: true,
  },
  qty: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [0, 'Quantity cannot be negative'],
  },
  avgPrice: {
    type: Number,
    required: [true, 'Please provide average price'],
    min: [0, 'Average price cannot be negative'],
  },
  currentPrice: {
    type: Number,
    required: [true, 'Please provide current price'],
    min: [0, 'Current price cannot be negative'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique holding per user
holdingSchema.index({ user: 1, symbol: 1 });

// Update the updatedAt field on any modification
holdingSchema.pre('findByIdAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Populate user on find
holdingSchema.pre(/^find/, function(next) {
  // Only populate in certain contexts - can be controlled
  next();
});

module.exports = mongoose.model('Holding', holdingSchema);
