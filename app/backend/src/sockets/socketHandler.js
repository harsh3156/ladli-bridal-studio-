const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const initSocket = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role, email } = socket.user;
    logger.info(`Socket connected: ${email} (${role}) — ${socket.id}`);

    // Admins join the admin room for broadcasts
    if (['super_admin', 'manager', 'staff'].includes(role)) {
      socket.join('admin-room');
      logger.info(`${email} joined admin-room`);
    }

    // Join personal room for direct messages
    socket.join(`user:${userId}`);

    // ── Events ────────────────────────────────────────────────────────────────

    // Admin acknowledges a notification
    socket.on('notification:acknowledge', (data) => {
      logger.info(`Notification acknowledged by ${email}: ${JSON.stringify(data)}`);
    });

    // Admin joins a specific appointment room (e.g., for live updates)
    socket.on('appointment:watch', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
    });

    socket.on('appointment:unwatch', (appointmentId) => {
      socket.leave(`appointment:${appointmentId}`);
    });

    // Ping/pong heartbeat
    socket.on('ping', () => socket.emit('pong', { time: new Date().toISOString() }));

    // Disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${email} — reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (err) => {
      logger.error(`Socket error for ${email}: ${err.message}`);
    });

    // Send welcome event to newly connected admin
    socket.emit('connected', {
      message: `Welcome back, ${email}!`,
      room: 'admin-room',
      time: new Date().toISOString(),
    });
  });

  logger.info('✅ Socket.io initialized');
};

module.exports = { initSocket };
