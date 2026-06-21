const Gallery = require('../models/Gallery');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { ApiResponse, buildPagination, buildQueryOptions } = require('../utils/apiResponse');
const { deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * GET /api/v1/gallery — Public
 */
const getAllGallery = catchAsync(async (req, res) => {
  const { page, limit, skip, sort } = buildQueryOptions(req.query);
  const filter = { deletedAt: null };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.beforeAfter === 'true') filter.beforeAfter = true;

  const [gallery, total] = await Promise.all([
    Gallery.find(filter)
      .populate('uploadedBy', 'name')
      .sort(sort).skip(skip).limit(limit),
    Gallery.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, gallery, buildPagination(total, page, limit));
});

/**
 * GET /api/v1/gallery/:id
 */
const getGalleryById = catchAsync(async (req, res, next) => {
  const item = await Gallery.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) return next(new AppError('Gallery item not found', 404));
  return ApiResponse.success(res, item);
});

/**
 * POST /api/v1/gallery — Admin, single upload
 */
const createGalleryItem = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Image is required', 400));

  const { title, category, beforeAfter, featured, sortOrder } = req.body;

  const item = await Gallery.create({
    image: { url: req.file.path, publicId: req.file.filename },
    title,
    category,
    beforeAfter: beforeAfter === 'true',
    featured: featured === 'true',
    sortOrder: sortOrder || 0,
    uploadedBy: req.user._id,
  });

  logger.info(`Gallery item created: ${item._id} by ${req.user.email}`);
  return ApiResponse.created(res, item, 'Gallery item uploaded');
});

/**
 * POST /api/v1/gallery/bulk — Admin, multiple upload
 */
const bulkUploadGallery = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next(new AppError('No images provided', 400));

  const { category, beforeAfter } = req.body;

  const items = req.files.map((file) => ({
    image: { url: file.path, publicId: file.filename },
    category: category || 'Other',
    beforeAfter: beforeAfter === 'true',
    uploadedBy: req.user._id,
  }));

  const created = await Gallery.insertMany(items);
  logger.info(`Bulk gallery upload: ${created.length} images by ${req.user.email}`);
  return ApiResponse.created(res, created, `${created.length} images uploaded successfully`);
});

/**
 * PUT /api/v1/gallery/:id — Admin
 */
const updateGalleryItem = catchAsync(async (req, res, next) => {
  const { title, category, beforeAfter, featured, sortOrder, pairedWith } = req.body;

  const item = await Gallery.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { title, category, beforeAfter, featured, sortOrder, pairedWith },
    { new: true, runValidators: true }
  );

  if (!item) return next(new AppError('Gallery item not found', 404));
  return ApiResponse.success(res, item, 'Gallery item updated');
});

/**
 * DELETE /api/v1/gallery/:id — Admin, soft delete + cloudinary cleanup
 */
const deleteGalleryItem = catchAsync(async (req, res, next) => {
  const item = await Gallery.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) return next(new AppError('Gallery item not found', 404));

  // Delete from Cloudinary
  if (item.image?.publicId) {
    await deleteFromCloudinary(item.image.publicId).catch((e) =>
      logger.error(`Failed to delete gallery image: ${e.message}`)
    );
  }

  await Gallery.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
  logger.info(`Gallery item deleted: ${req.params.id}`);
  return ApiResponse.success(res, null, 'Gallery item deleted');
});

module.exports = {
  getAllGallery,
  getGalleryById,
  createGalleryItem,
  bulkUploadGallery,
  updateGalleryItem,
  deleteGalleryItem,
};
