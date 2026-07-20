const express = require('express');
const rolesController = require('../../controllers/admin/roles.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { createRoleValidator, updateRoleValidator } = require('../../validators/admin/roles.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', rolesController.getAllRoles);
router.post('/', createRoleValidator, validateRequest, rolesController.createRole);
router.put('/:id', updateRoleValidator, validateRequest, rolesController.updateRole);

module.exports = router;
