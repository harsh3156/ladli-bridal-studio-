const Team = require('../models/Team');
const Testimonial = require('../models/Testimonial');
const Review = require('../models/Review');
const ContactMessage = require('../models/ContactMessage');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { ApiResponse, buildPagination, buildQueryOptions } = require('../utils/apiResponse');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { sendContactAcknowledgment } = require('../utils/emailService');
const logger = require('../utils/logger');

// ─── TEAM ─────────────────────────────────────────────────────────────────────

const getAllTeam = catchAsync(async (req, res) => {
  const filter = { deletedAt: null };
  if (!req.user) filter.isActive = true; // Public: active only
  const team = await Team.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  return ApiResponse.success(res, team);
});

const getTeamById = catchAsync(async (req, res, next) => {
  const member = await Team.findOne({ _id: req.params.id, deletedAt: null });
  if (!member) return next(new AppError('Team member not found', 404));
  return ApiResponse.success(res, member);
});

const createTeamMember = catchAsync(async (req, res) => {
  const { name, designation, bio, experience, specializations, sortOrder } = req.body;
  const image = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;

  const member = await Team.create({ name, designation, bio, experience, specializations, sortOrder, image });
  logger.info(`Team member created: ${name}`);
  return ApiResponse.created(res, member, 'Team member added');
});

const updateTeamMember = catchAsync(async (req, res, next) => {
  const member = await Team.findOne({ _id: req.params.id, deletedAt: null });
  if (!member) return next(new AppError('Team member not found', 404));

  const updates = { ...req.body };
  if (req.file) {
    if (member.image?.publicId) {
      await deleteFromCloudinary(member.image.publicId).catch(() => {});
    }
    updates.image = { url: req.file.path, publicId: req.file.filename };
  }

  const updated = await Team.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  return ApiResponse.success(res, updated, 'Team member updated');
});

const deleteTeamMember = catchAsync(async (req, res, next) => {
  const member = await Team.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!member) return next(new AppError('Team member not found', 404));
  return ApiResponse.success(res, null, 'Team member deleted');
});

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

const getAllTestimonials = catchAsync(async (req, res) => {
  const { page, limit, skip, sort } = buildQueryOptions(req.query);
  const filter = { deletedAt: null };

  if (!req.user) filter.approved = true; // Public: approved only
  if (req.query.approved !== undefined) filter.approved = req.query.approved === 'true';
  if (req.query.featured === 'true') filter.featured = true;

  const [testimonials, total] = await Promise.all([
    Testimonial.find(filter).sort(sort).skip(skip).limit(limit),
    Testimonial.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, testimonials, buildPagination(total, page, limit));
});

const createTestimonial = catchAsync(async (req, res) => {
  const { customerName, review, rating, service } = req.body;
  const image = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;
  const testimonial = await Testimonial.create({ customerName, review, rating, service, image });
  return ApiResponse.created(res, testimonial, 'Testimonial submitted. Pending approval.');
});

const updateTestimonial = catchAsync(async (req, res, next) => {
  const t = await Testimonial.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    req.body,
    { new: true, runValidators: true }
  );
  if (!t) return next(new AppError('Testimonial not found', 404));
  return ApiResponse.success(res, t, 'Testimonial updated');
});

const approveTestimonial = catchAsync(async (req, res, next) => {
  const t = await Testimonial.findOne({ _id: req.params.id, deletedAt: null });
  if (!t) return next(new AppError('Testimonial not found', 404));
  t.approved = !t.approved;
  await t.save();
  return ApiResponse.success(res, t, `Testimonial ${t.approved ? 'approved' : 'unapproved'}`);
});

const deleteTestimonial = catchAsync(async (req, res, next) => {
  const t = await Testimonial.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );
  if (!t) return next(new AppError('Testimonial not found', 404));
  return ApiResponse.success(res, null, 'Testimonial deleted');
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

const getAllReviews = catchAsync(async (req, res) => {
  const { page, limit, skip, sort } = buildQueryOptions(req.query);
  const filter = { deletedAt: null };
  if (!req.user) filter.approved = true;
  if (req.query.source) filter.source = req.query.source;

  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('service', 'title').sort(sort).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, reviews, buildPagination(total, page, limit));
});

const createReview = catchAsync(async (req, res) => {
  const review = await Review.create(req.body);
  return ApiResponse.created(res, review, 'Review submitted');
});

const updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    req.body,
    { new: true, runValidators: true }
  );
  if (!review) return next(new AppError('Review not found', 404));
  return ApiResponse.success(res, review, 'Review updated');
});

const approveReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id, deletedAt: null });
  if (!review) return next(new AppError('Review not found', 404));
  review.approved = !review.approved;
  await review.save();
  return ApiResponse.success(res, review, `Review ${review.approved ? 'approved' : 'unapproved'}`);
});

const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() }
  );
  if (!review) return next(new AppError('Review not found', 404));
  return ApiResponse.success(res, null, 'Review deleted');
});

// ─── CONTACT ──────────────────────────────────────────────────────────────────

const getAllContactMessages = catchAsync(async (req, res) => {
  const { page, limit, skip, sort } = buildQueryOptions(req.query);
  const filter = { deletedAt: null };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
  if (req.query.isReplied !== undefined) filter.isReplied = req.query.isReplied === 'true';

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).populate('repliedBy', 'name').sort(sort).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, messages, buildPagination(total, page, limit));
});

const getUnreadCount = catchAsync(async (req, res) => {
  const count = await ContactMessage.countDocuments({ isRead: false, deletedAt: null });
  return ApiResponse.success(res, { unreadCount: count });
});

const submitContact = catchAsync(async (req, res) => {
  const { name, email, phone, message } = req.body;
  const contact = await ContactMessage.create({ name, email, phone, message });

  sendContactAcknowledgment(contact).catch((e) =>
    logger.error(`Contact ack email failed: ${e.message}`)
  );

  // Alert admin via socket
  const io = req.app.get('io');
  if (io) io.to('admin-room').emit('new-contact', { message: `New message from ${name}`, contact });

  return ApiResponse.created(res, null, 'Message sent successfully. We\'ll get back to you soon!');
});

const markContactRead = catchAsync(async (req, res, next) => {
  const msg = await ContactMessage.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { isRead: true },
    { new: true }
  );
  if (!msg) return next(new AppError('Message not found', 404));
  return ApiResponse.success(res, msg, 'Marked as read');
});

const markContactReplied = catchAsync(async (req, res, next) => {
  const msg = await ContactMessage.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { isReplied: true, repliedAt: new Date(), repliedBy: req.user._id, isRead: true },
    { new: true }
  );
  if (!msg) return next(new AppError('Message not found', 404));
  return ApiResponse.success(res, msg, 'Marked as replied');
});

const deleteContactMessage = catchAsync(async (req, res, next) => {
  const msg = await ContactMessage.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { deletedAt: new Date() }
  );
  if (!msg) return next(new AppError('Message not found', 404));
  return ApiResponse.success(res, null, 'Message deleted');
});

module.exports = {
  // Team
  getAllTeam, getTeamById, createTeamMember, updateTeamMember, deleteTeamMember,
  // Testimonials
  getAllTestimonials, createTestimonial, updateTestimonial, approveTestimonial, deleteTestimonial,
  // Reviews
  getAllReviews, createReview, updateReview, approveReview, deleteReview,
  // Contact
  getAllContactMessages, getUnreadCount, submitContact, markContactRead, markContactReplied, deleteContactMessage,
};
