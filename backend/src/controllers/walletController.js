/**
 * src/controllers/walletController.js
 * Handles BusGo Wallet balance queries, simulated top-up, and transaction logs.
 */
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────────────────
// @route   GET /api/wallet
// @access  Private
// ──────────────────────────────────────────────────────────
const getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance name email');
    if (!user) return sendError(res, 404, 'User not found');

    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    return sendSuccess(res, 200, 'Wallet details retrieved', {
      balance: user.walletBalance,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   POST /api/wallet/topup (Simulated Wallet Top-Up)
// @access  Private
// ──────────────────────────────────────────────────────────
const topupWallet = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'Simulated UPI' } = req.body;
    const topupAmount = Number(amount);

    if (isNaN(topupAmount) || topupAmount < 10) {
      return sendError(res, 400, 'Minimum top-up amount is ₹10');
    }
    if (topupAmount > 10000) {
      return sendError(res, 400, 'Maximum single top-up limit is ₹10,000');
    }

    // Atomically increment user wallet balance
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: topupAmount } },
      { new: true }
    );

    // Create immutable audit transaction
    const tx = await WalletTransaction.create({
      user: req.user._id,
      type: 'credit',
      amount: topupAmount,
      balanceAfter: updatedUser.walletBalance,
      description: `Simulated Top-up via ${paymentMethod} (Test Credits)`,
      source: 'topup',
    });

    return sendSuccess(res, 200, `₹${topupAmount} test credits successfully added to your BusGo Wallet!`, {
      balance: updatedUser.walletBalance,
      transaction: tx,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/wallet/transactions
// @access  Private
// ──────────────────────────────────────────────────────────
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, 200, 'Transactions retrieved', transactions);
  } catch (err) {
    next(err);
  }
};

module.exports = { getWallet, topupWallet, getTransactions };
