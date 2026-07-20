const jmoService = require('../services/jmo.service');
const { validationResult } = require('express-validator');

// Helper to handle validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

// --- MODULE 1: Dashboard ---
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await jmoService.getDashboardStats(req.user.user_id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 2: Assigned MLEF Requests ---
const getMlefRequests = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      date: req.query.date,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };
    const mlefList = await jmoService.getMlefRequests(req.user.user_id, filters);
    res.json(mlefList);
  } catch (error) {
    next(error);
  }
};

const getMlefById = async (req, res, next) => {
  try {
    const mlef = await jmoService.getMlefById(req.user.user_id, req.params.id);
    if (!mlef) return res.status(404).json({ error: 'MLEF request not found or not authorized.' });
    res.json(mlef);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 3: Medical Examination ---
const getExaminations = async (req, res, next) => {
    try {
        const exams = await jmoService.getExaminations(req.user.user_id);
        res.json(exams);
    } catch (error) {
        next(error);
    }
};

const createExamination = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const newExam = await jmoService.createExamination(req.user.user_id, req.body);
    res.status(201).json(newExam);
  } catch (error) {
    next(error);
  }
};

const updateExamination = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const updatedExam = await jmoService.updateExamination(req.user.user_id, req.params.id, req.body);
    if (!updatedExam) return res.status(404).json({ error: 'Examination not found or you are not authorized.' });
    res.json(updatedExam);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 4: Vital Signs ---
const addVitals = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const vitals = await jmoService.addVitals(req.user.user_id, req.params.id, req.body);
    res.status(201).json(vitals);
  } catch (error) {
    next(error);
  }
};

const updateVitals = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const updatedVitals = await jmoService.updateVitals(req.user.user_id, req.params.id, req.body);
    if (!updatedVitals) return res.status(404).json({ error: 'Vitals not found' });
    res.json(updatedVitals);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 5: Injury Management ---
const getInjuries = async (req, res, next) => {
    try {
        const injuries = await jmoService.getInjuries(req.params.id);
        res.json(injuries);
    } catch (error) {
        next(error);
    }
};

const createInjury = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const injury = await jmoService.createInjury(req.user.user_id, req.params.id, req.body);
    res.status(201).json(injury);
  } catch (error) {
    next(error);
  }
};

const updateInjury = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const updatedInjury = await jmoService.updateInjury(req.user.user_id, req.params.id, req.body);
    if (!updatedInjury) return res.status(404).json({ error: 'Injury not found' });
    res.json(updatedInjury);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 6 & 7: Injury Photos & Body Diagrams ---
const uploadInjuryPhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    const uploaded = [];
    for (const file of req.files) {
      const result = await jmoService.uploadInjuryPhoto(req.params.id, file.path, req.body.description);
      uploaded.push(result);
    }
    res.status(201).json(uploaded);
  } catch (error) {
    next(error);
  }
};

const uploadBodyDiagram = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const result = await jmoService.uploadBodyDiagram(req.params.id, req.file.path, req.body.annotation);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 8: Specimen Collection ---
const getSpecimens = async (req, res, next) => {
    try {
        const specimens = await jmoService.getSpecimens(req.params.id);
        res.json(specimens);
    } catch (error) {
        next(error);
    }
};

const createSpecimen = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const specimen = await jmoService.createSpecimen(req.user.user_id, req.params.id, req.body);
    res.status(201).json(specimen);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 9: Laboratory Requests ---
const getLabRequests = async (req, res, next) => {
    try {
        const requests = await jmoService.getLabRequests(req.user.user_id);
        res.json(requests);
    } catch (error) {
        next(error);
    }
};

const createLabRequest = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const request = await jmoService.createLabRequest(req.user.user_id, req.body);
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 10: Laboratory Results ---
const getLabResults = async (req, res, next) => {
    try {
        const results = await jmoService.getLabResults(req.user.user_id);
        res.json(results);
    } catch (error) {
        next(error);
    }
};

const getLabResultById = async (req, res, next) => {
    try {
        const result = await jmoService.getLabResultById(req.user.user_id, req.params.id);
        if (!result) return res.status(404).json({ error: 'Laboratory result not found' });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// --- MODULE 11: Medico-Legal Reports ---
const getReports = async (req, res, next) => {
    try {
        const reports = await jmoService.getReports(req.user.user_id);
        res.json(reports);
    } catch (error) {
        next(error);
    }
};

const getReportById = async (req, res, next) => {
    try {
        const report = await jmoService.getReportById(req.user.user_id, req.params.id);
        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json(report);
    } catch (error) {
        next(error);
    }
};

const createReport = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const report = await jmoService.createReport(req.user.user_id, req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const report = await jmoService.updateReport(req.user.user_id, req.params.id, req.body);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 12: Digital Signature ---
const signReport = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const signature = await jmoService.signReport(req.user.user_id, req.params.id, req.body);
    res.status(201).json(signature);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 13: Appointments ---
const getAppointments = async (req, res, next) => {
    try {
        const appointments = await jmoService.getAppointments(req.user.user_id);
        res.json(appointments);
    } catch (error) {
        next(error);
    }
};

const createAppointment = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const appointment = await jmoService.createAppointment(req.user.user_id, req.body);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const appointment = await jmoService.updateAppointment(req.params.id, req.body);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// --- MODULE 14: Search ---
const search = async (req, res, next) => {
  try {
    const searchParams = {
      query_text: req.query.q,
      date: req.query.date,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };
    const results = await jmoService.search(req.user.user_id, searchParams);
    res.json(results);
  } catch (error) {
    next(error);
  }
};
// --- MODULE 10.5: Autopsy ---
const getPendingAutopsies = async (req, res, next) => {
  try {
    const autopsies = await jmoService.getPendingAutopsies(req.user.user_id);
    res.json(autopsies);
  } catch (error) {
    next(error);
  }
};

const createAutopsyNotification = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const notification = await jmoService.createAutopsyNotification(req.user.user_id, req.body);
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

const updateAutopsyExternal = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const updated = await jmoService.updateAutopsyExternal(req.user.user_id, req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const updateAutopsyInternal = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const updated = await jmoService.updateAutopsyInternal(req.user.user_id, req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const recordCauseOfDeath = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const cod = await jmoService.recordCauseOfDeath(req.user.user_id, req.params.id, req.body);
    res.status(201).json(cod);
  } catch (error) {
    next(error);
  }
};

const generateAutopsyReport = async (req, res, next) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const report = await jmoService.generateAutopsyReport(req.user.user_id, req.params.id, req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getMlefRequests, getMlefById,
  getExaminations, createExamination, updateExamination,
  addVitals, updateVitals,
  getInjuries, createInjury, updateInjury,
  uploadInjuryPhotos, uploadBodyDiagram,
  getSpecimens, createSpecimen,
  getLabRequests, createLabRequest,
  getLabResults, getLabResultById,
  getPendingAutopsies, createAutopsyNotification, updateAutopsyExternal, updateAutopsyInternal, recordCauseOfDeath, generateAutopsyReport,
  getReports, getReportById, createReport, updateReport, signReport,
  getAppointments, createAppointment, updateAppointment,
  search
};
