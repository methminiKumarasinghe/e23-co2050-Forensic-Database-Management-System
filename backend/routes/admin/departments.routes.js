const express = require('express');
const departmentsController = require('../../controllers/admin/departments.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { createDepartmentValidator, updateDepartmentValidator, idValidator } = require('../../validators/admin/departments.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', departmentsController.getAllDepartments);
router.get('/:id', idValidator, validateRequest, departmentsController.getDepartmentById);
router.post('/', createDepartmentValidator, validateRequest, departmentsController.createDepartment);
router.put('/:id', updateDepartmentValidator, validateRequest, departmentsController.updateDepartment);
router.delete('/:id', idValidator, validateRequest, departmentsController.deleteDepartment);

module.exports = router;
