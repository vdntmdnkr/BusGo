/**
 * src/models/GiftCard.js
 * Gift Card model for redeemable vouchers crediting the BusGo Wallet.
 */
const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [10, 'Gift card amount must be at least ₹10'],
      max: [5000, 'Gift card amount cannot exceed ₹5000'],
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isRedeemed: {
      type: Boolean,
      default: false,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GiftCard', giftCardSchema);
