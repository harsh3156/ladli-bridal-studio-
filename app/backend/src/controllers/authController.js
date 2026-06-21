const crypto = require('crypto');
const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { ApiResponse } = require('../utils/apiResponse');
const {
  generateTokenPair,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, deletedAt: null })
    .select('+password +loginAttempts +lockUntil');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account temporarily locked due to multiple failed attempts. Try again in 2 hours.', 423));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact support.', 401));
  }

  // Reset login attempts on success
  await User.findByIdAndUpdate(user._id, {
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Store refresh token hash
  await User.findByIdAndUpdate(user._id, {
    refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
  });

  setTokenCookies(res, accessToken, refreshToken);

  logger.info(`User logged in: ${user.email} (${user.role})`);

  return ApiResponse.success(res, {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  }, 'Login successful');
});

/**
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  clearTokenCookies(res);
  logger.info(`User logged out: ${req.user.email}`);
  return ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * POST /api/v1/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return next(new AppError('Refresh token not provided', 401));

  const decoded = verifyRefreshToken(token);
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ _id: decoded.id, refreshToken: hashedToken, isActive: true, deletedAt: null });
  if (!user) return next(new AppError('Invalid or expired refresh token', 401));

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

  await User.findByIdAndUpdate(user._id, {
    refreshToken: crypto.createHash('sha256').update(newRefreshToken).digest('hex'),
  });

  setTokenCookies(res, accessToken, newRefreshToken);

  return ApiResponse.success(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
});

/**
 * GET /api/v1/auth/me
 */
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, user, 'Profile fetched');
});

/**
 * PUT /api/v1/auth/update-profile
 */
const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );
  return ApiResponse.success(res, user, 'Profile updated');
});

/**
 * PUT /api/v1/auth/change-password
 */
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
  setTokenCookies(res, accessToken, newRefreshToken);

  logger.info(`Password changed for user: ${user.email}`);
  return ApiResponse.success(res, { accessToken }, 'Password changed successfully');
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email, deletedAt: null });

  // Always return success to prevent email enumeration
  if (!user) {
    return ApiResponse.success(res, null, 'If that email exists, a reset link has been sent.');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);
    logger.info(`Password reset email sent to: ${user.email}`);
    return ApiResponse.success(res, null, 'Password reset email sent successfully.');
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    logger.error(`Failed to send reset email: ${err.message}`);
    return next(new AppError('Error sending email. Please try again later.', 500));
  }
});

/**
 * POST /api/v1/auth/reset-password/:token
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    deletedAt: null,
  });

  if (!user) return next(new AppError('Invalid or expired reset token', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const { accessToken, refreshToken } = generateTokenPair(user);
  setTokenCookies(res, accessToken, refreshToken);

  logger.info(`Password reset for user: ${user.email}`);
  return ApiResponse.success(res, { accessToken }, 'Password reset successful');
});

module.exports = {
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
