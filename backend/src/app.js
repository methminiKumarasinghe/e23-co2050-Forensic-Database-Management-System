require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { httpLogger } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Route modules
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const labRoutes = require('./routes/lab.routes');
const jmoRoutes = require('./routes/jmo.routes');
const policeRoutes = require('./routes/police.routes');
const medicalRoutes = require('./routes/medical.routes');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(httpLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FMIS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/jmo', jmoRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/medical', medicalRoutes);

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
