const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required: [customerName, phone, service, bookingDate, bookingTime]
 *       properties:
 *         customerName: { type: string }
 *         phone: { type: string }
 *         email: { type: string, format: email }
 *         service: { type: string, description: ObjectId reference to Service }
 *         bookingDate: { type: string, format: date }
 *         bookingTime: { type: string, example: '10:30 AM' }
 *         status: { type: string, enum: [pending, confirmed, completed, cancelled, no_show] }
 *         paymentStatus: { type: string, enum: [pending, paid, partial, refunded] }
 */
const appointmentSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    bookingTime: {
      type: String,
      required: [true, 'Booking time is required'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded'],
      default: 'pending',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      maxlength: [300, 'Reason cannot exceed 300 characters'],
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['website', 'phone', 'walk_in', 'whatsapp', 'instagram'],
      default: 'website',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
appointmentSchema.index({ bookingDate: 1, bookingTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ phone: 1 });
appointmentSchema.index({ email: 1 });
appointmentSchema.index({ service: 1 });
appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ deletedAt: 1 });

// ─── Virtual: bookingId ───────────────────────────────────────────────────────
appointmentSchema.virtual('bookingId').get(function () {
  return `LBS-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Soft delete query helper
appointmentSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
