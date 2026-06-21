const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
};

// Branded HTML wrapper
const htmlWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ladli Bridal Studio</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0A0A0A;padding:40px;text-align:center;border-bottom:2px solid #C9A84C;">
            <h1 style="color:#C9A84C;font-family:'Georgia',serif;font-size:28px;letter-spacing:4px;margin:0;font-weight:400;">LADLI</h1>
            <p style="color:#A09080;font-size:11px;letter-spacing:6px;margin:8px 0 0;text-transform:uppercase;">Bridal Studio</p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:48px 40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0A0A0A;padding:30px 40px;text-align:center;">
            <p style="color:#A09080;font-size:12px;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase;">Ladli Bridal Studio</p>
            <p style="color:#555;font-size:11px;margin:0;">© ${new Date().getFullYear()} All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
      text: text || subject,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending failed to ${to}: ${error.message}`);
    throw error;
  }
};

// ─── Email Templates ─────────────────────────────────────────────────────────

/**
 * Appointment confirmation email
 */
const sendAppointmentConfirmation = async (appointment) => {
  const { customerName, email, service, bookingDate, bookingTime, _id } = appointment;
  const dateStr = new Date(bookingDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const content = `
    <h2 style="color:#0A0A0A;font-size:22px;font-weight:400;margin:0 0 8px;">Booking Confirmed ✨</h2>
    <p style="color:#C9A84C;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 32px;">Your appointment is scheduled</p>
    <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 24px;">Dear <strong>${customerName}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px;">
      We are thrilled to confirm your appointment at Ladli Bridal Studio. We look forward to making you look absolutely stunning!
    </p>
    <table width="100%" style="background:#f9f5f0;border-left:3px solid #C9A84C;padding:24px;margin-bottom:32px;" cellpadding="0" cellspacing="0">
      <tr><td>
        <p style="margin:0 0 12px;color:#555;font-size:14px;"><strong style="color:#0A0A0A;">Service:</strong> ${service?.title || service}</p>
        <p style="margin:0 0 12px;color:#555;font-size:14px;"><strong style="color:#0A0A0A;">Date:</strong> ${dateStr}</p>
        <p style="margin:0 0 12px;color:#555;font-size:14px;"><strong style="color:#0A0A0A;">Time:</strong> ${bookingTime}</p>
        <p style="margin:0;color:#555;font-size:14px;"><strong style="color:#0A0A0A;">Booking ID:</strong> #${_id.toString().slice(-8).toUpperCase()}</p>
      </td></tr>
    </table>
    <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 16px;">
      <strong>Please arrive 10 minutes early.</strong> If you need to reschedule or cancel, please contact us at least 24 hours in advance.
    </p>
    <p style="color:#888;font-size:13px;line-height:1.7;margin:0;">
      Questions? Reply to this email or WhatsApp us.
    </p>`;

  await sendEmail({
    to: email,
    subject: `✨ Appointment Confirmed — Ladli Bridal Studio`,
    html: htmlWrapper(content),
  });
};

/**
 * Appointment reminder email (24h before)
 */
const sendAppointmentReminder = async (appointment) => {
  const { customerName, email, service, bookingDate, bookingTime } = appointment;
  const dateStr = new Date(bookingDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const content = `
    <h2 style="color:#0A0A0A;font-size:22px;font-weight:400;margin:0 0 8px;">Appointment Reminder 🌸</h2>
    <p style="color:#C9A84C;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 32px;">Tomorrow is your day!</p>
    <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 24px;">Dear <strong>${customerName}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px;">
      This is a friendly reminder about your appointment tomorrow at Ladli Bridal Studio.
    </p>
    <table width="100%" style="background:#f9f5f0;border-left:3px solid #C9A84C;padding:24px;margin-bottom:32px;" cellpadding="0" cellspacing="0">
      <tr><td>
        <p style="margin:0 0 12px;color:#555;font-size:14px;"><strong style="color:#0A0A0A;">Service:</strong> ${service?.title || service}</p>
        <p style="margin:0 0 12px;color:#555;font-size:14px;"><strong style="color:#0A0A0A;">Date:</strong> ${dateStr}</p>
        <p style="margin:0;color:#555;font-size:14px;"><strong style="color:#0A0A0A;">Time:</strong> ${bookingTime}</p>
      </td></tr>
    </table>
    <p style="color:#555;font-size:14px;line-height:1.7;">Please arrive 10 minutes early. We can't wait to see you! 💄</p>`;

  await sendEmail({
    to: email,
    subject: `🌸 Reminder: Your Appointment Tomorrow — Ladli Bridal Studio`,
    html: htmlWrapper(content),
  });
};

/**
 * Password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.ADMIN_URL}/reset-password?token=${resetToken}`;
  const content = `
    <h2 style="color:#0A0A0A;font-size:22px;font-weight:400;margin:0 0 8px;">Password Reset</h2>
    <p style="color:#C9A84C;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 32px;">Secure your account</p>
    <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 24px;">Dear <strong>${user.name}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px;">
      You requested a password reset. Click the button below to reset your password. This link is valid for <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:40px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#C9A84C;color:#0A0A0A;text-decoration:none;padding:16px 40px;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">
        Reset Password
      </a>
    </div>
    <p style="color:#888;font-size:13px;line-height:1.7;margin:0;">
      If you didn't request this, please ignore this email. Your password will remain unchanged.
    </p>`;

  await sendEmail({
    to: user.email,
    subject: `Password Reset — Ladli Bridal Studio`,
    html: htmlWrapper(content),
  });
};

/**
 * Contact message acknowledgment
 */
const sendContactAcknowledgment = async (contact) => {
  const content = `
    <h2 style="color:#0A0A0A;font-size:22px;font-weight:400;margin:0 0 8px;">Thank You for Reaching Out!</h2>
    <p style="color:#C9A84C;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 32px;">We've received your message</p>
    <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 24px;">Dear <strong>${contact.name}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px;">
      Thank you for contacting Ladli Bridal Studio. We have received your message and will get back to you within 24 hours.
    </p>
    <p style="color:#888;font-size:13px;line-height:1.7;margin:0;">With love, Team Ladli 💖</p>`;

  await sendEmail({
    to: contact.email,
    subject: `Thank you for contacting Ladli Bridal Studio`,
    html: htmlWrapper(content),
  });
};

module.exports = {
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendPasswordResetEmail,
  sendContactAcknowledgment,
};
