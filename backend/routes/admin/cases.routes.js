const express = require('express');
const casesController = require('../../controllers/admin/cases.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', casesController.getAllCases);
router.get('/:id', casesController.getCaseById);
router.get('/:id/timeline', casesController.getCaseTimeline);

module.exports = router;
