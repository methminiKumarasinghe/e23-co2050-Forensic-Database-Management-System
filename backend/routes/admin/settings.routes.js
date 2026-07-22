const express = require('express');
const settingsController = require('../../controllers/admin/settings.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', settingsController.getAllSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
