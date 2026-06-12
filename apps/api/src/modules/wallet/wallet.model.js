/**
 * Wallet Model
 * Represents a virtual wallet for each user.
 * Each user has exactly one wallet (enforced by the unique index on userId).
 * The default starting balance is ₹10,00,000 (1,000,000 INR).
 */
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 1000000, // ₹10,00,000
      min: [0, 'Balance cannot be negative'],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Pre-save hook: stamp updatedAt on every save
walletSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

walletSchema.index({ userId: 1 }, { unique: true });

const VirtualWallet = mongoose.model('VirtualWallet', walletSchema);

module.exports = VirtualWallet;
