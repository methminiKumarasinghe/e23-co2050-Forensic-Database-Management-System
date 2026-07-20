const { query } = require('express-validator');

const auditLogsFilterValidator = [
  query('user_id').optional().isUUID().withMessage('Invalid User ID format'),
  query('action').optional().isString(),
  query('date').optional().isDate().withMessage('Invalid date format (YYYY-MM-DD)'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater')
];

module.exports = { auditLogsFilterValidator };
