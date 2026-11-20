/**
 * src/utils/jwt.js
 * JWT helpers — generate and verify tokens.
 */
const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a given user id.
 * @param {string} userId - MongoDB ObjectId string
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
