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

const searchValidator = [
    query('q').optional().isString()
];

module.exports = {
    appointmentValidator,
    updateAppointmentValidator,
    searchValidator
};
