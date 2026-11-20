/**
 * src/middleware/auth.js
 * JWT authentication & role-based authorisation middleware.
 */
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * protect — verifies the Bearer token in the Authorization header.
 * Attaches the user document to req.user on success.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Not authorised — no token provided');
    }

    // Verify & decode
    const decoded = verifyToken(token);

    // Fetch fresh user (ensures the token is still valid even if user was deactivated)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 401, 'User belonging to this token no longer exists');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'This account has been deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token');
    }
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token has expired — please log in again');
    }
    return sendError(res, 500, 'Authentication error');
  }
};

/**
 * authorise — role-based access control.
 * Use after protect: authorise('admin') or authorise('admin', 'moderator')
 */
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Role '${req.user.role}' is not allowed to access this resource`
      );
    }
    next();
  };
};

module.exports = { protect, authorise };
