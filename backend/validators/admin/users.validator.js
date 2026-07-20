const { body, param } = require('express-validator');

const createUserValidator = [
  body('username').notEmpty().withMessage('Username is required').isLength({ max: 50 }).withMessage('Username max length is 50'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('roles').isArray({ min: 1 }).withMessage('At least one role ID is required'),
  body('roles.*').isInt().withMessage('Role ID must be an integer')
];

const updateUserValidator = [
  param('id').isUUID().withMessage('Invalid user ID format'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('roles').optional().isArray(),
  body('roles.*').optional().isInt(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status')
];

const deleteUserValidator = [
  param('id').isUUID().withMessage('Invalid user ID format')
];

const getUserValidator = [
  param('id').isUUID().withMessage('Invalid user ID format')
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  getUserValidator
};
