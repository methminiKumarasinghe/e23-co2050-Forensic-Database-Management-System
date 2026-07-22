const { body, param } = require('express-validator');

const createLabValidator = [
  body('hospital_id').notEmpty().withMessage('Hospital ID is required').isUUID().withMessage('Invalid hospital ID format'),
  body('laboratory_name').notEmpty().withMessage('Laboratory name is required').isLength({ max: 150 }).withMessage('Laboratory name max length is 150'),
  body('laboratory_type').optional().isLength({ max: 100 }).withMessage('Laboratory type max length is 100'),
  body('contact_number').optional().isLength({ max: 20 }).withMessage('Contact number max length is 20'),
  body('email').optional().isEmail().withMessage('Invalid email format')
];

const updateLabValidator = [
  param('id').isUUID().withMessage('Invalid laboratory ID format'),
  body('hospital_id').optional().isUUID().withMessage('Invalid hospital ID format'),
  body('laboratory_name').optional().notEmpty().withMessage('Laboratory name cannot be empty').isLength({ max: 150 }).withMessage('Laboratory name max length is 150'),
  body('laboratory_type').optional().isLength({ max: 100 }).withMessage('Laboratory type max length is 100'),
  body('contact_number').optional().isLength({ max: 20 }).withMessage('Contact number max length is 20'),
  body('email').optional().isEmail().withMessage('Invalid email format')
];

const deleteLabValidator = [
  param('id').isUUID().withMessage('Invalid laboratory ID format')
];

const getLabValidator = [
  param('id').isUUID().withMessage('Invalid laboratory ID format')
];

module.exports = {
  createLabValidator,
  updateLabValidator,
  deleteLabValidator,
  getLabValidator
};
