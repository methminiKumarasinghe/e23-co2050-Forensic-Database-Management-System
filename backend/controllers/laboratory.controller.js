const service = require('../services/laboratory.service');
const { validationResult } = require('express-validator');

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await service.getDashboardStats(req.user.user_id);
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

const getLabRequests = async (req, res, next) => {
    try {
        const { status, priority, date, limit, offset } = req.query;
        const requests = await service.getLabRequests(req.user.user_id, { status, priority, date, limit, offset });
        res.status(200).json(requests);
    } catch (error) {
        next(error);
    }
};

const getLabRequestById = async (req, res, next) => {
    try {
        const request = await service.getLabRequestById(req.user.user_id, req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.status(200).json(request);
    } catch (error) {
        next(error);
    }
};

const updateRequestStatus = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const updatedRequest = await service.updateRequestStatus(req.user.user_id, req.params.id, req.body.status);
        res.status(200).json(updatedRequest);
    } catch (error) {
        next(error);
    }
};

const getSpecimens = async (req, res, next) => {
    try {
        const specimens = await service.getSpecimens(req.user.user_id);
        res.status(200).json(specimens);
    } catch (error) {
        next(error);
    }
};

const getSpecimenById = async (req, res, next) => {
    try {
        const specimen = await service.getSpecimenById(req.user.user_id, req.params.id);
        if (!specimen) return res.status(404).json({ error: 'Specimen not found' });
        res.status(200).json(specimen);
    } catch (error) {
        next(error);
    }
};

const getTests = async (req, res, next) => {
    try {
        const tests = await service.getTests(req.user.user_id);
        res.status(200).json(tests);
    } catch (error) {
        next(error);
    }
};

const createTest = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const test = await service.createTest(req.user.user_id, req.body);
        res.status(201).json(test);
    } catch (error) {
        next(error);
    }
};

const updateTest = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const test = await service.updateTest(req.user.user_id, req.params.id, req.body);
        res.status(200).json(test);
    } catch (error) {
        next(error);
    }
};

const getResults = async (req, res, next) => {
    try {
        const results = await service.getResults(req.user.user_id);
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
};

const createResult = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const result = await service.createResult(req.user.user_id, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const updateResult = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const result = await service.updateResult(req.user.user_id, req.params.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const uploadAttachment = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const filePath = req.file.path.replace(/\\/g, '/'); // Normalize path for DB
        const attachment = await service.uploadAttachment(req.user.user_id, req.params.id, filePath);
        res.status(201).json({ message: 'File uploaded successfully', attachment });
    } catch (error) {
        next(error);
    }
};

const completeTest = async (req, res, next) => {
    try {
        const test = await service.completeTest(req.user.user_id, req.params.id);
        res.status(200).json({ message: 'Test completed', test });
    } catch (error) {
        next(error);
    }
};

const search = async (req, res, next) => {
    try {
        const { q, limit, offset } = req.query;
        const results = await service.search(req.user.user_id, { query_text: q, limit, offset });
        res.status(200).json(results);
    } catch (error) {
        next(error);
    }
};

const getActivityTimeline = async (req, res, next) => {
    try {
        const activities = await service.getActivityTimeline(req.user.user_id);
        res.status(200).json(activities);
    } catch (error) {
        next(error);
    }
};

module.exports = {
  getDashboardStats,
  getLabRequests, getLabRequestById,
  updateRequestStatus,
  getSpecimens, getSpecimenById,
  getTests, createTest, updateTest,
  getResults, createResult, updateResult,
  uploadAttachment,
  completeTest,
  search,
  getActivityTimeline
};
