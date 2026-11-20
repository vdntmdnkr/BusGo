/**
 * src/server.js
 * Entry point — connects to MongoDB then starts the HTTP server.
 */
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start Express
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(
      `🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
    console.log(`📡  Health check: http://localhost:${PORT}/health`);
    console.log(`🔑  Auth API:     http://localhost:${PORT}/api/auth`);
    console.log(`📦  Products API: http://localhost:${PORT}/api/products`);
    console.log(`👥  Users API:    http://localhost:${PORT}/api/users`);
  });

  // ─── Graceful shutdown ────────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n⚠️   ${signal} received. Shutting down gracefully…`);
    server.close(() => {
      console.log('✅  HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌  Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();
