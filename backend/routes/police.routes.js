const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { authenticateToken, authorizeRole, authorizePermission } = require('../middleware/auth.middleware');
const { checkCaseAssignment } = require('../middleware/police.middleware');

const policeController = require('../controllers/police.controller');
const policeValidators = require('../validators/police.validators');

// Setup multer for evidence photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/evidence/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter
});

// Protect all /police routes
router.use(authenticateToken);
router.use(authorizeRole('POLICE'));

// MODULE 1 - Dashboard
router.get('/dashboard', policeController.getDashboardStats);

// MODULE 10 - Search
router.get('/search', policeController.search);

// MODULE 8 - MLEF Requests (General, no case context needed for listing all assigned requests)
router.get('/mlef', policeController.getMlefRequests);
router.post('/mlef', policeValidators.createMlefValidator, policeController.createMlefRequest);
router.get('/mlef/:id', policeController.getMlefById);

// MODULE 2 - Case Management
router.get('/cases', authorizePermission('VIEW_CASE'), policeController.getCases);
router.post('/cases', authorizePermission('CREATE_CASE'), policeValidators.createCaseValidator, policeController.createCase);
router.get('/cases/:id', checkCaseAssignment, authorizePermission('VIEW_CASE'), policeController.getCaseById);
router.put('/cases/:id', checkCaseAssignment, authorizePermission('UPDATE_CASE'), policeValidators.updateCaseValidator, policeController.updateCase);

// MODULE 3 - Case Assignment
router.post('/cases/:id/assign', checkCaseAssignment, policeValidators.assignCaseValidator, policeController.assignOfficer);
router.get('/cases/:id/officers', checkCaseAssignment, policeController.getCaseOfficers);

// MODULE 4 - Incident Management
router.get('/cases/:id/incidents', checkCaseAssignment, policeController.getIncidents);
router.post('/cases/:id/incidents', checkCaseAssignment, policeValidators.createIncidentValidator, policeController.createIncident);
// Note: PUT /incidents/:id doesn't easily check case assignment unless we query the incident's case first.
// According to prompt: PUT /police/incidents/:id
router.put('/incidents/:id', policeValidators.updateIncidentValidator, policeController.updateIncident);

// MODULE 5 - Evidence Management
router.get('/cases/:id/evidence', checkCaseAssignment, authorizePermission('VIEW_EVIDENCE'), policeController.getEvidence);
router.post('/cases/:id/evidence', checkCaseAssignment, authorizePermission('ADD_EVIDENCE'), policeValidators.createEvidenceValidator, policeController.createEvidence);
// PUT /police/evidence/:id
router.put('/evidence/:id', authorizePermission('ADD_EVIDENCE'), policeValidators.updateEvidenceValidator, policeController.updateEvidence);

// MODULE 6 - Evidence Photos
// POST /police/evidence/:id/photos
router.post('/evidence/:id/photos', upload.array('photos', 10), policeController.uploadEvidencePhotos);

// MODULE 7 - Chain of Custody
// GET /police/evidence/:id/chain
router.get('/evidence/:id/chain', policeController.getChainOfCustody);
// POST /police/evidence/:id/transfer
router.post('/evidence/:id/transfer', policeValidators.transferEvidenceValidator, policeController.transferEvidence);

// MODULE 9 - Case Timeline
// GET /police/cases/:id/timeline
router.get('/cases/:id/timeline', checkCaseAssignment, policeController.getCaseTimeline);



// MODULE 12 - Reports Status
router.get('/reports-status', policeController.getReportsStatus);


// Error handling for Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    if (err.message === 'Only images are allowed!') {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
  next();
});


// Helper lookup endpoints for the frontend
router.get('/hospitals', async (req, res, next) => {
  try {
    const pool = require('../database/connection');
    const result = await pool.query('SELECT * FROM hospital');
    res.json(result.rows);
  } catch(e) { next(e); }
});

router.get('/patients', async (req, res, next) => {
  try {
    const pool = require('../database/connection');
    const result = await pool.query('SELECT pt.patient_id, p.first_name, p.last_name, p.nic FROM patient pt JOIN person p ON pt.person_id = p.person_id');
    res.json(result.rows);
  } catch(e) { next(e); }
});

module.exports = router;
