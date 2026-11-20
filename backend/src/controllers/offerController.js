/**
 * src/controllers/offerController.js
 * Handles promo offers listing and rigorous backend validation.
 */
const Offer = require('../models/Offer');
const Booking = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────────────────
// @route   GET /api/offers
// @access  Public
// ──────────────────────────────────────────────────────────
const getOffers = async (req, res, next) => {
  try {
    const category = req.query.category;
    const filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const offers = await Offer.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Offers fetched', offers);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   POST /api/offers/validate
// @access  Private (Needs auth to verify user eligibility like first booking)
// ──────────────────────────────────────────────────────────
const validateOffer = async (req, res, next) => {
  try {
    const { code, subtotal, journeyDate } = req.body;

    if (!code) {
      return sendError(res, 400, 'Please provide a promo code');
    }

    const promoCode = code.trim().toUpperCase();
    const offer = await Offer.findOne({ code: promoCode, isActive: true });

    if (!offer) {
      return sendError(res, 404, `Promo code "${promoCode}" is invalid or does not exist`);
    }

    // Check expiry
    const now = new Date();
    if (offer.validTill && new Date(offer.validTill) < now) {
      return sendError(res, 400, `Offer "${promoCode}" has expired on ${new Date(offer.validTill).toLocaleDateString()}`);
    }

    // Check minimum booking amount
    const bookingSubtotal = Number(subtotal) || 0;
    if (bookingSubtotal < (offer.minBookingAmount || 0)) {
      return sendError(
        res,
        400,
        `Minimum booking amount of ₹${offer.minBookingAmount} required to use "${promoCode}". Your current fare is ₹${bookingSubtotal}.`
      );
    }

    // Check first booking constraint
    if (offer.firstBookingOnly && req.user) {
      const pastConfirmedBookings = await Booking.countDocuments({
        user: req.user._id,
        status: 'confirmed',
      });
      if (pastConfirmedBookings > 0) {
        return sendError(
          res,
          400,
          `"${promoCode}" is exclusively valid for your first bus booking. You already have ${pastConfirmedBookings} confirmed booking(s).`
        );
      }
    }

    // Check weekend constraint
    if (offer.weekendOnly && journeyDate) {
      const jDate = new Date(journeyDate);
      const day = jDate.getDay(); // 0 is Sunday, 6 is Saturday
      if (day !== 0 && day !== 6) {
        return sendError(
          res,
          400,
          `"${promoCode}" can only be applied to travel on Saturdays or Sundays.`
        );
      }
    }

    // Calculate discount
    let discount = 0;
    if (offer.discountType === 'percentage') {
      const computed = Math.round((bookingSubtotal * offer.discountValue) / 100);
      discount = Math.min(computed, offer.maxDiscount || computed);
    } else {
      discount = Math.min(offer.discountValue, bookingSubtotal);
    }

    const finalAmount = Math.max(bookingSubtotal - discount, 0);

    return sendSuccess(res, 200, `Promo code ${promoCode} applied successfully! You saved ₹${discount}`, {
      code: offer.code,
      title: offer.title,
      discount,
      subtotal: bookingSubtotal,
      finalAmount,
      discountType: offer.discountType,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOffers, validateOffer };
