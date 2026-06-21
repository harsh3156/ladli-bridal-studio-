const express = require('express');
const {
  getAllGallery, getGalleryById, createGalleryItem, bulkUploadGallery,
  updateGalleryItem, deleteGalleryItem,
} = require('../controllers/galleryController');
const {
  getAllTeam, getTeamById, createTeamMember, updateTeamMember, deleteTeamMember,
  getAllTestimonials, createTestimonial, updateTestimonial, approveTestimonial, deleteTestimonial,
  getAllReviews, createReview, updateReview, approveReview, deleteReview,
  getAllContactMessages, getUnreadCount, submitContact, markContactRead, markContactReplied, deleteContactMessage,
} = require('../controllers/miscControllers');
const {
  getDashboardStats, getMonthlyRevenue, getPopularServices,
  getBookingAnalytics, getReviewAnalytics, getActiveCustomers,
} = require('../controllers/dashboardController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadLimiter, publicFormLimiter } = require('../middleware/rateLimiter');
const {
  createGalleryValidator, createTeamValidator, createTestimonialValidator,
  createReviewValidator, contactValidator, mongoIdValidator,
} = require('../validators');
const { uploadGalleryImages, uploadTeamImage, uploadTestimonialImage } = require('../config/cloudinary');

// ─── Gallery ──────────────────────────────────────────────────────────────────
const galleryRouter = express.Router();

galleryRouter.get('/', getAllGallery);
galleryRouter.get('/:id', mongoIdValidator, validate, getGalleryById);

galleryRouter.use(protect, restrictTo('super_admin', 'manager', 'staff'));
galleryRouter.post(
  '/',
  uploadLimiter,
  uploadGalleryImages.single('image'),
  createGalleryValidator,
  validate,
  createGalleryItem
);
galleryRouter.post(
  '/bulk',
  uploadLimiter,
  uploadGalleryImages.array('images', 20),
  bulkUploadGallery
);
galleryRouter.put('/:id', mongoIdValidator, validate, updateGalleryItem);
galleryRouter.delete('/:id', restrictTo('super_admin', 'manager'), mongoIdValidator, validate, deleteGalleryItem);

// ─── Team ─────────────────────────────────────────────────────────────────────
const teamRouter = express.Router();

teamRouter.get('/', optionalAuth, getAllTeam);
teamRouter.get('/:id', mongoIdValidator, validate, getTeamById);

teamRouter.use(protect, restrictTo('super_admin', 'manager'));
teamRouter.post(
  '/',
  uploadLimiter,
  uploadTeamImage.single('image'),
  createTeamValidator,
  validate,
  createTeamMember
);
teamRouter.put('/:id', mongoIdValidator, uploadTeamImage.single('image'), validate, updateTeamMember);
teamRouter.delete('/:id', mongoIdValidator, validate, deleteTeamMember);

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonialRouter = express.Router();

testimonialRouter.get('/', optionalAuth, getAllTestimonials);
testimonialRouter.post(
  '/',
  publicFormLimiter,
  uploadTestimonialImage.single('image'),
  createTestimonialValidator,
  validate,
  createTestimonial
);

testimonialRouter.use(protect, restrictTo('super_admin', 'manager'));
testimonialRouter.put('/:id', mongoIdValidator, validate, updateTestimonial);
testimonialRouter.put('/:id/approve', mongoIdValidator, validate, approveTestimonial);
testimonialRouter.delete('/:id', mongoIdValidator, validate, deleteTestimonial);

// ─── Reviews ──────────────────────────────────────────────────────────────────
const reviewRouter = express.Router();

reviewRouter.get('/', optionalAuth, getAllReviews);
reviewRouter.post('/', publicFormLimiter, createReviewValidator, validate, createReview);

reviewRouter.use(protect, restrictTo('super_admin', 'manager'));
reviewRouter.put('/:id', mongoIdValidator, validate, updateReview);
reviewRouter.put('/:id/approve', mongoIdValidator, validate, approveReview);
reviewRouter.delete('/:id', mongoIdValidator, validate, deleteReview);

// ─── Contact ──────────────────────────────────────────────────────────────────
const contactRouter = express.Router();

contactRouter.post('/', publicFormLimiter, contactValidator, validate, submitContact);

contactRouter.use(protect);
contactRouter.get('/', getAllContactMessages);
contactRouter.get('/unread-count', getUnreadCount);
contactRouter.put('/:id/read', mongoIdValidator, validate, markContactRead);
contactRouter.put('/:id/replied', mongoIdValidator, validate, markContactReplied);
contactRouter.delete('/:id', restrictTo('super_admin', 'manager'), mongoIdValidator, validate, deleteContactMessage);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboardRouter = express.Router();

dashboardRouter.use(protect, restrictTo('super_admin', 'manager'));
dashboardRouter.get('/stats', getDashboardStats);
dashboardRouter.get('/monthly-revenue', getMonthlyRevenue);
dashboardRouter.get('/popular-services', getPopularServices);
dashboardRouter.get('/booking-analytics', getBookingAnalytics);
dashboardRouter.get('/review-analytics', getReviewAnalytics);
dashboardRouter.get('/active-customers', getActiveCustomers);

module.exports = {
  galleryRouter,
  teamRouter,
  testimonialRouter,
  reviewRouter,
  contactRouter,
  dashboardRouter,
};
