const { body, param, query } = require('express-validator');

// ─── Auth ─────────────────────────────────────────────────────────────────────
const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('role').optional().isIn(['super_admin', 'manager', 'staff']).withMessage('Invalid role'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

const resetPasswordValidator = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
];

// ─── Appointments ─────────────────────────────────────────────────────────────
const createAppointmentValidator = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 100 }),
  body('phone')
    .trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid 10-digit Indian mobile number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('service').notEmpty().withMessage('Service is required').isMongoId().withMessage('Invalid service ID'),
  body('bookingDate')
    .notEmpty().withMessage('Booking date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('Booking date cannot be in the past');
      }
      return true;
    }),
  body('bookingTime').trim().notEmpty().withMessage('Booking time is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const updateAppointmentStatusValidator = [
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .withMessage('Invalid status'),
  body('cancellationReason').if(body('status').equals('cancelled'))
    .notEmpty().withMessage('Cancellation reason is required when cancelling'),
];

// ─── Services ─────────────────────────────────────────────────────────────────
const createServiceValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('category').isIn(['Bridal', 'Makeup', 'Hair', 'Skin', 'Mehndi', 'Other'])
    .withMessage('Invalid category'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }),
  body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  body('description').optional().isLength({ max: 1000 }),
];

// ─── Gallery ──────────────────────────────────────────────────────────────────
const createGalleryValidator = [
  body('category').optional().isIn(['Bridal', 'Makeup', 'Hair', 'Skin', 'Mehndi', 'Other']),
  body('title').optional().isLength({ max: 200 }),
  body('beforeAfter').optional().isBoolean(),
];

// ─── Team ─────────────────────────────────────────────────────────────────────
const createTeamValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('designation').trim().notEmpty().withMessage('Designation is required').isLength({ max: 150 }),
  body('bio').optional().isLength({ max: 1000 }),
  body('experience').optional().isInt({ min: 0 }),
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const createTestimonialValidator = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 100 }),
  body('review').trim().notEmpty().withMessage('Review text is required').isLength({ max: 1000 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

// ─── Reviews ──────────────────────────────────────────────────────────────────
const createReviewValidator = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 100 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').trim().notEmpty().withMessage('Review text is required').isLength({ max: 2000 }),
  body('source').optional().isIn(['google', 'facebook', 'instagram', 'website', 'other']),
];

// ─── Contact ──────────────────────────────────────────────────────────────────
const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian mobile number'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
];

// ─── Common ───────────────────────────────────────────────────────────────────
const mongoIdValidator = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  createAppointmentValidator,
  updateAppointmentStatusValidator,
  createServiceValidator,
  createGalleryValidator,
  createTeamValidator,
  createTestimonialValidator,
  createReviewValidator,
  contactValidator,
  mongoIdValidator,
  paginationValidator,
};
