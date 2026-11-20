/**
 * src/models/User.js
 * Mongoose schema & model for application users (customers, operators, admins).
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const operatorProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    totalBuses: { type: Number, default: 0 },
    routesServed: [{ type: String }],
    description: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password field by default
    },
    countryCode: {
      type: String,
      default: '+91',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'operator', 'admin'],
      default: 'user',
    },
    walletBalance: {
      type: Number,
      default: 500, // Demo welcome bonus balance
      min: [0, 'Wallet balance cannot be negative'],
    },
    operatorProfile: {
      type: operatorProfileSchema,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save hook: hash password before saving ───────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare plain password with hash ────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance method: return safe public profile ──────────
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    countryCode: this.countryCode || '+91',
    phone: this.phone || '',
    dateOfBirth: this.dateOfBirth,
    gender: this.gender || '',
    address: this.address || '',
    city: this.city || '',
    role: this.role,
    walletBalance: this.walletBalance,
    operatorProfile: this.operatorProfile,
    avatar: this.avatar,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
