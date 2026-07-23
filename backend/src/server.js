require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify database connection before accepting traffic
    await testConnection();

    app.listen(PORT, () => {
      logger.info(`🚀 FMIS Backend running on http://localhost:${PORT}`);
      logger.info(`   Environment : ${process.env.NODE_ENV}`);
      logger.info(`   Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

start();
