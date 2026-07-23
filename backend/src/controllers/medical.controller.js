const { sendSuccess } = require('../utils/response');
const medicalService = require('../services/medical.service');

const getHospitalMlefsController = async (req, res, next) => {
  try {
    const mlefs = await medicalService.getHospitalMlefs(req.user.user_id);
    return sendSuccess(res, {
      message: 'Hospital MLEF requisitions retrieved successfully',
      data: mlefs,
      meta: { count: mlefs.length },
    });
  } catch (err) {
    next(err);
  }
};

const getHospitalJmosController = async (req, res, next) => {
  try {
    const jmos = await medicalService.getHospitalJmos(req.user.user_id);
    return sendSuccess(res, {
      message: 'Hospital JMO list retrieved successfully',
      data: jmos,
      meta: { count: jmos.length },
    });
  } catch (err) {
    next(err);
  }
};

const assignMlefController = async (req, res, next) => {
  try {
    const { mlef_id, jmo_id } = req.body;

    if (!mlef_id || !jmo_id) {
      return res.status(400).json({
        success: false,
        message: 'mlef_id and jmo_id are required fields',
      });
    }

    const result = await medicalService.assignMlefToJmo({
      mlef_id,
      jmo_id,
      userId: req.user.user_id,
    });

    return sendSuccess(res, {
      message: `MLEF successfully assigned to JMO ${result.assigned_jmo}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHospitalMlefsController,
  getHospitalJmosController,
  assignMlefController,
};
