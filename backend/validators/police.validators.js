const { body, param, query } = require('express-validator');

const createCaseValidator = [
  body('station_id').isUUID().withMessage('Valid station_id is required'),
  body('case_number').notEmpty().withMessage('case_number is required'),
  body('case_type').optional().isString(),
  body('title').notEmpty().withMessage('title is required'),
  body('description').optional().isString(),
  body('date_reported').isISO8601().withMessage('Valid date_reported is required'),
];

const updateCaseValidator = [
  param('id').isUUID().withMessage('Valid case ID is required'),
  body('status_id').optional().isInt(),
  body('case_type').optional().isString(),
  body('title').optional().isString(),
  body('description').optional().isString(),
];

const assignCaseValidator = [
  param('id').isUUID().withMessage('Valid case ID is required'),
  body('officer_id').isUUID().withMessage('Valid officer_id is required'),
  body('assignment_role').optional().isString()
];

const createIncidentValidator = [
  param('id').isUUID().withMessage('Valid case ID is required'),
  body('incident_datetime').optional().isISO8601().withMessage('Valid date format required'),
  body('location').optional().isString(),
  body('description').notEmpty().withMessage('description is required'),
  body('weather').optional().isString()
];

const updateIncidentValidator = [
  param('id').isUUID().withMessage('Valid incident ID is required'),
  body('incident_datetime').optional().isISO8601().withMessage('Valid date format required'),
  body('location').optional().isString(),
  body('description').optional().isString(),
  body('weather').optional().isString()
];

const createEvidenceValidator = [
  param('id').isUUID().withMessage('Valid case ID is required'),
  body('evidence_type').optional().isString(),
  body('description').notEmpty().withMessage('description is required'),
  body('collected_date').optional().isISO8601(),
  body('current_status').optional().isString()
];

const updateEvidenceValidator = [
  param('id').isUUID().withMessage('Valid evidence ID is required'),
  body('evidence_type').optional().isString(),
  body('description').optional().isString(),
  body('collected_date').optional().isISO8601(),
  body('current_status').optional().isString()
];

const transferEvidenceValidator = [
  param('id').isUUID().withMessage('Valid evidence ID is required'),
  body('to_user').optional().isUUID(),
  body('storage_id').optional().isUUID(),
  body('purpose').notEmpty().withMessage('purpose (transfer_reason) is required'),
  body('remarks').optional().isString()
];

const createMlefValidator = [
  body('case_id').isUUID().withMessage('Valid case_id is required'),
  body('patient_id').isUUID().withMessage('Valid patient_id is required'),
  body('hospital_id').isUUID().withMessage('Valid hospital_id is required'),
  body('reason').notEmpty().withMessage('Reason is required')
];

module.exports = {
  createCaseValidator,
  updateCaseValidator,
  assignCaseValidator,
  createIncidentValidator,
  updateIncidentValidator,
  createEvidenceValidator,
  updateEvidenceValidator,
  transferEvidenceValidator,
  createMlefValidator
};
