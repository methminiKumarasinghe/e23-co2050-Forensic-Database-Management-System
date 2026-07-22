const express = require('express');
const policeStationsController = require('../../controllers/admin/policestations.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const {
  createStationValidator,
  updateStationValidator,
  deleteStationValidator,
  getStationValidator
} = require('../../validators/admin/policestations.validator');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

router.get('/', policeStationsController.getAllPoliceStations);
router.get('/:id', getStationValidator, validateRequest, policeStationsController.getPoliceStationById);
router.post('/', createStationValidator, validateRequest, policeStationsController.createPoliceStation);
router.put('/:id', updateStationValidator, validateRequest, policeStationsController.updatePoliceStation);
router.delete('/:id', deleteStationValidator, validateRequest, policeStationsController.deletePoliceStation);

module.exports = router;
