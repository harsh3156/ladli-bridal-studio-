const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       required: [title, category, price, duration]
 *       properties:
 *         title: { type: string }
 *         description: { type: string }
 *         category: { type: string, enum: [Bridal, Makeup, Hair, Skin, Mehndi, Other] }
 *         price: { type: number }
 *         duration: { type: number, description: Duration in minutes }
 *         image: { type: string, format: uri }
 *         active: { type: boolean }
 */
const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Bridal', 'Makeup', 'Hair', 'Skin', 'Mehndi', 'Other'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
      comment: 'Duration in minutes',
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    active: {
      type: Boolean,
      default: true,
    },
    features: [{ type: String }],
    sortOrder: {
      type: Number,
      default: 0,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
serviceSchema.index({ category: 1 });
serviceSchema.index({ active: 1 });
serviceSchema.index({ sortOrder: 1 });
serviceSchema.index({ title: 'text', description: 'text' });
serviceSchema.index({ deletedAt: 1 });

// ─── Virtual: durationFormatted ───────────────────────────────────────────────
serviceSchema.virtual('durationFormatted').get(function () {
  const h = Math.floor(this.duration / 60);
  const m = this.duration % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
});

serviceSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Service', serviceSchema);
