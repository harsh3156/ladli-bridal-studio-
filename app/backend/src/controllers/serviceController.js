const Service = require('../models/Service');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { ApiResponse, buildPagination, buildQueryOptions } = require('../utils/apiResponse');
const { deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * GET /api/v1/services — Public
 */
const getAllServices = catchAsync(async (req, res) => {
  const { page, limit, skip, sort } = buildQueryOptions(req.query);
  const filter = { deletedAt: null };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  else filter.active = true; // Public: only active

  // Allow admin to see inactive too
  if (req.user?.role) delete filter.active;
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  if (req.query.minPrice) filter.price = { ...filter.price, $gte: Number(req.query.minPrice) };
  if (req.query.maxPrice) filter.price = { ...filter.price, $lte: Number(req.query.maxPrice) };

  const [services, total] = await Promise.all([
    Service.find(filter).sort(sort).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, services, buildPagination(total, page, limit));
});

/**
 * GET /api/v1/services/categories
 */
const getCategories = catchAsync(async (req, res) => {
  const categories = await Service.distinct('category', { active: true, deletedAt: null });
  return ApiResponse.success(res, categories, 'Categories fetched');
});

/**
 * GET /api/v1/services/:id
 */
const getServiceById = catchAsync(async (req, res, next) => {
  const service = await Service.findOne({ _id: req.params.id, deletedAt: null });
  if (!service) return next(new AppError('Service not found', 404));
  return ApiResponse.success(res, service);
});

/**
 * POST /api/v1/services — Admin
 */
const createService = catchAsync(async (req, res) => {
  const { title, description, category, price, duration, active, features, sortOrder } = req.body;

  const image = req.file
    ? { url: req.file.path, publicId: req.file.filename }
    : undefined;

  const service = await Service.create({
    title, description, category, price, duration, active, features, sortOrder, image,
  });

  logger.info(`Service created: ${title} by ${req.user.email}`);
  return ApiResponse.created(res, service, 'Service created successfully');
});

/**
 * PUT /api/v1/services/:id — Admin
 */
const updateService = catchAsync(async (req, res, next) => {
  const service = await Service.findOne({ _id: req.params.id, deletedAt: null });
  if (!service) return next(new AppError('Service not found', 404));

  const updates = { ...req.body };

  if (req.file) {
    // Delete old image from cloudinary
    if (service.image?.publicId) {
      await deleteFromCloudinary(service.image.publicId).catch((e) =>
        logger.error(`Failed to delete old image: ${e.message}`)
      );
    }
    updates.image = { url: req.file.path, publicId: req.file.filename };
  }

  const updated = await Service.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  });

  logger.info(`Service updated: ${service.title} by ${req.user.email}`);
  return ApiResponse.success(res, updated, 'Service updated successfully');
});

/**
 * DELETE /api/v1/services/:id — Soft delete
 */
const deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date(), active: false },
    { new: true }
  );
  if (!service) return next(new AppError('Service not found', 404));
  logger.info(`Service soft-deleted: ${service.title}`);
  return ApiResponse.success(res, null, 'Service deleted');
});

/**
 * PUT /api/v1/services/:id/toggle-active
 */
const toggleServiceActive = catchAsync(async (req, res, next) => {
  const service = await Service.findOne({ _id: req.params.id, deletedAt: null });
  if (!service) return next(new AppError('Service not found', 404));
  service.active = !service.active;
  await service.save();
  return ApiResponse.success(res, service, `Service ${service.active ? 'activated' : 'deactivated'}`);
});

module.exports = {
  getAllServices,
  getCategories,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
};
