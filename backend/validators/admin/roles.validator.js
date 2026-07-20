const { body, param } = require('express-validator');

const createRoleValidator = [
  body('role_name').notEmpty().withMessage('Role name is required').isLength({ max: 50 }).withMessage('Role name max length is 50'),
  body('description').optional().isString()
];

const updateRoleValidator = [
  param('id').isInt().withMessage('Invalid role ID format'),
  body('role_name').optional().notEmpty().withMessage('Role name cannot be empty').isLength({ max: 50 }),
  body('description').optional().isString()
];

module.exports = {
  createRoleValidator,
  updateRoleValidator
};
