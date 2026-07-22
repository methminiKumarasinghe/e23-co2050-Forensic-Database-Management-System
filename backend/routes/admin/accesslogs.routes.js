const express = require('express');
const accessLogsController = require('../../controllers/admin/accesslogs.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', accessLogsController.getAllAccessLogs);

module.exports = router;
