const express = require('express');
const staffController = require('../../controllers/admin/staff.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const {
  createStaffValidator,
  updateStaffValidator,
  deleteStaffValidator,
  getStaffValidator
} = require('../../validators/admin/staff.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', staffController.getAllStaff);
router.get('/:id', getStaffValidator, validateRequest, staffController.getStaffById);
router.post('/', createStaffValidator, validateRequest, staffController.createStaff);
router.put('/:id', updateStaffValidator, validateRequest, staffController.updateStaff);
router.delete('/:id', deleteStaffValidator, validateRequest, staffController.deleteStaff);

module.exports = router;
