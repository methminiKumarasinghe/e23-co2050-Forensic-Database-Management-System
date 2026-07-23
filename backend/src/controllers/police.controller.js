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

const getPoliceDashboardStatsController = async (req, res, next) => {
  try {
    const stats = await policeService.getPoliceDashboardStats(req.user.user_id);
    return sendSuccess(res, {
      message: 'Police dashboard statistics retrieved successfully',
      data: stats,
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

const createPoliceCaseController = async (req, res, next) => {
  try {
    const createdCase = await policeService.createPoliceCase(req.body, req.user.user_id);
    return sendCreated(res, {
      message: `Police case ${createdCase.case_number} created successfully`,
      data: createdCase,
    });
  } catch (err) {
    next(err);
  }
};

const registerPatientController = async (req, res, next) => {
  try {
    const patient = await policeService.registerPatient(req.body, req.user.user_id);
    return sendCreated(res, {
      message: `Patient ${patient.full_name} registered successfully with MRN: ${patient.medical_record_number}`,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
};

const searchPatientsController = async (req, res, next) => {
  try {
    const { search, case_id } = req.query;
    const patients = await policeService.searchPatients(search || '', case_id || null, req.user.user_id);
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

const getCaseDetailsController = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const caseDetails = await policeService.getCaseDetails(caseId);
    return sendSuccess(res, {
      message: 'Case details retrieved successfully',
      data: caseDetails,
    });
  } catch (err) {
    next(err);
  }
};

const addEvidenceController = async (req, res, next) => {
  try {
    const evidence = await policeService.addEvidence(req.body, req.user.user_id);
    return sendCreated(res, {
      message: `Evidence ${evidence.evidence_type} added successfully`,
      data: evidence,
    });
  } catch (err) {
    next(err);
  }
};

const uploadEvidencePhotoController = async (req, res, next) => {
  try {
    const { evidenceId } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo file upload is required',
      });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const photo = await policeService.uploadEvidencePhoto({
      evidence_id: evidenceId,
      file_path: filePath,
      description,
    }, req.user.user_id);

    return sendCreated(res, {
      message: 'Evidence photo uploaded successfully',
      data: photo,
    });
  } catch (err) {
    next(err);
  }
};

const assignOfficerController = async (req, res, next) => {
  try {
    const assignment = await policeService.assignOfficerToCase(req.body, req.user.user_id);
    return sendCreated(res, {
      message: 'Officer assigned to police case successfully',
      data: assignment,
    });
  } catch (err) {
    next(err);
  }
};

const updateCaseStatusController = async (req, res, next) => {
  try {
    const { case_id, status_id } = req.body;
    const updatedCase = await policeService.updateCaseStatus({ case_id, status_id }, req.user.user_id);
    return sendSuccess(res, {
      message: 'Police case status updated successfully',
      data: updatedCase,
    });
  } catch (err) {
    next(err);
  }
};

const getOfficersListController = async (req, res, next) => {
  try {
    const officers = await policeService.getOfficersList(req.user.user_id);
    return sendSuccess(res, {
      message: 'Police officers list retrieved successfully',
      data: officers,
      meta: { count: officers.length },
    });
  } catch (err) {
    next(err);
  }
};

const getOfficerNotificationsController = async (req, res, next) => {
  try {
    const notifications = await policeService.getOfficerNotifications(req.user.user_id);
    return sendSuccess(res, {
      message: 'Notifications retrieved successfully',
      data: notifications,
      meta: { count: notifications.length },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOfficerProfileController,
  getPoliceDashboardStatsController,
  getAssignedCasesController,
  createPoliceCaseController,
  registerPatientController,
  searchPatientsController,
  getHospitalsController,
  createMlefController,
  getMlefsController,
  getCaseDetailsController,
  addEvidenceController,
  uploadEvidencePhotoController,
  assignOfficerController,
  updateCaseStatusController,
  getOfficersListController,
  getOfficerNotificationsController,
};
