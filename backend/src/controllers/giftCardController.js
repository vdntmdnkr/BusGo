/**
 * src/controllers/giftCardController.js
 * Handles gift card generation (demo test credits) and secure redemption into BusGo Wallet.
 */
const crypto = require('crypto');
const GiftCard = require('../models/GiftCard');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────────────────
// @route   POST /api/giftcards/generate-demo
// @access  Private
// ──────────────────────────────────────────────────────────
const generateDemoGiftCard = async (req, res, next) => {
  try {
    const predefinedAmounts = [100, 250, 300, 500];
    const amount = req.body.amount || predefinedAmounts[Math.floor(Math.random() * predefinedAmounts.length)];

    // Generate random 4-character hex snippet
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `GIFT-${randomHex}-${new Date().getFullYear()}`;

    // Expiry 30 days from today
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const giftCard = await GiftCard.create({
      code,
      amount: Number(amount),
      expiryDate: expiry,
      isDemo: true,
      isRedeemed: false,
    });

    return sendSuccess(res, 201, 'Demo gift card generated successfully (Test Credits)', {
      code: giftCard.code,
      amount: giftCard.amount,
      expiryDate: giftCard.expiryDate,
      isDemo: true,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   POST /api/giftcards/redeem
// @access  Private
// ──────────────────────────────────────────────────────────
const redeemGiftCard = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return sendError(res, 400, 'Please enter a gift card code');
    }

    const cleanCode = code.trim().toUpperCase();
    const giftCard = await GiftCard.findOne({ code: cleanCode });

    if (!giftCard) {
      return sendError(res, 404, `Gift card code "${cleanCode}" is invalid`);
    }

    if (giftCard.isRedeemed) {
      return sendError(
        res,
        400,
        `This gift card has already been redeemed on ${new Date(giftCard.redeemedAt).toLocaleDateString()}`
      );
    }

    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      return sendError(res, 400, 'This gift card has expired');
    }

    // Mark as redeemed
    giftCard.isRedeemed = true;
    giftCard.redeemedBy = req.user._id;
    giftCard.redeemedAt = new Date();
    await giftCard.save();

    // Credit user's wallet
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: giftCard.amount } },
      { new: true }
    );

    // Record wallet transaction
    await WalletTransaction.create({
      user: req.user._id,
      type: 'credit',
      amount: giftCard.amount,
      balanceAfter: updatedUser.walletBalance,
      description: `Redeemed Gift Card (${cleanCode})`,
      source: 'giftcard',
    });

    return sendSuccess(res, 200, `🎉 Congratulations! ₹${giftCard.amount} added to your BusGo Wallet!`, {
      code: giftCard.code,
      amount: giftCard.amount,
      newWalletBalance: updatedUser.walletBalance,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/giftcards/my-redeemed
// @access  Private
// ──────────────────────────────────────────────────────────
const getMyRedeemedCards = async (req, res, next) => {
  try {
    const cards = await GiftCard.find({ redeemedBy: req.user._id }).sort({ redeemedAt: -1 });
    return sendSuccess(res, 200, 'Redeemed gift cards retrieved', cards);
  } catch (err) {
    next(err);
  }
};

module.exports = { generateDemoGiftCard, redeemGiftCard, getMyRedeemedCards };
