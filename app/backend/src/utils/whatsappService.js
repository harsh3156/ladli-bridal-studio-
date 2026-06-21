const twilio = require('twilio');
const logger = require('./logger');

let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('Twilio credentials not configured. WhatsApp notifications disabled.');
      return null;
    }
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Format phone number for WhatsApp
 */
const formatWhatsAppNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const withCountry = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  return `whatsapp:+${withCountry}`;
};

/**
 * Send a WhatsApp message
 */
const sendWhatsApp = async (to, message) => {
  const twilioClient = getClient();
  if (!twilioClient) return null;

  try {
    const msg = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formatWhatsAppNumber(to),
    });
    logger.info(`WhatsApp sent to ${to}: ${msg.sid}`);
    return msg;
  } catch (error) {
    logger.error(`WhatsApp sending failed to ${to}: ${error.message}`);
    // Don't throw — WhatsApp failure shouldn't break the main flow
    return null;
  }
};

/**
 * Appointment confirmation WhatsApp
 */
const sendAppointmentConfirmationWA = async (appointment) => {
  const { customerName, phone, service, bookingDate, bookingTime, _id } = appointment;
  const dateStr = new Date(bookingDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const message = `💄 *Ladli Bridal Studio*
✨ *Booking Confirmed!*

Hello *${customerName}*! Your appointment has been confirmed.

📋 *Details:*
🌸 Service: ${service?.title || service}
📅 Date: ${dateStr}
⏰ Time: ${bookingTime}
🆔 Booking ID: #${_id.toString().slice(-8).toUpperCase()}

📍 Please arrive 10 minutes early.
❌ To cancel/reschedule, contact us 24hrs in advance.

Thank you for choosing Ladli! 🌹`;

  return sendWhatsApp(phone, message);
};

/**
 * Appointment reminder WhatsApp
 */
const sendAppointmentReminderWA = async (appointment) => {
  const { customerName, phone, service, bookingTime } = appointment;

  const message = `🌸 *Ladli Bridal Studio — Reminder*

Hi *${customerName}*! Your appointment is *tomorrow* 🗓️

⏰ Time: *${bookingTime}*
💄 Service: ${service?.title || service}

We can't wait to see you! ✨
_Please arrive 10 minutes early._

Questions? Reply to this message.`;

  return sendWhatsApp(phone, message);
};

/**
 * Admin new booking alert
 */
const sendAdminBookingAlert = async (appointment, adminPhone) => {
  if (!adminPhone) return null;
  const { customerName, phone, service, bookingDate, bookingTime } = appointment;
  const dateStr = new Date(bookingDate).toLocaleDateString('en-IN');

  const message = `🔔 *New Booking Alert — Ladli*

👤 Customer: ${customerName}
📱 Phone: ${phone}
🌸 Service: ${service?.title || service}
📅 Date: ${dateStr}
⏰ Time: ${bookingTime}

Login to dashboard to manage booking.`;

  return sendWhatsApp(adminPhone, message);
};

module.exports = {
  sendWhatsApp,
  sendAppointmentConfirmationWA,
  sendAppointmentReminderWA,
  sendAdminBookingAlert,
};
