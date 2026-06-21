const express = require('express');
const router = express.Router();
const {
  getAllServices, getCategories, getServiceById,
  createService, updateService, deleteService, toggleServiceActive,
} = require('../controllers/serviceController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { createServiceValidator, mongoIdValidator } = require('../validators');
const { uploadServiceImage } = require('../config/cloudinary');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Beauty services catalogue
 */

// Public routes
router.get('/', optionalAuth, getAllServices);
router.get('/categories', getCategories);
router.get('/:id', mongoIdValidator, validate, getServiceById);

// Admin routes
router.use(protect, restrictTo('super_admin', 'manager'));
router.post(
  '/',
  uploadLimiter,
  uploadServiceImage.single('image'),
  createServiceValidator,
  validate,
  createService
);
router.put(
  '/:id',
  mongoIdValidator,
  uploadLimiter,
  uploadServiceImage.single('image'),
  validate,
  updateService
);
router.delete('/:id', mongoIdValidator, validate, deleteService);
router.put('/:id/toggle-active', mongoIdValidator, validate, toggleServiceActive);

module.exports = router;
