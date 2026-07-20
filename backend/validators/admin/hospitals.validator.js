const { body, param } = require('express-validator');

const createHospitalValidator = [
  body('hospital_name').notEmpty().withMessage('Hospital name is required').isLength({ max: 150 }),
  body('hospital_type').optional().isString().isLength({ max: 50 }),
  body('address').optional().isString(),
  body('district').optional().isString().isLength({ max: 100 }),
  body('telephone').optional().isString().isLength({ max: 20 }),
  body('email').optional().isEmail()
];

const updateHospitalValidator = [
  param('id').isUUID().withMessage('Invalid hospital ID format'),
  ...createHospitalValidator.map(v => v.optional())
];

const idValidator = [
  param('id').isUUID().withMessage('Invalid ID format')
];

module.exports = {
  createHospitalValidator,
  updateHospitalValidator,
  idValidator
};
