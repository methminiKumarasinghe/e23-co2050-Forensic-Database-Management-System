const express = require('express');
const hospitalsController = require('../../controllers/admin/hospitals.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { createHospitalValidator, updateHospitalValidator, idValidator } = require('../../validators/admin/hospitals.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', hospitalsController.getAllHospitals);
router.get('/:id', idValidator, validateRequest, hospitalsController.getHospitalById);
router.post('/', createHospitalValidator, validateRequest, hospitalsController.createHospital);
router.put('/:id', updateHospitalValidator, validateRequest, hospitalsController.updateHospital);
router.delete('/:id', idValidator, validateRequest, hospitalsController.deleteHospital);

module.exports = router;
