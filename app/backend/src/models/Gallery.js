const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: ['Bridal', 'Makeup', 'Hair', 'Skin', 'Mehndi', 'Other'],
      default: 'Other',
    },
    beforeAfter: {
      type: Boolean,
      default: false,
      comment: 'true = after photo; pair it with another image',
    },
    pairedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery',
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

gallerySchema.index({ category: 1 });
gallerySchema.index({ featured: 1 });
gallerySchema.index({ deletedAt: 1 });

gallerySchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Gallery', gallerySchema);
