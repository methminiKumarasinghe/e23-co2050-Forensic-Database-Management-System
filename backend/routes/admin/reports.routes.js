const express = require('express');
const reportsController = require('../../controllers/admin/reports.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/summary', reportsController.getSummaryStats);

module.exports = router;
