const { validationResult } = require('express-validator');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * Middleware to check validation results and return errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.validationError(res, errors.array());
  }
  next();
};

module.exports = { validate };
