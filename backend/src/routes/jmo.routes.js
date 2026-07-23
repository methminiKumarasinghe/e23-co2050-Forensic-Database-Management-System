const express = require('express');
const router = express.Router();
const jmoController = require('../controllers/jmo.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

// Protect all routes and authorize JMO
router.use(authenticate);
router.use(requireRole('JMO'));

router.get('/lab-results', jmoController.getLabResults);
router.get('/lab-result/:id', jmoController.getResultById);

router.get('/notifications', jmoController.getNotifications);
router.put('/notification/:id/read', jmoController.markNotificationRead);

module.exports = router;
