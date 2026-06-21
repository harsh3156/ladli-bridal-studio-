require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const connectDB = require('./src/config/database');
const { initSocket } = require('./src/sockets/socketHandler');
const { initJobs } = require('./src/jobs/appointmentJobs');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Create HTTP Server ───────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible in controllers via app
app.set('io', io);

// ─── Boot Sequence ────────────────────────────────────────────────────────────
const start = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Socket.io handlers
    initSocket(io);

    // 3. Start cron jobs
    initJobs();

    // 4. Start HTTP server
    server.listen(PORT, () => {
      logger.info('═'.repeat(55));
      logger.info(`🌸  LADLI BRIDAL STUDIO — BACKEND SERVER`);
      logger.info('═'.repeat(55));
      logger.info(`   Environment : ${NODE_ENV}`);
      logger.info(`   Port        : ${PORT}`);
      logger.info(`   API Base    : http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
      logger.info(`   API Docs    : http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}/docs`);
      logger.info(`   Health      : http://localhost:${PORT}/health`);
      logger.info('═'.repeat(55));
    });

  } catch (err) {
    logger.error(`Server startup failed: ${err.message}`);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Errors ────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`UNHANDLED REJECTION: ${reason}`);
  server.close(() => process.exit(1));
});

start();
