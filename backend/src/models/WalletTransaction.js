/**
 * src/models/WalletTransaction.js
 * Tracks all credits and debits to user wallets with immutable audit trail.
 */
const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Transaction amount must be greater than 0'],
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      default: () => 'WTX-' + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900),
    },
    source: {
      type: String,
      enum: ['topup', 'booking', 'giftcard', 'refund', 'bonus'],
      default: 'topup',
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
