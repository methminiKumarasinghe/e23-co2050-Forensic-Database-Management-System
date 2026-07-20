const { body } = require('express-validator');

const createNotificationValidator = [
  body('message').notEmpty().withMessage('Message is required').isString(),
  body('notification_type').optional().isString().isLength({ max: 50 }),
  // At least one target is required: user_id, role_id, or all_users
  body('user_id').optional().isUUID(),
  body('role_id').optional().isInt(),
  body('all_users').optional().isBoolean()
];

module.exports = { createNotificationValidator };
