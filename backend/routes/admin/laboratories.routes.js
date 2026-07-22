const express = require('express');
const laboratoriesController = require('../../controllers/admin/laboratories.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const {
  createLabValidator,
  updateLabValidator,
  deleteLabValidator,
  getLabValidator
} = require('../../validators/admin/laboratories.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', laboratoriesController.getAllLaboratories);
router.get('/:id', getLabValidator, validateRequest, laboratoriesController.getLaboratoryById);
router.post('/', createLabValidator, validateRequest, laboratoriesController.createLaboratory);
router.put('/:id', updateLabValidator, validateRequest, laboratoriesController.updateLaboratory);
router.delete('/:id', deleteLabValidator, validateRequest, laboratoriesController.deleteLaboratory);

module.exports = router;
