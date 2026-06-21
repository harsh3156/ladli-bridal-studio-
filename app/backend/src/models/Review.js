const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    review: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    source: {
      type: String,
      enum: ['google', 'facebook', 'instagram', 'website', 'other'],
      default: 'website',
    },
    sourceUrl: {
      type: String,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    approved: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ approved: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ source: 1 });
reviewSchema.index({ deletedAt: 1 });

reviewSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Review', reviewSchema);
