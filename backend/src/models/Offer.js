/**
 * src/models/Offer.js
 * Promotional offers schema & model with validation constraints.
 */
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['first', 'weekend', 'student', 'festival', 'general'],
      default: 'general',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 500,
    },
    minBookingAmount: {
      type: Number,
      default: 0,
    },
    validTill: {
      type: Date,
      required: true,
    },
    firstBookingOnly: {
      type: Boolean,
      default: false,
    },
    weekendOnly: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
