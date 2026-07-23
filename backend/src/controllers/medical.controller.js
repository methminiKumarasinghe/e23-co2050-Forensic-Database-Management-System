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

const getHospitalPatientsController = async (req, res, next) => {
  try {
    const patients = await medicalService.getHospitalPatients(req.user.user_id);
    return sendSuccess(res, { message: 'Hospital patient records retrieved', data: patients });
  } catch (err) {
    next(err);
  }
};

const getHospitalReportsController = async (req, res, next) => {
  try {
    const reports = await medicalService.getHospitalReports(req.user.user_id);
    return sendSuccess(res, { message: 'Hospital medical reports retrieved', data: reports });
  } catch (err) {
    next(err);
  }
};

const getHospitalCasesController = async (req, res, next) => {
  try {
    const cases = await medicalService.getHospitalCases(req.user.user_id);
    return sendSuccess(res, { message: 'Hospital police cases retrieved', data: cases });
  } catch (err) {
    next(err);
  }
};

const getHospitalDocumentsController = async (req, res, next) => {
  try {
    const documents = await medicalService.getHospitalDocuments(req.user.user_id);
    return sendSuccess(res, { message: 'Hospital document archive retrieved', data: documents });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHospitalMlefsController,
  getHospitalJmosController,
  assignMlefController,
  getHospitalPatientsController,
  getHospitalReportsController,
  getHospitalCasesController,
  getHospitalDocumentsController,
};
