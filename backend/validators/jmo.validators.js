const { body, param } = require('express-validator');

const createExaminationValidator = [
  body('mlef_id').isUUID().withMessage('Valid mlef_id is required'),
  body('examination_date').isISO8601().withMessage('Valid date is required'),
  body('examination_notes').optional().isString(),
  body('conclusion').optional().isString()
];

const updateExaminationValidator = [
  param('id').isUUID().withMessage('Valid examination ID is required'),
  body('status_id').optional().isInt(),
  body('examination_notes').optional().isString(),
  body('conclusion').optional().isString()
];

const addVitalsValidator = [
  param('id').isUUID().withMessage('Valid examination ID is required'),
  body('temperature').optional().isNumeric(),
  body('blood_pressure').optional().isString(),
  body('pulse_rate').optional().isInt(),
  body('respiratory_rate').optional().isInt(),
  body('weight').optional().isNumeric(),
  body('height').optional().isNumeric()
];

const updateVitalsValidator = [
  param('id').isUUID().withMessage('Valid vital signs ID is required'),
  body('temperature').optional().isNumeric(),
  body('blood_pressure').optional().isString(),
  body('pulse_rate').optional().isInt(),
  body('respiratory_rate').optional().isInt(),
  body('weight').optional().isNumeric(),
  body('height').optional().isNumeric()
];

const createInjuryValidator = [
  param('id').isUUID().withMessage('Valid examination ID is required'),
  body('injury_type').notEmpty().withMessage('Injury type is required'),
  body('body_location').notEmpty().withMessage('Body location is required'),
  body('description').optional().isString(),
  body('size').optional().isString(),
  body('severity').optional().isString(),
  body('estimated_age').optional().isString()
];

const updateInjuryValidator = [
  param('id').isUUID().withMessage('Valid injury ID is required'),
  body('injury_type').optional().isString(),
  body('body_location').optional().isString(),
  body('description').optional().isString(),
  body('size').optional().isString(),
  body('severity').optional().isString(),
  body('estimated_age').optional().isString()
];

const createSpecimenValidator = [
  param('id').isUUID().withMessage('Valid examination ID is required'),
  body('specimen_type').notEmpty().withMessage('Specimen type is required'),
  body('collection_datetime').optional().isISO8601(),
  body('remarks').optional().isString()
];

const createLabRequestValidator = [
  body('specimen_id').isUUID().withMessage('Valid specimen_id is required'),
  body('laboratory_id').isUUID().withMessage('Valid laboratory_id is required'),
  body('priority').optional().isString()
];

const createReportValidator = [
  body('examination_id').isUUID().withMessage('Valid examination_id is required'),
  body('findings').optional().isString(),
  body('medical_opinion').optional().isString(),
  body('recommendations').optional().isString()
];

const updateReportValidator = [
  param('id').isUUID().withMessage('Valid report ID is required'),
  body('findings').optional().isString(),
  body('medical_opinion').optional().isString(),
  body('recommendations').optional().isString()
];

const signReportValidator = [
  param('id').isUUID().withMessage('Valid report ID is required'),
  body('signature_hash').notEmpty().withMessage('Signature hash is required')
];

const createAppointmentValidator = [
  body('patient_id').isUUID().withMessage('Valid patient_id is required'),
  body('mlef_id').optional().isUUID(),
  body('appointment_date').isISO8601().withMessage('Valid appointment_date is required'),
  body('remarks').optional().isString()
];

const updateAppointmentValidator = [
  param('id').isUUID().withMessage('Valid appointment ID is required'),
  body('appointment_date').optional().isISO8601(),
  body('status').optional().isString(),
  body('remarks').optional().isString()
];

module.exports = {
  createExaminationValidator,
  updateExaminationValidator,
  addVitalsValidator,
  updateVitalsValidator,
  createInjuryValidator,
  updateInjuryValidator,
  createSpecimenValidator,
  createLabRequestValidator,
  createReportValidator,
  updateReportValidator,
  signReportValidator,
  createAppointmentValidator,
  updateAppointmentValidator
};
