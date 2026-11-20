/**
 * src/controllers/bookingController.js
 * Handles seat-wise booking, phone validation, promo validation,
 * simulated payment gateways, wallet deductions, refunds, and ticket retrieval.
 */
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const User = require('../models/User');
const Offer = require('../models/Offer');
const WalletTransaction = require('../models/WalletTransaction');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validatePhoneNumber } = require('../utils/phoneValidator');

const dayRange = (d) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { $gte: start, $lt: end };
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/bookings/taken/:busId?date=YYYY-MM-DD
// @access  Public / Private
// ──────────────────────────────────────────────────────────
const getTakenSeats = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { date } = req.query;

    if (!date) return sendError(res, 400, 'Journey date is required');

    const list = await Booking.find({
      bus: busId,
      status: 'confirmed',
      journeyDate: dayRange(date),
    }).select('seatNumbers');

    const taken = list.flatMap((b) => b.seatNumbers || []);
    return sendSuccess(res, 200, 'Taken seats retrieved', taken);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   POST /api/bookings
// @access  Private
// ──────────────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const {
      busId,
      journeyDate,
      seatNumbers,
      passengerName,
      countryCode = '+91',
      passengerPhone,
      boardingPoint,
      droppingPoint,
      promoCode,
      paymentMethod = 'upi',
      simulateFailure = false, // Allowed for academic test demonstration
    } = req.body;

    // 1. Validate seats
    if (!Array.isArray(seatNumbers) || seatNumbers.length < 1 || seatNumbers.length > 6) {
      return sendError(res, 400, 'Please select between 1 and 6 seats');
    }

    // 2. Validate passenger name
    if (!passengerName || passengerName.trim().length < 2) {
      return sendError(res, 400, 'Please enter a valid passenger name (minimum 2 characters)');
    }

    // 3. Strict Phone Number Validation with Country Code
    const phoneCheck = validatePhoneNumber(countryCode, passengerPhone);
    if (!phoneCheck.isValid) {
      return sendError(res, 400, phoneCheck.message);
    }

    // 4. Validate bus
    const bus = await Bus.findById(busId);
    if (!bus || !bus.isActive) {
      return sendError(res, 404, 'Selected bus is not available or does not exist');
    }

    const numSeats = seatNumbers.length;
    if (bus.availableSeats < numSeats) {
      return sendError(res, 400, `Only ${bus.availableSeats} seat(s) remain available on this bus`);
    }

    // 5. Prevent double booking of identical seats for that date
    const dateQuery = dayRange(journeyDate);
    const seatConflict = await Booking.find({
      bus: busId,
      status: 'confirmed',
      journeyDate: dateQuery,
      seatNumbers: { $in: seatNumbers.map(String) },
    });

    if (seatConflict.length > 0) {
      return sendError(
        res,
        409,
        'One or more of your selected seats were just booked by another traveler. Please pick different seats.'
      );
    }

    // 6. Pricing breakdown
    const baseFare = bus.fare * numSeats;
    const taxAmount = Math.round(baseFare * 0.05); // 5% GST & platform insurance
    let subtotalWithTax = baseFare + taxAmount;
    let discount = 0;
    let appliedCode = '';

    // 7. Promo code backend validation
    if (promoCode && promoCode.trim()) {
      const codeClean = promoCode.trim().toUpperCase();
      const offer = await Offer.findOne({ code: codeClean, isActive: true });

      if (!offer) {
        return sendError(res, 400, `Invalid promo code "${codeClean}"`);
      }

      if (offer.validTill && new Date(offer.validTill) < new Date()) {
        return sendError(res, 400, `Promo code "${codeClean}" has expired`);
      }

      if (baseFare < (offer.minBookingAmount || 0)) {
        return sendError(
          res,
          400,
          `Minimum ticket fare of ₹${offer.minBookingAmount} required to apply "${codeClean}".`
        );
      }

      if (offer.firstBookingOnly) {
        const pastBookings = await Booking.countDocuments({ user: req.user._id, status: 'confirmed' });
        if (pastBookings > 0) {
          return sendError(res, 400, `"${codeClean}" is only valid on your first booking.`);
        }
      }

      if (offer.weekendOnly) {
        const day = new Date(journeyDate).getDay();
        if (day !== 0 && day !== 6) {
          return sendError(res, 400, `"${codeClean}" is valid only for weekend journeys (Saturday/Sunday).`);
        }
      }

      if (offer.discountType === 'percentage') {
        const calculated = Math.round((baseFare * offer.discountValue) / 100);
        discount = Math.min(calculated, offer.maxDiscount || calculated);
      } else {
        discount = Math.min(offer.discountValue, baseFare);
      }
      appliedCode = codeClean;
    }

    const netPayable = Math.max(subtotalWithTax - discount, 0);

    // 8. Test simulation failure option
    if (simulateFailure === true) {
      return sendError(res, 402, 'Simulated Payment Failed: Bank server declined the transaction. (Test Mode)');
    }

    // 9. Payment & Wallet handling
    let walletDeduction = 0;
    const user = await User.findById(req.user._id);

    if (paymentMethod === 'wallet') {
      if (user.walletBalance < netPayable) {
        return sendError(
          res,
          400,
          `Insufficient BusGo Wallet balance. Required: ₹${netPayable}, Available: ₹${user.walletBalance}. Please top up your wallet or choose another payment method.`
        );
      }
      walletDeduction = netPayable;
      user.walletBalance -= netPayable;
      await user.save();

      // Log wallet transaction
      await WalletTransaction.create({
        user: req.user._id,
        type: 'debit',
        amount: netPayable,
        balanceAfter: user.walletBalance,
        description: `Ticket Booking for ${bus.operator} (${bus.from} → ${bus.to})`,
        source: 'booking',
      });
    }

    // 10. Generate booking record
    const transactionRef = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    const bookingRef = 'BG' + Date.now().toString(36).toUpperCase();
    const pnr = 'PNR' + Math.floor(100000 + Math.random() * 900000);

    const bPoint = boardingPoint || (bus.boardingPoints && bus.boardingPoints[0] ? bus.boardingPoints[0].name : `${bus.from} Central Bus Stand`);
    const dPoint = droppingPoint || (bus.droppingPoints && bus.droppingPoints[0] ? bus.droppingPoints[0].name : `${bus.to} City Center`);

    const booking = await Booking.create({
      user: req.user._id,
      bus: busId,
      journeyDate: new Date(journeyDate),
      seats: numSeats,
      seatNumbers: seatNumbers.map(String),
      baseFare,
      taxAmount,
      discount,
      walletDeduction,
      totalFare: netPayable,
      passengerName: passengerName.trim(),
      countryCode,
      passengerPhone: phoneCheck.cleanedPhone,
      boardingPoint: bPoint,
      droppingPoint: dPoint,
      promoCode: appliedCode,
      paymentMethod,
      paymentStatus: 'completed',
      transactionRef,
      bookingRef,
      pnr,
      status: 'confirmed',
    });

    // 11. Decrement available seats on the bus
    bus.availableSeats = Math.max(bus.availableSeats - numSeats, 0);
    await bus.save();

    await booking.populate('bus');

    return sendSuccess(res, 201, 'Payment approved! Your bus ticket is confirmed.', booking);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/bookings/my
