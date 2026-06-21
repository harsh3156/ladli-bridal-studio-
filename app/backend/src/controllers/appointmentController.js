const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { ApiResponse, buildPagination, buildQueryOptions } = require('../utils/apiResponse');
const { sendAppointmentConfirmation, sendAppointmentReminder } = require('../utils/emailService');
const { sendAppointmentConfirmationWA, sendAdminBookingAlert } = require('../utils/whatsappService');
const logger = require('../utils/logger');

// Helper: emit socket event to admin room
const emitToAdmin = (req, event, data) => {
  const io = req.app.get('io');
  if (io) io.to('admin-room').emit(event, data);
};

/**
 * GET /api/v1/appointments
 */
const getAllAppointments = catchAsync(async (req, res) => {
  const { page, limit, skip, sort } = buildQueryOptions(req.query);
  const filter = { deletedAt: null };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.service) filter.service = req.query.service;
  if (req.query.date) {
    const d = new Date(req.query.date);
    filter.bookingDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
  }
  if (req.query.from && req.query.to) {
    filter.bookingDate = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
  }
  if (req.query.search) {
    filter.$or = [
      { customerName: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('service', 'title category price duration')
      .populate('assignedTo', 'name email')
      .sort(sort).skip(skip).limit(limit),
    Appointment.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, appointments, buildPagination(total, page, limit));
});

/**
 * GET /api/v1/appointments/:id
 */
const getAppointmentById = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, deletedAt: null })
    .populate('service', 'title category price duration')
    .populate('assignedTo', 'name email');
  if (!appointment) return next(new AppError('Appointment not found', 404));
  return ApiResponse.success(res, appointment);
});

/**
 * POST /api/v1/appointments — Public booking
 */
const createAppointment = catchAsync(async (req, res, next) => {
  const { customerName, phone, email, service, bookingDate, bookingTime, notes, source } = req.body;

  // Validate service exists and is active
  const serviceDoc = await Service.findOne({ _id: service, active: true, deletedAt: null });
  if (!serviceDoc) return next(new AppError('Service not found or unavailable', 404));

  // Check slot availability
  const slotTaken = await Appointment.findOne({
    service,
    bookingDate: new Date(bookingDate),
    bookingTime,
    status: { $nin: ['cancelled'] },
    deletedAt: null,
  });
  if (slotTaken) return next(new AppError('This time slot is already booked. Please choose another time.', 409));

  const appointment = await Appointment.create({
    customerName, phone, email, service, bookingDate, bookingTime, notes, source,
  });

  // Increment service booking count
  await Service.findByIdAndUpdate(service, { $inc: { bookingCount: 1 } });

  // Populate for notifications
  const populated = await Appointment.findById(appointment._id).populate('service', 'title price');

  // Send notifications (non-blocking)
  if (email) {
    sendAppointmentConfirmation(populated).catch((e) =>
      logger.error(`Email notification failed: ${e.message}`)
    );
  }
  sendAppointmentConfirmationWA(populated).catch((e) =>
    logger.error(`WhatsApp notification failed: ${e.message}`)
  );

  // Real-time socket alert to admin dashboard
  emitToAdmin(req, 'new-appointment', {
    message: `New booking from ${customerName} for ${serviceDoc.title}`,
    appointment: populated,
  });

  logger.info(`New appointment created: ${appointment._id} — ${customerName}`);
  return ApiResponse.created(res, populated, 'Appointment booked successfully!');
});

/**
 * PUT /api/v1/appointments/:id/status
 */
const updateAppointmentStatus = catchAsync(async (req, res, next) => {
  const { status, cancellationReason, paymentStatus, paymentAmount, assignedTo } = req.body;

  const appointment = await Appointment.findOne({ _id: req.params.id, deletedAt: null });
  if (!appointment) return next(new AppError('Appointment not found', 404));

  const updates = { status };
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (paymentAmount !== undefined) updates.paymentAmount = paymentAmount;
  if (assignedTo) updates.assignedTo = assignedTo;
  if (status === 'confirmed') updates.confirmedAt = new Date();
  if (status === 'cancelled') {
    updates.cancelledAt = new Date();
    updates.cancellationReason = cancellationReason;
  }

  const updated = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('service', 'title price');

  emitToAdmin(req, 'appointment-updated', { appointment: updated });
  logger.info(`Appointment ${req.params.id} status → ${status} by ${req.user.email}`);
  return ApiResponse.success(res, updated, 'Appointment updated successfully');
});

/**
 * PUT /api/v1/appointments/:id/reschedule
 */
const rescheduleAppointment = catchAsync(async (req, res, next) => {
  const { bookingDate, bookingTime } = req.body;

  const appointment = await Appointment.findOne({ _id: req.params.id, deletedAt: null });
  if (!appointment) return next(new AppError('Appointment not found', 404));
  if (appointment.status === 'completed') return next(new AppError('Cannot reschedule a completed appointment', 400));
  if (appointment.status === 'cancelled') return next(new AppError('Cannot reschedule a cancelled appointment', 400));

  // Check new slot availability
  const slotTaken = await Appointment.findOne({
    _id: { $ne: req.params.id },
    service: appointment.service,
    bookingDate: new Date(bookingDate),
    bookingTime,
    status: { $nin: ['cancelled'] },
    deletedAt: null,
  });
  if (slotTaken) return next(new AppError('This time slot is already taken', 409));

  const updated = await Appointment.findByIdAndUpdate(
    req.params.id,
    { bookingDate: new Date(bookingDate), bookingTime, status: 'confirmed' },
    { new: true }
  ).populate('service', 'title price');

  logger.info(`Appointment ${req.params.id} rescheduled to ${bookingDate} ${bookingTime}`);
  return ApiResponse.success(res, updated, 'Appointment rescheduled successfully');
});

/**
 * DELETE /api/v1/appointments/:id — Soft delete
 */
const deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!appointment) return next(new AppError('Appointment not found', 404));
  logger.info(`Appointment soft-deleted: ${req.params.id}`);
  return ApiResponse.success(res, null, 'Appointment deleted');
});

/**
 * GET /api/v1/appointments/availability — Check available slots
 */
const checkAvailability = catchAsync(async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date) return ApiResponse.error(res, 'Date is required', 400);

  const d = new Date(date);
  const booked = await Appointment.find({
    bookingDate: { $gte: d, $lt: new Date(d.getTime() + 86400000) },
    ...(serviceId && { service: serviceId }),
    status: { $nin: ['cancelled'] },
    deletedAt: null,
  }).select('bookingTime');

  const bookedTimes = booked.map((a) => a.bookingTime);

  const allSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM',
  ];

  const slots = allSlots.map((time) => ({
    time,
    available: !bookedTimes.includes(time),
  }));

  return ApiResponse.success(res, { date, slots });
});

/**
 * GET /api/v1/appointments/today — Today's appointments
 */
const getTodayAppointments = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const appointments = await Appointment.find({
    bookingDate: { $gte: today, $lt: tomorrow },
    status: { $nin: ['cancelled'] },
    deletedAt: null,
  }).populate('service', 'title duration').sort({ bookingTime: 1 });

  return ApiResponse.success(res, appointments, "Today's appointments");
});

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  deleteAppointment,
  checkAvailability,
  getTodayAppointments,
};
