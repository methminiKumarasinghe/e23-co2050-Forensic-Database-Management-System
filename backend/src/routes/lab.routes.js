const express = require('express');
const router = express.Router();
const labController = require('../controllers/lab.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const upload = require('../middleware/fileUpload.middleware');

// Protect all routes and authorize LAB_TECHNICIAN
router.use(authenticate);
router.use(requireRole('LAB_TECHNICIAN'));

router.get('/dashboard', labController.getDashboardStats);

router.get('/requests', labController.getRequests);
router.get('/request/:id', labController.getRequestById);

router.put('/request/:id/accept', labController.acceptRequest);
router.put('/request/:id/reject', labController.rejectRequest);
router.put('/request/:id/start', labController.startTest);

// POST /lab/result includes file upload
router.post('/result', upload.array('files', 5), labController.submitResult);

router.get('/results', labController.getResults);
router.get('/result/:id', labController.getResultById);

module.exports = router;
