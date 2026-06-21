const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
      maxlength: [150, 'Designation cannot exceed 150 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
    },
    specializations: [{ type: String }],
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

teamSchema.index({ isActive: 1 });
teamSchema.index({ sortOrder: 1 });
teamSchema.index({ deletedAt: 1 });

teamSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('Team', teamSchema);
