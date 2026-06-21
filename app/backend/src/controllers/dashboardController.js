const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Testimonial = require('../models/Testimonial');
const ContactMessage = require('../models/ContactMessage');
const { catchAsync } = require('../middleware/errorHandler');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * GET /api/v1/dashboard/stats — Overall KPIs
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const [
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    todayAppointments,
    thisMonthAppointments,
    lastMonthAppointments,
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    activeServices,
    unreadMessages,
    pendingTestimonials,
    pendingReviews,
  ] = await Promise.all([
    Appointment.countDocuments({ deletedAt: null }),
    Appointment.countDocuments({ status: 'pending', deletedAt: null }),
    Appointment.countDocuments({ status: 'confirmed', deletedAt: null }),
    Appointment.countDocuments({ status: 'completed', deletedAt: null }),
    Appointment.countDocuments({ status: 'cancelled', deletedAt: null }),
    Appointment.countDocuments({ bookingDate: { $gte: today, $lt: tomorrow }, deletedAt: null }),
    Appointment.countDocuments({ createdAt: { $gte: startOfMonth }, deletedAt: null }),
    Appointment.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, deletedAt: null }),
    Appointment.aggregate([
      { $match: { paymentStatus: 'paid', deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } },
    ]),
    Appointment.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth }, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } },
    ]),
    Appointment.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } },
    ]),
    Service.countDocuments({ active: true, deletedAt: null }),
    ContactMessage.countDocuments({ isRead: false, deletedAt: null }),
    Testimonial.countDocuments({ approved: false, deletedAt: null }),
    Review.countDocuments({ approved: false, deletedAt: null }),
  ]);

  const thisMonthRev = thisMonthRevenue[0]?.total || 0;
  const lastMonthRev = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth = lastMonthRev === 0
    ? 100
    : (((thisMonthRev - lastMonthRev) / lastMonthRev) * 100).toFixed(1);

  const bookingGrowth = lastMonthAppointments === 0
    ? 100
    : (((thisMonthAppointments - lastMonthAppointments) / lastMonthAppointments) * 100).toFixed(1);

  return ApiResponse.success(res, {
    appointments: {
      total: totalAppointments,
      pending: pendingAppointments,
      confirmed: confirmedAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      today: todayAppointments,
      thisMonth: thisMonthAppointments,
      lastMonth: lastMonthAppointments,
      bookingGrowth: Number(bookingGrowth),
    },
    revenue: {
      total: totalRevenue[0]?.total || 0,
      thisMonth: thisMonthRev,
      lastMonth: lastMonthRev,
      growth: Number(revenueGrowth),
    },
    services: { active: activeServices },
    notifications: {
      unreadMessages,
      pendingTestimonials,
      pendingReviews,
    },
  }, 'Dashboard stats fetched');
});

/**
 * GET /api/v1/dashboard/monthly-revenue — Last 12 months revenue chart
 */
const getMonthlyRevenue = catchAsync(async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const data = await Appointment.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: startDate },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$paymentAmount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatted = data.map((d) => ({
    month: `${monthNames[d._id.month - 1]} ${d._id.year}`,
    revenue: d.revenue,
    bookings: d.bookings,
  }));

  return ApiResponse.success(res, formatted, 'Monthly revenue fetched');
});

/**
 * GET /api/v1/dashboard/popular-services — Top booked services
 */
const getPopularServices = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const data = await Appointment.aggregate([
    { $match: { deletedAt: null, status: { $nin: ['cancelled'] } } },
    { $group: { _id: '$service', count: { $sum: 1 }, revenue: { $sum: '$paymentAmount' } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'service',
      },
    },
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: '$service._id',
        title: '$service.title',
        category: '$service.category',
        price: '$service.price',
        bookingCount: '$count',
        totalRevenue: '$revenue',
      },
    },
  ]);

  return ApiResponse.success(res, data, 'Popular services fetched');
});

/**
 * GET /api/v1/dashboard/booking-analytics — Bookings by status, day, source
 */
const getBookingAnalytics = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [byStatus, byDay, bySource, byCategory] = await Promise.all([
    // By status
    Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // By day (last N days)
    Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // By source
    Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),

    // By service category
    Appointment.aggregate([
      { $match: { deletedAt: null, status: { $nin: ['cancelled'] } } },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData',
        },
      },
      { $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$serviceData.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return ApiResponse.success(res, {
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    byDay: byDay.map((d) => ({ date: d._id, count: d.count })),
    bySource: bySource.map((s) => ({ source: s._id || 'website', count: s.count })),
    byCategory: byCategory.map((c) => ({ category: c._id || 'Other', count: c.count })),
  }, 'Booking analytics fetched');
});

/**
 * GET /api/v1/dashboard/review-analytics
 */
const getReviewAnalytics = catchAsync(async (req, res) => {
  const [reviewStats, testimonialStats, ratingDistribution] = await Promise.all([
    Review.aggregate([
      { $match: { approved: true, deletedAt: null } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          total: { $sum: 1 },
        },
      },
    ]),
    Testimonial.aggregate([
      { $match: { approved: true, deletedAt: null } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          total: { $sum: 1 },
        },
      },
    ]),
    Review.aggregate([
      { $match: { approved: true, deletedAt: null } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
  ]);

  return ApiResponse.success(res, {
    reviews: {
      avgRating: reviewStats[0]?.avgRating?.toFixed(1) || 0,
      total: reviewStats[0]?.total || 0,
    },
    testimonials: {
      avgRating: testimonialStats[0]?.avgRating?.toFixed(1) || 0,
      total: testimonialStats[0]?.total || 0,
    },
    ratingDistribution: ratingDistribution.map((r) => ({
      rating: r._id,
      count: r.count,
    })),
  }, 'Review analytics fetched');
});

/**
 * GET /api/v1/dashboard/active-customers
 */
const getActiveCustomers = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const data = await Appointment.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $nin: ['cancelled'] }, deletedAt: null } },
    {
      $group: {
        _id: '$phone',
        customerName: { $last: '$customerName' },
        email: { $last: '$email' },
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: '$paymentAmount' },
        lastBooking: { $max: '$bookingDate' },
      },
    },
    { $sort: { totalBookings: -1 } },
    { $limit: 20 },
  ]);

  return ApiResponse.success(res, {
    totalActiveCustomers: data.length,
    customers: data,
  }, 'Active customers fetched');
});

module.exports = {
  getDashboardStats,
  getMonthlyRevenue,
  getPopularServices,
  getBookingAnalytics,
  getReviewAnalytics,
  getActiveCustomers,
};
