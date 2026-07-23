const { Router } = require('express');
const {
  getHospitalMlefsController,
  getHospitalJmosController,
  assignMlefController,
  getHospitalPatientsController,
  getHospitalReportsController,
  getHospitalCasesController,
  getHospitalDocumentsController,
} = require('../controllers/medical.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { ROLES } = require('../config/constants');

const router = Router();

// Require logged-in user with MEDICAL_OFFICER, JMO, GOVERNMENT_ANALYST, or ADMIN role
router.use(authenticate, requireRole(ROLES.MEDICAL_OFFICER, ROLES.JMO, ROLES.GOVERNMENT_ANALYST, ROLES.ADMIN));

router.get('/mlefs', getHospitalMlefsController);
router.get('/jmos', getHospitalJmosController);
router.post('/assign', assignMlefController);

router.get('/patients', getHospitalPatientsController);
router.get('/reports', getHospitalReportsController);
router.get('/cases', getHospitalCasesController);
router.get('/documents', getHospitalDocumentsController);

module.exports = router;
