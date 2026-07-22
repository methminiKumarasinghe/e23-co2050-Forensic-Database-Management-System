const express = require('express');
const router = express.Router();
const controller = require('../controllers/staff.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');
const { checkStaffHospital } = require('../middleware/staff.middleware');
const validators = require('../validators/staff.validators');

// Apply authentication and authorization for all routes in this file
router.use(authenticateToken);
router.use(authorizeRole('FORENSIC_STAFF'));
router.use(checkStaffHospital);

// --- MODULE 1: Dashboard Overview ---
router.get('/dashboard', controller.getDashboardStats);

// --- MODULE 1B: Registration ---
router.post('/patients', validators.patientValidator, controller.createPatient);
router.get('/patients', controller.getPatients);
router.get('/patients/:id', controller.getPatientById);

router.post('/deceased', validators.deceasedValidator, controller.createDeceased);
router.get('/deceased', controller.getDeceased);
router.get('/deceased/:id', controller.getDeceasedById);

router.post('/mlef', validators.mlefValidator, controller.createMlef);

router.get('/hospitals', controller.getHospitals);
router.get('/available-jmo', controller.getAvailableJmo);

// --- MODULE 2: Case Monitoring ---
router.get('/cases', controller.getCases);
router.get('/cases/:id', controller.getCaseById);

// --- MODULE 3: Case Progress Tracking & JMO Assignment ---
router.get('/cases/:id/timeline', controller.getCaseTimeline);
router.post('/cases/:caseId/assign-jmo', validators.assignJmoValidator, controller.assignJmoToCase);

// --- MODULE 4: MLEF Monitoring ---
router.get('/mlef', controller.getMlefRequests);
router.get('/mlef/:id', controller.getMlefById);

// --- MODULE 5: Examination Monitoring ---
router.get('/examinations', controller.getExaminations);
router.get('/examinations/:id', controller.getExaminationById);

// --- MODULE 6: Laboratory Monitoring ---
router.get('/laboratory/requests', controller.getLabRequests);
router.get('/laboratory/results/:id', controller.getLabResultById);

// --- MODULE 7: Document Management ---
router.get('/documents', controller.getDocuments);
router.get('/documents/:id', controller.getDocumentById);

// --- MODULE 8: Appointment Management ---
router.get('/appointments', controller.getAppointments);
router.post('/appointments', validators.appointmentValidator, controller.createAppointment);
router.put('/appointments/:id', validators.updateAppointmentValidator, controller.updateAppointment);

// --- MODULE 9: Notifications ---
router.get('/notifications', controller.getNotifications);
router.put('/notifications/:id/read', controller.markNotificationRead);

// --- MODULE 10: Search ---
router.get('/search', validators.searchValidator, controller.search);

module.exports = router;
