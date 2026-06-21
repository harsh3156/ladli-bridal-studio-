const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { AppError, catchAsync } = require('./errorHandler');

/**
 * Protect routes — verify JWT and attach user to req
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  // Get token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  // Check if user still exists
  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  // Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  req.user = user;
  next();
});

/**
 * Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch {
      // Ignore errors — optional auth
    }
  }

  next();
});

module.exports = { protect, restrictTo, optionalAuth };
