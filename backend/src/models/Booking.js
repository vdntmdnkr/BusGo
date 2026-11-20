/**
 * src/models/Booking.js
 * Booking model — links a user, bus, seat selection, pricing breakdown, and payment details.
 */
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    journeyDate: { type: Date, required: true },
    seats: { type: Number, required: true, min: 1, max: 6 },
    seatNumbers: [{ type: String, required: true }],
    baseFare: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    walletDeduction: { type: Number, default: 0 },
    totalFare: { type: Number, required: true }, // Net paid amount
    passengerName: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+91', trim: true },
    passengerPhone: { type: String, required: true, trim: true },
    boardingPoint: { type: String, default: 'Default Boarding Point' },
    droppingPoint: { type: String, default: 'Default Dropping Point' },
    promoCode: { type: String, trim: true, default: '' },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet'],
      default: 'upi',
    },
    paymentStatus: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed',
    },
    transactionRef: { type: String, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending'],
      default: 'confirmed',
    },
    bookingRef: { type: String, unique: true },
    pnr: { type: String, unique: true },
  },
  { timestamps: true }
);

// Auto-generate booking reference and PNR before validation/saving
bookingSchema.pre('validate', function (next) {
  if (!this.bookingRef) {
    this.bookingRef = 'BG' + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900);
  }
  if (!this.pnr) {
    this.pnr = 'PNR-' + Math.floor(100000 + Math.random() * 900000);
  }
  if (!this.transactionRef) {
    this.transactionRef = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bus: 1, journeyDate: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
