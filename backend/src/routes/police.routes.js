const { Router } = require('express');
const {
  getOfficerProfileController,
  getPoliceDashboardStatsController,
  getAssignedCasesController,
  createPoliceCaseController,
  registerPatientController,
  searchPatientsController,
  getHospitalsController,
  createMlefController,
  getMlefsController,
  getCaseDetailsController,
  addEvidenceController,
  uploadEvidencePhotoController,
  assignOfficerController,
  updateCaseStatusController,
  getOfficersListController,
  getOfficerNotificationsController,
} = require('../controllers/police.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const upload = require('../middleware/fileUpload.middleware');

const router = Router();

// Require logged-in user with POLICE or ADMIN role
router.use(authenticate, requireRole('POLICE', 'ADMIN'));

// Profile & Stats
router.get('/me', getOfficerProfileController);
router.get('/stats', getPoliceDashboardStatsController);
router.get('/notifications', getOfficerNotificationsController);

// Cases & Incidents
router.get('/cases', getAssignedCasesController);
router.post('/cases', createPoliceCaseController);
router.get('/cases/:caseId', getCaseDetailsController);
router.post('/cases/assign', assignOfficerController);
router.post('/cases/status', updateCaseStatusController);

// Patients
router.post('/patients', registerPatientController);
router.get('/patients', searchPatientsController);

// Hospitals & Officers
router.get('/hospitals', getHospitalsController);
router.get('/officers', getOfficersListController);

// MLEFs
router.post('/mlef', createMlefController);
router.get('/mlef', getMlefsController);

// Evidence & Photo Uploads
router.post('/evidence', addEvidenceController);
router.post('/evidence/:evidenceId/photos', upload.single('photo'), uploadEvidencePhotoController);

module.exports = router;
