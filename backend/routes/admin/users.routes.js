const express = require('express');
const usersController = require('../../controllers/admin/users.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { createUserValidator, updateUserValidator, deleteUserValidator, getUserValidator } = require('../../validators/admin/users.validator');

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', usersController.getAllUsers);
router.get('/:id', getUserValidator, validateRequest, usersController.getUserById);
router.post('/', createUserValidator, validateRequest, usersController.createUser);
router.put('/:id', updateUserValidator, validateRequest, usersController.updateUser);
router.delete('/:id', deleteUserValidator, validateRequest, usersController.deleteUser);

module.exports = router;
