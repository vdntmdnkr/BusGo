/**
 * src/utils/apiResponse.js
 * Standardised response helpers to keep controllers DRY.
 */

/**
 * Send a success response.
 * @param {object} res  - Express response object
 * @param {number} statusCode
 * @param {string} message
 * @param {*}      data
 * @param {object} [meta]  - optional pagination / extra info
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Send an error response.
 * @param {object} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*}      [errors]
 */
const sendError = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  const payload = { success: false, message };
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Build a pagination meta object for list responses.
 */
const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

module.exports = { sendSuccess, sendError, paginationMeta };
