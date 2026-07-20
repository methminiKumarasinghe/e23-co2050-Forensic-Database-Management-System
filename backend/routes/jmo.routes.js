const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const jmoController = require('../controllers/jmo.controller');
const jmoMiddleware = require('../middleware/jmo.middleware');
const jmoValidators = require('../validators/jmo.validators');

// Auth middleware (assuming it's available from existing auth middleware)
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

// Apply auth to all JMO routes
router.use(authenticateToken);
router.use(authorizeRole('JMO'));

// Configure multer for injury photos and body diagrams
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/injuries/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpeg, jpg, png)!'));
        }
    }
});

// --- MODULE 1: Dashboard ---
router.get('/dashboard', jmoController.getDashboardStats);

// --- MODULE 2: Assigned MLEF Requests ---
router.get('/mlef', jmoController.getMlefRequests);
router.get('/mlef/:id', jmoController.getMlefById);

// --- MODULE 3: Medical Examination ---
router.get('/examinations', jmoController.getExaminations);
router.post('/examinations', jmoValidators.createExaminationValidator, jmoController.createExamination);
router.put('/examinations/:id', jmoMiddleware.checkExaminationAssignment, jmoValidators.updateExaminationValidator, jmoController.updateExamination);

// --- MODULE 4: Vital Signs ---
router.post('/examinations/:id/vitals', jmoMiddleware.checkExaminationAssignment, jmoValidators.addVitalsValidator, jmoController.addVitals);
router.put('/vitals/:id', jmoMiddleware.checkExaminationAssignment, jmoValidators.updateVitalsValidator, jmoController.updateVitals);

// --- MODULE 5: Injury Management ---
router.get('/examinations/:id/injuries', jmoMiddleware.checkExaminationAssignment, jmoController.getInjuries);
router.post('/examinations/:id/injuries', jmoMiddleware.checkExaminationAssignment, jmoValidators.createInjuryValidator, jmoController.createInjury);
router.put('/injuries/:id', jmoMiddleware.checkExaminationAssignment, jmoValidators.updateInjuryValidator, jmoController.updateInjury);

// --- MODULE 6 & 7: Injury Photos & Body Diagrams ---
router.post('/injuries/:id/photos', jmoMiddleware.checkExaminationAssignment, upload.array('photos', 10), jmoController.uploadInjuryPhotos);
router.post('/injuries/:id/body-diagram', jmoMiddleware.checkExaminationAssignment, upload.single('diagram'), jmoController.uploadBodyDiagram);

// --- MODULE 8: Specimen Collection ---
router.get('/examinations/:id/specimens', jmoMiddleware.checkExaminationAssignment, jmoController.getSpecimens);
router.post('/examinations/:id/specimens', jmoMiddleware.checkExaminationAssignment, jmoValidators.createSpecimenValidator, jmoController.createSpecimen);

// --- MODULE 9: Laboratory Requests ---
router.get('/laboratory-requests', jmoController.getLabRequests);
router.post('/laboratory-requests', jmoValidators.createLabRequestValidator, jmoController.createLabRequest);

// --- MODULE 10: Laboratory Results ---
router.get('/laboratory-results', jmoController.getLabResults);
router.get('/laboratory-results/:id', jmoController.getLabResultById);

// --- MODULE 11: Medico-Legal Reports ---
router.get('/reports', jmoController.getReports);
router.get('/reports/:id', jmoMiddleware.checkExaminationAssignment, jmoController.getReportById);
router.post('/reports', jmoValidators.createReportValidator, jmoController.createReport);
router.put('/reports/:id', jmoMiddleware.checkExaminationAssignment, jmoMiddleware.checkReportNotSigned, jmoValidators.updateReportValidator, jmoController.updateReport);

// --- MODULE 12: Digital Signature ---
router.post('/reports/:id/sign', jmoMiddleware.checkExaminationAssignment, jmoMiddleware.checkReportNotSigned, jmoValidators.signReportValidator, jmoController.signReport);

// --- MODULE 13: Appointments ---
router.get('/appointments', jmoController.getAppointments);
router.post('/appointments', jmoValidators.createAppointmentValidator, jmoController.createAppointment);
router.put('/appointments/:id', jmoValidators.updateAppointmentValidator, jmoController.updateAppointment);

// --- MODULE 14: Search ---
router.get('/search', jmoController.search);

module.exports = router;
