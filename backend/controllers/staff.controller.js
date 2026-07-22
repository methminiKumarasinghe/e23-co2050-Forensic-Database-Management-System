const service = require('../services/staff.service');
const { validationResult } = require('express-validator');

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await service.getDashboardStats(req.user.user_id);
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

const createPatient = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const patient = await service.createPatient(req.user.user_id, req.body);
        res.status(201).json(patient);
    } catch (error) {
        next(error);
    }
};

const getPatients = async (req, res, next) => {
    try {
        const patients = await service.getPatients(req.user.user_id);
        res.status(200).json(patients);
    } catch (error) {
        next(error);
    }
};

const getPatientById = async (req, res, next) => {
    try {
        const patient = await service.getPatientById(req.user.user_id, req.params.id);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.status(200).json(patient);
    } catch (error) {
        next(error);
    }
};

const createDeceased = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const deceased = await service.createDeceased(req.user.user_id, req.body);
        res.status(201).json(deceased);
    } catch (error) {
        next(error);
    }
};

const getDeceased = async (req, res, next) => {
    try {
        const deceased = await service.getDeceased(req.user.user_id);
        res.status(200).json(deceased);
    } catch (error) {
        next(error);
    }
};

const getDeceasedById = async (req, res, next) => {
    try {
        const deceased = await service.getDeceasedById(req.user.user_id, req.params.id);
        if (!deceased) return res.status(404).json({ error: 'Deceased person not found' });
        res.status(200).json(deceased);
    } catch (error) {
        next(error);
    }
};

const createMlef = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const mlef = await service.createMlef(req.user.user_id, req.body);
        res.status(201).json(mlef);
    } catch (error) {
        next(error);
    }
};

const getHospitals = async (req, res, next) => {
    try {
        const hospitals = await service.getHospitals();
        res.status(200).json(hospitals);
    } catch (error) {
        next(error);
    }
};

const getAvailableJmo = async (req, res, next) => {
    try {
        const jmos = await service.getAvailableJmo();
        res.status(200).json(jmos);
    } catch (error) {
        next(error);
    }
};

const assignJmoToCase = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const result = await service.assignJmoToCase(req.user.user_id, req.params.caseId, req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getCases = async (req, res, next) => {
    try {
        const { case_number, date_range, status, station } = req.query;
        const cases = await service.getCases(req.user.user_id, { case_number, date_range, status, station });
        res.status(200).json(cases);
    } catch (error) {
        next(error);
    }
};

const getCaseById = async (req, res, next) => {
    try {
        const c = await service.getCaseById(req.user.user_id, req.params.id);
        if (!c) return res.status(404).json({ error: 'Case not found' });
        res.status(200).json(c);
    } catch (error) {
        next(error);
    }
};

const getCaseTimeline = async (req, res, next) => {
    try {
        const timeline = await service.getCaseTimeline(req.user.user_id, req.params.id);
        res.status(200).json(timeline);
    } catch (error) {
        next(error);
    }
};

const getMlefRequests = async (req, res, next) => {
    try {
        const mlef = await service.getMlefRequests(req.user.user_id);
        res.status(200).json(mlef);
    } catch (error) {
        next(error);
    }
};

const getMlefById = async (req, res, next) => {
    try {
        const mlef = await service.getMlefById(req.user.user_id, req.params.id);
        if (!mlef) return res.status(404).json({ error: 'MLEF not found' });
        res.status(200).json(mlef);
    } catch (error) {
        next(error);
    }
};

const getExaminations = async (req, res, next) => {
    try {
        const exams = await service.getExaminations(req.user.user_id);
        res.status(200).json(exams);
    } catch (error) {
        next(error);
    }
};

const getExaminationById = async (req, res, next) => {
    try {
        const exam = await service.getExaminationById(req.user.user_id, req.params.id);
        if (!exam) return res.status(404).json({ error: 'Examination not found' });
        res.status(200).json(exam);
    } catch (error) {
        next(error);
    }
};

const getLabRequests = async (req, res, next) => {
    try {
        const requests = await service.getLabRequests(req.user.user_id);
        res.status(200).json(requests);
    } catch (error) {
        next(error);
    }
};

const getLabResultById = async (req, res, next) => {
    try {
        const result = await service.getLabResultById(req.user.user_id, req.params.id);
        if (!result) return res.status(404).json({ error: 'Result not found' });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getDocuments = async (req, res, next) => {
    try {
        const docs = await service.getDocuments(req.user.user_id);
        res.status(200).json(docs);
    } catch (error) {
        next(error);
    }
};

const getDocumentById = async (req, res, next) => {
    try {
        const doc = await service.getDocumentById(req.user.user_id, req.params.id, req.query.type);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.status(200).json(doc);
    } catch (error) {
        next(error);
    }
};

const getAppointments = async (req, res, next) => {
    try {
        const appts = await service.getAppointments(req.user.user_id);
        res.status(200).json(appts);
    } catch (error) {
        next(error);
    }
};

const createAppointment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const appt = await service.createAppointment(req.user.user_id, req.body);
        res.status(201).json(appt);
    } catch (error) {
        next(error);
    }
};

const updateAppointment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const appt = await service.updateAppointment(req.user.user_id, req.params.id, req.body);
        res.status(200).json(appt);
    } catch (error) {
        next(error);
    }
};

const getNotifications = async (req, res, next) => {
    try {
        const notifications = await service.getNotifications(req.user.user_id);
        res.status(200).json(notifications);
    } catch (error) {
        next(error);
    }
};

const markNotificationRead = async (req, res, next) => {
    try {
        const notif = await service.markNotificationRead(req.user.user_id, req.params.id);
        res.status(200).json(notif);
    } catch (error) {
        next(error);
    }
};

const search = async (req, res, next) => {
    try {
        const { q } = req.query;
        const results = await service.search(req.user.user_id, q);
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
};

module.exports = {
  getDashboardStats,
  createPatient, getPatients, getPatientById,
  createDeceased, getDeceased, getDeceasedById,
  createMlef, getHospitals,
  getAvailableJmo, assignJmoToCase,
  getCases, getCaseById, getCaseTimeline,
  getMlefRequests, getMlefById,
  getExaminations, getExaminationById,
  getLabRequests, getLabResultById,
  getDocuments, getDocumentById,
  getAppointments, createAppointment, updateAppointment,
  getNotifications, markNotificationRead,
  search
};
