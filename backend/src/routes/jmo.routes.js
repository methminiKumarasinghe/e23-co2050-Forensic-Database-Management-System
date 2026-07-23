const express = require('express');
const router = express.Router();
const jmoController = require('../controllers/jmo.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

// Protect all routes and authorize JMO
router.use(authenticate);
router.use(requireRole('JMO'));

// Autopsy Workflow Endpoints
router.get('/autopsy/cases', jmoController.getAutopsyCases);
router.get('/autopsy/notification/:caseId', jmoController.getAutopsyNotification);
router.post('/autopsy/notification', jmoController.saveAutopsyNotification);
router.put('/autopsy/notification/:id', jmoController.saveAutopsyNotification);

// MLR Module Endpoints
router.get('/mlr/cases', jmoController.getMlrCases);
router.get('/mlr/:mlefId/case-data', jmoController.getMlrCaseData);
router.post('/mlr/:mlefId', jmoController.saveMlrReport);
router.post('/mlr/:reportId/sign', jmoController.signMlrReport);
router.get('/mlr/:reportId/final-report', jmoController.getFinalMlrReport);

// MLEF Assignment & Examination
router.get('/assigned-mlef', jmoController.getAssignedMlefs);
router.get('/mlef/:id/police-details', jmoController.getMlefPoliceDetails);
router.post('/mlef/:id/examination', jmoController.submitMlefExamination);
router.get('/mlef/:id/report', jmoController.getMlefReport);

// MLR & Autopsy
router.get('/mlr-reports', jmoController.getMlrReports);
router.get('/autopsies', jmoController.getAutopsies);

// Laboratories & Specimens for request form
router.get('/laboratories', jmoController.getLaboratories);
router.get('/specimens', jmoController.getJmoSpecimens);

// Laboratory Requests
router.post('/laboratory/requests', jmoController.createLabRequest);
router.get('/laboratory/requests', jmoController.getJmoRequests);
router.put('/laboratory/request/:id/cancel', jmoController.cancelLabRequest);

// Laboratory Results
router.get('/lab-results', jmoController.getLabResults);
router.get('/lab-result/:id', jmoController.getResultById);

// Notifications
router.get('/notifications', jmoController.getNotifications);
router.put('/notification/:id/read', jmoController.markNotificationRead);

module.exports = router;
