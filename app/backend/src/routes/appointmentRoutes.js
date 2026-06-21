const express = require('express');
const router = express.Router();
const {
  getAllAppointments, getAppointmentById, createAppointment,
  updateAppointmentStatus, rescheduleAppointment, deleteAppointment,
  checkAvailability, getTodayAppointments,
} = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { publicFormLimiter } = require('../middleware/rateLimiter');
const {
  createAppointmentValidator, updateAppointmentStatusValidator, mongoIdValidator,
} = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Booking & appointment management
 */

// Public routes
router.get('/availability', checkAvailability);
router.post('/', publicFormLimiter, createAppointmentValidator, validate, createAppointment);

// Protected admin routes
router.use(protect);
router.get('/', getAllAppointments);
router.get('/today', getTodayAppointments);
router.get('/:id', mongoIdValidator, validate, getAppointmentById);
router.put('/:id/status', mongoIdValidator, updateAppointmentStatusValidator, validate, updateAppointmentStatus);
router.put('/:id/reschedule', mongoIdValidator, validate, rescheduleAppointment);
router.delete('/:id', restrictTo('super_admin', 'manager'), mongoIdValidator, validate, deleteAppointment);

module.exports = router;
