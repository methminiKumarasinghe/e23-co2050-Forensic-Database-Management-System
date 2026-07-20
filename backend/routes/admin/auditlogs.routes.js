const express = require('express');
const auditLogsController = require('../../controllers/admin/auditlogs.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { auditLogsFilterValidator } = require('../../validators/admin/auditlogs.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', auditLogsFilterValidator, validateRequest, auditLogsController.getAuditLogs);

module.exports = router;
