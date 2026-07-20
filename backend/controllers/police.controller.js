const { validationResult } = require('express-validator');
const policeService = require('../services/police.service');

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await policeService.getDashboardStats(req.user.user_id);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

const createCase = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const newCase = await policeService.createCase(req.body, req.user.user_id);
    res.status(201).json(newCase);
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Case number already exists.' });
    }
    next(error);
  }
};

const getCases = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      case_type: req.query.case_type,
      station_id: req.query.station_id,
      date: req.query.date
    };
    const cases = await policeService.getCases(req.user.user_id, filters);
    res.status(200).json(cases);
  } catch (error) {
    next(error);
  }
};

const getCaseById = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const caseItem = await policeService.getCaseById(req.params.id);
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });
    res.status(200).json(caseItem);
  } catch (error) {
    next(error);
  }
};

const updateCase = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const updatedCase = await policeService.updateCase(req.params.id, req.body, req.user.user_id);
    if (!updatedCase) return res.status(404).json({ error: 'Case not found or no updates provided' });
    res.status(200).json(updatedCase);
  } catch (error) {
    next(error);
  }
};

const assignOfficer = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { officer_id, assignment_role } = req.body;
    const assignment = await policeService.assignOfficer(req.params.id, officer_id, assignment_role, req.user.user_id);
    res.status(201).json(assignment);
  } catch (error) {
    if (error.message.includes('already assigned')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

const getCaseOfficers = async (req, res, next) => {
  try {
    const officers = await policeService.getCaseOfficers(req.params.id);
    res.status(200).json(officers);
  } catch (error) {
    next(error);
  }
};

const getIncidents = async (req, res, next) => {
  try {
    const incidents = await policeService.getIncidents(req.params.id);
    res.status(200).json(incidents);
  } catch (error) {
    next(error);
  }
};

const createIncident = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const incident = await policeService.createIncident(req.params.id, req.body, req.user.user_id);
    res.status(201).json(incident);
  } catch (error) {
    next(error);
  }
};

const updateIncident = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const incident = await policeService.updateIncident(req.params.id, req.body);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.status(200).json(incident);
  } catch (error) {
    next(error);
  }
};

const getEvidence = async (req, res, next) => {
  try {
    const evidence = await policeService.getEvidence(req.params.id);
    res.status(200).json(evidence);
  } catch (error) {
    next(error);
  }
};

const createEvidence = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const evidence = await policeService.createEvidence(req.params.id, req.body, req.user.user_id);
    res.status(201).json(evidence);
  } catch (error) {
    next(error);
  }
};

const updateEvidence = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const evidence = await policeService.updateEvidence(req.params.id, req.body);
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' });
    res.status(200).json(evidence);
  } catch (error) {
    next(error);
  }
};

const uploadEvidencePhotos = async (req, res, next) => {
  try {
    // files are populated by multer middleware
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const uploadedPhotos = [];
    for (const file of req.files) {
      const photo = await policeService.addEvidencePhoto(req.params.id, file.path, req.user.user_id, req.body.description);
      uploadedPhotos.push(photo);
    }
    res.status(201).json(uploadedPhotos);
  } catch (error) {
    next(error);
  }
};

const getChainOfCustody = async (req, res, next) => {
  try {
    const chain = await policeService.getChainOfCustody(req.params.id);
    res.status(200).json(chain);
  } catch (error) {
    next(error);
  }
};

const transferEvidence = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const transfer = await policeService.transferEvidence(req.params.id, req.body, req.user.user_id);
    res.status(201).json(transfer);
  } catch (error) {
    next(error);
  }
};

const getMlefRequests = async (req, res, next) => {
  try {
    const requests = await policeService.getMlefRequests(req.user.user_id);
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

const getMlefById = async (req, res, next) => {
  try {
    const mlef = await policeService.getMlefById(req.params.id);
    if (!mlef) return res.status(404).json({ error: 'MLEF not found' });
    res.status(200).json(mlef);
  } catch (error) {
    next(error);
  }
};

const createMlefRequest = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const mlef = await policeService.createMlefRequest(req.body, req.user.user_id);
    res.status(201).json(mlef);
  } catch (error) {
    next(error);
  }
};

const getCaseTimeline = async (req, res, next) => {
  try {
    const timeline = await policeService.getCaseTimeline(req.params.id);
    res.status(200).json(timeline);
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const searchParams = {
      case_number: req.query.case_number,
      patient_name: req.query.patient_name,
      nic: req.query.nic,
      station_id: req.query.station_id,
      date: req.query.date,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };
    const results = await policeService.search(req.user.user_id, searchParams);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

const getCourtHearings = async (req, res, next) => {
  try {
    const hearings = await policeService.getCourtHearings(req.params.id);
    res.status(200).json(hearings);
  } catch (error) {
    next(error);
  }
};

const createCourtHearing = async (req, res, next) => {
  try {
    const hearing = await policeService.createCourtHearing(req.params.id, req.body, req.user.user_id);
    res.status(201).json(hearing);
  } catch (error) {
    next(error);
  }
};

const getReportsStatus = async (req, res, next) => {
  try {
    const reports = await policeService.getReportsStatus(req.user.user_id);
    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  createCase, getCases, getCaseById, updateCase,
  assignOfficer, getCaseOfficers,
  getIncidents, createIncident, updateIncident,
  getEvidence, createEvidence, updateEvidence,
  uploadEvidencePhotos,
  getChainOfCustody, transferEvidence,
  getMlefRequests, getMlefById, createMlefRequest,
  getCaseTimeline,
  search,
  getCourtHearings, createCourtHearing,
  getReportsStatus
};
