const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, authorizeRole, authorizePermission } = require('../middleware/auth.middleware');
const { checkLabRequestAssignment } = require('../middleware/laboratory.middleware');
const controller = require('../controllers/laboratory.controller');
const validators = require('../validators/laboratory.validators');

// Setup multer for Result Attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/laboratory/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
};
const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// All laboratory routes require authentication and LAB_TECHNICIAN role
router.use(authenticateToken);
router.use(authorizeRole('LAB_TECHNICIAN', 'ADMIN')); // Admin might need access for oversight

// Apply lab request assignment check for all routes except dashboard and general endpoints
router.use(['/requests/:id', '/tests/:id', '/results/:id'], checkLabRequestAssignment);

// Module 1 - Dashboard
router.get('/dashboard', authorizePermission('VIEW_CASE'), controller.getDashboardStats);

// Module 2 - Laboratory Requests
router.get('/requests', authorizePermission('VIEW_CASE'), controller.getLabRequests);
router.get('/requests/:id', authorizePermission('VIEW_CASE'), controller.getLabRequestById);

// Module 3 - Accept / Reject Request
router.put('/requests/:id/status', authorizePermission('UPLOAD_LAB_RESULT'), validators.updateRequestStatusValidator, controller.updateRequestStatus);

// Module 4 - Specimen Management
router.get('/specimens', controller.getSpecimens);
router.get('/specimens/:id', checkLabRequestAssignment, controller.getSpecimenById);

// Module 5 - Laboratory Tests
router.get('/tests', authorizePermission('VIEW_CASE'), controller.getTests);
router.post('/tests', checkLabRequestAssignment, authorizePermission('UPLOAD_LAB_RESULT'), validators.createTestValidator, controller.createTest);
router.put('/tests/:id', authorizePermission('UPLOAD_LAB_RESULT'), validators.updateTestValidator, controller.updateTest);

// Module 6 - Laboratory Results
router.get('/results', authorizePermission('VIEW_CASE'), controller.getResults);
router.post('/results', checkLabRequestAssignment, authorizePermission('UPLOAD_LAB_RESULT'), validators.createResultValidator, controller.createResult);
router.put('/results/:id', authorizePermission('UPLOAD_LAB_RESULT'), validators.updateResultValidator, controller.updateResult);

// Module 7 - Upload Result Attachments
router.post('/results/:id/files', upload.single('attachment'), authorizePermission('UPLOAD_LAB_RESULT'), controller.uploadAttachment);

// Module 8 - Complete Laboratory Test
router.put('/tests/:id/complete', authorizePermission('UPLOAD_LAB_RESULT'), controller.completeTest);

// Module 9 - Search
router.get('/search', controller.search);

// Module 10 - Activity Timeline
router.get('/activities', controller.getActivityTimeline);

module.exports = router;
