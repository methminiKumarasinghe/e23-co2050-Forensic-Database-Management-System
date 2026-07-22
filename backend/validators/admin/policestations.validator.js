const { body, param } = require('express-validator');

const createStationValidator = [
  body('station_name').notEmpty().withMessage('Station name is required').isLength({ max: 150 }).withMessage('Station name max length is 150'),
  body('district').optional().isLength({ max: 100 }).withMessage('District max length is 100'),
  body('telephone').optional().isLength({ max: 20 }).withMessage('Telephone max length is 20'),
  body('email').optional().isEmail().withMessage('Invalid email format')
];

const updateStationValidator = [
  param('id').isUUID().withMessage('Invalid station ID format'),
  body('station_name').optional().notEmpty().withMessage('Station name cannot be empty').isLength({ max: 150 }).withMessage('Station name max length is 150'),
  body('district').optional().isLength({ max: 100 }).withMessage('District max length is 100'),
  body('telephone').optional().isLength({ max: 20 }).withMessage('Telephone max length is 20'),
  body('email').optional().isEmail().withMessage('Invalid email format')
];

const deleteStationValidator = [
  param('id').isUUID().withMessage('Invalid station ID format')
];

const getStationValidator = [
  param('id').isUUID().withMessage('Invalid station ID format')
];

module.exports = {
  createStationValidator,
  updateStationValidator,
  deleteStationValidator,
  getStationValidator
};
