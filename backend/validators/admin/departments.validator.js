const { body, param } = require('express-validator');

const createDepartmentValidator = [
  body('hospital_id').isUUID().withMessage('Valid Hospital ID is required'),
  body('department_name').notEmpty().withMessage('Department name is required').isLength({ max: 100 }),
  body('description').optional().isString()
];

const updateDepartmentValidator = [
  param('id').isUUID().withMessage('Invalid department ID format'),
  body('hospital_id').optional().isUUID(),
  body('department_name').optional().notEmpty().isLength({ max: 100 }),
  body('description').optional().isString()
];

const idValidator = [
  param('id').isUUID().withMessage('Invalid ID format')
];

module.exports = {
  createDepartmentValidator,
  updateDepartmentValidator,
  idValidator
};
