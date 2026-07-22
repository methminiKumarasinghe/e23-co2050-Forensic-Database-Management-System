const { body, param, query } = require('express-validator');

const appointmentValidator = [
    body('jmo_id').isUUID().withMessage('Valid JMO ID is required'),
    body('patient_id').isUUID().withMessage('Valid Patient ID is required'),
    body('mlef_id').optional({ checkFalsy: true }).isUUID().withMessage('Valid MLEF ID must be provided if applicable'),
    body('appointment_date').isISO8601().withMessage('Valid appointment date is required'),
    body('remarks').optional().isString()
];

const updateAppointmentValidator = [
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('status').optional().isIn(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status')
];

const patientValidator = [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('nic').notEmpty().withMessage('NIC is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
    body('date_of_birth').isISO8601().withMessage('Valid date of birth is required'),
    body('telephone').optional().isString(),
    body('address').optional().isString()
];

const deceasedValidator = [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
    body('date_found').isISO8601().withMessage('Valid date found is required'),
    body('location_found').notEmpty().withMessage('Location found is required'),
    body('identification_status').isBoolean().withMessage('Identification status must be a boolean')
];

const mlefValidator = [
    body('case_id').isUUID().withMessage('Valid Case ID is required'),
    body('patient_id').isUUID().withMessage('Valid Patient ID is required'),
    body('hospital_id').isUUID().withMessage('Valid Hospital ID is required'),
    body('reason').notEmpty().withMessage('Reason is required')
];

const assignJmoValidator = [
    param('caseId').isUUID().withMessage('Valid Case ID is required in URL'),
    body('jmo_id').isUUID().withMessage('Valid JMO ID is required'),
    body('hospital_id').isUUID().withMessage('Valid Hospital ID is required'),
    body('assignment_date').isISO8601().withMessage('Valid assignment date is required')
];

const searchValidator = [
    query('q').optional().isString()
];

module.exports = {
    appointmentValidator,
    updateAppointmentValidator,
    searchValidator,
    patientValidator,
    deceasedValidator,
    mlefValidator,
    assignJmoValidator
};
