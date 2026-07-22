const { body, param } = require('express-validator');

const createStaffValidator = [
  body('first_name').notEmpty().withMessage('First name is required').isLength({ max: 100 }).withMessage('First name max length is 100'),
  body('last_name').notEmpty().withMessage('Last name is required').isLength({ max: 100 }).withMessage('Last name max length is 100'),
  body('nic').optional().isLength({ max: 20 }).withMessage('NIC max length is 20'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('date_of_birth').optional().isISO8601().withMessage('Invalid date format'),
  body('telephone').optional().isLength({ max: 20 }).withMessage('Telephone max length is 20'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('role').notEmpty().withMessage('Role is required').isIn(['POLICE', 'JMO', 'MEDICAL_OFFICER', 'LAB_TECHNICIAN', 'GOVERNMENT_ANALYST', 'FORENSIC_STAFF']).withMessage('Invalid role name')
];

const updateStaffValidator = [
  param('id').isUUID().withMessage('Invalid staff person ID format'),
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty').isLength({ max: 100 }).withMessage('First name max length is 100'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty').isLength({ max: 100 }).withMessage('Last name max length is 100'),
  body('nic').optional().isLength({ max: 20 }).withMessage('NIC max length is 20'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('date_of_birth').optional().isISO8601().withMessage('Invalid date format'),
  body('telephone').optional().isLength({ max: 20 }).withMessage('Telephone max length is 20'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('role').notEmpty().withMessage('Role is required').isIn(['POLICE', 'JMO', 'MEDICAL_OFFICER', 'LAB_TECHNICIAN', 'GOVERNMENT_ANALYST', 'FORENSIC_STAFF']).withMessage('Invalid role name')
];

const deleteStaffValidator = [
  param('id').isUUID().withMessage('Invalid staff person ID format')
];

const getStaffValidator = [
  param('id').isUUID().withMessage('Invalid staff person ID format')
];

module.exports = {
  createStaffValidator,
  updateStaffValidator,
  deleteStaffValidator,
  getStaffValidator
};
