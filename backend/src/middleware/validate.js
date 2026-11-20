/**
 * src/middleware/validate.js
 * express-validator helper — runs validation rules and returns 422 on failure.
 */
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return sendError(res, 422, 'Validation failed', messages);
  }
  next();
};

module.exports = validate;
