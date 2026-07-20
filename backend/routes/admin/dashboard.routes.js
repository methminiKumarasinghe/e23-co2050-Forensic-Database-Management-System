const express = require('express');
const dashboardController = require('../../controllers/admin/dashboard.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticateToken, authorizeRole('ADMIN'), dashboardController.getDashboard);

module.exports = router;
