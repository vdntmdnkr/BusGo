/**
 * src/controllers/userController.js
 * Admin-level user management endpoints.
 */
const User = require('../models/User');
const { sendSuccess, sendError, paginationMeta } = require('../utils/apiResponse');

// GET /api/users  (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    return sendSuccess(res, 200, 'Users fetched', users, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id  (admin only)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User fetched', user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id  (admin only)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User updated', user);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  (admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');

    // Prevent deleting own account from this endpoint
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, 'You cannot delete your own account from this endpoint');
    }

    await user.deleteOne();
    return sendSuccess(res, 200, 'User deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
