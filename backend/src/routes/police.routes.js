const { Router } = require('express');
const {
  getOfficerProfileController,
  getAssignedCasesController,
  searchPatientsController,
  getHospitalsController,
  createMlefController,
  getMlefsController,
} = require('../controllers/police.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = Router();

// Require logged-in user with POLICE or ADMIN role
router.use(authenticate, requireRole('POLICE', 'ADMIN'));

router.get('/me', getOfficerProfileController);
router.get('/cases', getAssignedCasesController);
router.get('/patients', searchPatientsController);
router.get('/hospitals', getHospitalsController);
router.post('/mlef', createMlefController);
router.get('/mlef', getMlefsController);

module.exports = router;
