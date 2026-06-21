const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminder } = require('../utils/emailService');
const { sendAppointmentReminderWA } = require('../utils/whatsappService');
const logger = require('../utils/logger');

/**
 * Send appointment reminders for tomorrow's bookings
 * Runs every day at 10:00 AM
 */
const scheduleReminders = () => {
  cron.schedule('0 10 * * *', async () => {
    logger.info('⏰ Running appointment reminder job...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow.getTime() + 86400000);

      const appointments = await Appointment.find({
        bookingDate: { $gte: tomorrow, $lt: dayAfter },
        status: { $in: ['pending', 'confirmed'] },
        reminderSent: false,
        deletedAt: null,
      }).populate('service', 'title');

      logger.info(`Found ${appointments.length} appointments to remind`);

      for (const appt of appointments) {
        try {
          // Email reminder
          if (appt.email) {
            await sendAppointmentReminder(appt);
          }
          // WhatsApp reminder
          await sendAppointmentReminderWA(appt);

          // Mark reminder as sent
          await Appointment.findByIdAndUpdate(appt._id, { reminderSent: true });
          logger.info(`Reminder sent for appointment: ${appt._id} — ${appt.customerName}`);
        } catch (err) {
          logger.error(`Failed to send reminder for ${appt._id}: ${err.message}`);
        }
      }

      logger.info('✅ Appointment reminder job completed');
    } catch (err) {
      logger.error(`Reminder job failed: ${err.message}`);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('✅ Appointment reminder cron scheduled (daily 10:00 AM IST)');
};

/**
 * Mark no-show appointments (bookings that passed without being confirmed as completed)
 * Runs every day at midnight
 */
const scheduleNoShowMarker = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('⏰ Running no-show marker job...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday.getTime() + 86400000 - 1);

      const result = await Appointment.updateMany(
        {
          bookingDate: { $gte: yesterday, $lte: endOfYesterday },
          status: { $in: ['pending', 'confirmed'] },
          deletedAt: null,
        },
        { $set: { status: 'no_show' } }
      );

      logger.info(`✅ Marked ${result.modifiedCount} appointments as no-show`);
    } catch (err) {
      logger.error(`No-show marker job failed: ${err.message}`);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('✅ No-show marker cron scheduled (daily midnight IST)');
};

/**
 * Initialize all cron jobs
 */
const initJobs = () => {
  if (process.env.NODE_ENV === 'test') return;
  scheduleReminders();
  scheduleNoShowMarker();
  logger.info('✅ All cron jobs initialized');
};

module.exports = { initJobs };
