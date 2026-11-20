/**
 * src/controllers/authController.js
 * Handles user registration, login, profile retrieval and updates.
 */
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { validatePhoneNumber } = require('../utils/phoneValidator');

// ──────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ──────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, countryCode, phone } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 409, 'An account with this email already exists');
    }

    let validPhone = '';
    let validCode = countryCode || '+91';

    if (phone) {
      const phoneValidation = validatePhoneNumber(validCode, phone);
      if (!phoneValidation.isValid) {
        return sendError(res, 400, phoneValidation.message);
      }
      validPhone = phoneValidation.cleanedPhone;
    }

    const initialWallet = 500; // ₹500 Welcome Bonus credits

    const user = await User.create({
      name,
      email,
      password,
      countryCode: validCode,
      phone: validPhone,
      role: 'user',
      walletBalance: initialWallet,
    });

    // Create welcome bonus transaction in wallet
    await WalletTransaction.create({
      user: user._id,
      type: 'credit',
      amount: initialWallet,
      balanceAfter: initialWallet,
      description: 'Welcome Bonus Test Credits',
      source: 'bonus',
    });

    const token = generateToken(user._id);

    return sendSuccess(res, 201, 'Registration successful! ₹500 demo credits added to your BusGo Wallet.', {
      user: user.toPublicJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ──────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password field included
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated');
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Login successful', {
      user: user.toPublicJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private
// ──────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'Profile fetched', user.toPublicJSON());
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   PUT /api/auth/me (Personal Information update)
// @access  Private
// ──────────────────────────────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    const { name, phone, countryCode, dateOfBirth, gender, address, city } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return sendError(res, 400, 'Full name must be at least 2 characters');
      }
      updates.name = name.trim();
    }

    if (phone !== undefined && phone !== '') {
      const code = countryCode || req.user.countryCode || '+91';
      const check = validatePhoneNumber(code, phone);
      if (!check.isValid) {
        return sendError(res, 400, check.message);
      }
      updates.phone = check.cleanedPhone;
      updates.countryCode = code;
    } else if (phone === '') {
      updates.phone = '';
    }

    if (countryCode && !phone) {
      updates.countryCode = countryCode;
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth) {
        const d = new Date(dateOfBirth);
        if (isNaN(d.getTime())) {
          return sendError(res, 400, 'Invalid date of birth');
        }
        updates.dateOfBirth = d;
      } else {
        updates.dateOfBirth = null;
      }
    }

    if (gender !== undefined) {
      updates.gender = gender;
    }

    if (address !== undefined) {
      updates.address = address.trim();
    }

    if (city !== undefined) {
      updates.city = city.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, 'Personal information updated successfully', updatedUser.toPublicJSON());
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @access  Private
// ──────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return sendError(res, 401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);
    return sendSuccess(res, 200, 'Password changed successfully', { token });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateMe, changePassword };
