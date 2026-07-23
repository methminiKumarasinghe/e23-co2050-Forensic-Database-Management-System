const express = require('express');
const router = express.Router();
const jmoController = require('../controllers/jmo.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

// Protect all routes and authorize JMO
router.use(authenticate);
router.use(requireRole('JMO'));

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