// @access  Private
// ──────────────────────────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('bus')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Bookings fetched', bookings);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/bookings/:id
// @access  Private
// ──────────────────────────────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('bus');
    if (!booking) return sendError(res, 404, 'Booking not found');

    // Authorize customer or operator
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'operator') {
      return sendError(res, 403, 'Not authorized to view this ticket');
    }

    return sendSuccess(res, 200, 'Ticket details retrieved', booking);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   PUT /api/bookings/:id/cancel
// @access  Private
// ──────────────────────────────────────────────────────────
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 404, 'Booking not found');

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Unauthorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 400, 'This booking has already been cancelled');
    }

    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Release seats back to the bus
    await Bus.findByIdAndUpdate(booking.bus, {
      $inc: { availableSeats: booking.seats },
    });

    // Refund ticket amount into BusGo Wallet
    const refundAmount = booking.totalFare;
    if (refundAmount > 0) {
      const user = await User.findByIdAndUpdate(
        booking.user,
        { $inc: { walletBalance: refundAmount } },
        { new: true }
      );

      await WalletTransaction.create({
        user: booking.user,
        type: 'credit',
        amount: refundAmount,
        balanceAfter: user.walletBalance,
        description: `Refund for Cancelled Ticket (PNR: ${booking.pnr || booking.bookingRef})`,
        source: 'refund',
      });
    }

    return sendSuccess(
      res,
      200,
      `Booking cancelled successfully. ₹${refundAmount} has been refunded to your BusGo Wallet.`,
      booking
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getTakenSeats,
};
