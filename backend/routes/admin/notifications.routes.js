const express = require('express');
const notificationsController = require('../../controllers/admin/notifications.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { createNotificationValidator } = require('../../validators/admin/notifications.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', notificationsController.getAllNotifications);
router.post('/', createNotificationValidator, validateRequest, notificationsController.createNotification);

module.exports = router;
