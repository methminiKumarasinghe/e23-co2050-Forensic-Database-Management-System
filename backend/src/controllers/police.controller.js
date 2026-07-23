const { sendSuccess, sendCreated } = require('../utils/response');
const policeService = require('../services/police.service');

const getOfficerProfileController = async (req, res, next) => {
  try {
    const profile = await policeService.getOfficerProfile(req.user.user_id);
    return sendSuccess(res, {
      message: 'Officer profile retrieved successfully',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

const getAssignedCasesController = async (req, res, next) => {
  try {
    const profile = await policeService.getOfficerProfile(req.user.user_id);
    const cases = await policeService.getAssignedCases(req.user.user_id, profile.officer_id, profile.station_id);
    return sendSuccess(res, {
      message: 'Assigned police cases retrieved successfully',
      data: cases,
      meta: { count: cases.length },
    });
  } catch (err) {
    next(err);
  }
};

const searchPatientsController = async (req, res, next) => {
  try {
    const { search, case_id } = req.query;
    const patients = await policeService.searchPatients(search || '', case_id || null);
    return sendSuccess(res, {
      message: 'Patients retrieved successfully',
      data: patients,
      meta: { count: patients.length },
    });
  } catch (err) {
    next(err);
  }
};

const getHospitalsController = async (req, res, next) => {
  try {
    const hospitals = await policeService.getHospitalsWithForensicUnit();
    return sendSuccess(res, {
      message: 'Hospitals list retrieved successfully',
      data: hospitals,
      meta: { count: hospitals.length },
    });
  } catch (err) {
    next(err);
  }
};

const createMlefController = async (req, res, next) => {
  try {
    const result = await policeService.createMlefRecord(req.body, req.user.user_id);
    return sendCreated(res, {
      message: `MLEF successfully ${req.body.is_draft ? 'saved as draft' : 'submitted'}. Formatted ID: ${result.formatted_mlef_id}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getMlefsController = async (req, res, next) => {
  try {
    const mlefs = await policeService.getOfficerMlefs(req.user.user_id);
    return sendSuccess(res, {
      message: 'Issued MLEFs retrieved successfully',
      data: mlefs,
      meta: { count: mlefs.length },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOfficerProfileController,
  getAssignedCasesController,
  searchPatientsController,
  getHospitalsController,
  createMlefController,
  getMlefsController,
};
