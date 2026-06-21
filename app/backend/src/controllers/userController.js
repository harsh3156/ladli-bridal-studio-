const User = require('../models/User');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { ApiResponse, buildPagination, buildQueryOptions } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * GET /api/v1/users — Admin: list all users
 */
const getAllUsers = catchAsync(async (req, res) => {
  const { page, limit, skip, sort } = buildQueryOptions(req.query);
  const filter = { deletedAt: null };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, users, buildPagination(total, page, limit));
});

/**
 * GET /api/v1/users/:id
 */
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, deletedAt: null });
  if (!user) return next(new AppError('User not found', 404));
  return ApiResponse.success(res, user);
});

/**
 * POST /api/v1/users — Super admin creates new user
 */
const createUser = catchAsync(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('Email already in use', 400));

  const user = await User.create({ name, email, password, role, phone });
  logger.info(`New user created: ${email} (${role}) by ${req.user.email}`);
  return ApiResponse.created(res, user, 'User created successfully');
});

/**
 * PUT /api/v1/users/:id
 */
const updateUser = catchAsync(async (req, res, next) => {
  const { name, phone, role, isActive } = req.body;

  // Only super_admin can change roles
  if (role && req.user.role !== 'super_admin') {
    return next(new AppError('Only super admins can change user roles', 403));
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { name, phone, ...(role && { role }), ...(isActive !== undefined && { isActive }) },
    { new: true, runValidators: true }
  );

  if (!user) return next(new AppError('User not found', 404));
  logger.info(`User updated: ${user.email} by ${req.user.email}`);
  return ApiResponse.success(res, user, 'User updated successfully');
});

/**
 * DELETE /api/v1/users/:id — Soft delete
 */
const deleteUser = catchAsync(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date(), isActive: false },
    { new: true }
  );

  if (!user) return next(new AppError('User not found', 404));
  logger.info(`User soft-deleted: ${user.email} by ${req.user.email}`);
  return ApiResponse.success(res, null, 'User deleted successfully');
});

/**
 * PUT /api/v1/users/:id/toggle-active
 */
const toggleUserActive = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, deletedAt: null });
  if (!user) return next(new AppError('User not found', 404));

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  logger.info(`User ${user.isActive ? 'activated' : 'deactivated'}: ${user.email}`);
  return ApiResponse.success(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, toggleUserActive };
