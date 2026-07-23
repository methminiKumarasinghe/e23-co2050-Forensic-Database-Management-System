const morgan = require('morgan');

/**
 * Morgan HTTP request logger.
 * - 'dev' format in development (coloured, concise)
 * - 'combined' format in production (Apache-style, full)
 */
const httpLogger = morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev');

/**
 * Simple structured console logger for application events.
 */
const logger = {
  info:  (...args) => console.log('[INFO ]', new Date().toISOString(), ...args),
  warn:  (...args) => console.warn('[WARN ]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', new Date().toISOString(), ...args);
    }
  },
};

module.exports = { httpLogger, logger };
