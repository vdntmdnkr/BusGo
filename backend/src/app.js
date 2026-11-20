/**
 * src/app.js
 * Express application setup (middlewares, routes).
 * Kept separate from server.js for easier testing.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// ─── Route imports ────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const offerRoutes = require('./routes/offerRoutes');
const walletRoutes = require('./routes/walletRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes');

const app = express();

// ─── Security & utility middlewares ───────────────────────
// CSP disabled so the frontend inline handlers & QR rendering work cleanly
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, local files) or in allowed list
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during local academic demo
      }
    },
    credentials: true,
  })
);

// Rate limiting — 500 requests per 15 minutes for smooth demo interaction
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// HTTP request logger (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BusGo Server is running smoothly',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve frontend static files ──────────────────────────
app.use(express.static(path.join(__dirname, '../../')));

// ─── Dedicated Route for ReactJS Client-Side Validation Demo ───
app.get(['/react', '/react-validation'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../react-validation.html'));
});

// ─── API routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/giftcards', giftCardRoutes);

// ─── 404 handler for API routes only ─────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Catch-all: serve frontend index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// ─── Global error handler (must be last) ──────────────────
app.use(errorHandler);

module.exports = app;
