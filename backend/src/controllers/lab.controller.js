const labService = require('../services/lab.service');
const { sendSuccess, sendError, sendBadRequest, sendCreated } = require('../utils/response');

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await labService.getDashboardStats(req.user.user_id);
        return sendSuccess(res, { message: 'Dashboard stats retrieved', data: stats });
    } catch (err) {
        next(err);
    }
};

const getRequests = async (req, res, next) => {
    try {
        const { status, priority, search } = req.query;
        const requests = await labService.getRequests(req.user.user_id, { status, priority }, search);
        return sendSuccess(res, { message: 'Requests retrieved', data: requests });
    } catch (err) {
        next(err);
    }
};

const getRequestById = async (req, res, next) => {
    try {
        const requestDetails = await labService.getRequestById(req.user.user_id, req.params.id);
        return sendSuccess(res, { message: 'Request details retrieved', data: requestDetails });
    } catch (err) {
        next(err);
    }
};

const acceptRequest = async (req, res, next) => {
    try {
        const result = await labService.updateRequestStatus(req.user.user_id, req.params.id, 'ACCEPTED');
        return sendSuccess(res, { message: 'Request accepted', data: result });
    } catch (err) {
        next(err);
    }
};

const rejectRequest = async (req, res, next) => {
    try {
        const result = await labService.updateRequestStatus(req.user.user_id, req.params.id, 'REJECTED');
        return sendSuccess(res, { message: 'Request rejected', data: result });
    } catch (err) {
        next(err);
    }
};

const startTest = async (req, res, next) => {
    try {
        const { testName } = req.body;
        if (!testName) return sendBadRequest(res, 'testName is required');
        const result = await labService.startTest(req.user.user_id, req.params.id, testName);
        return sendSuccess(res, { message: 'Test started', data: result });
    } catch (err) {
        next(err);
    }
};

const submitResult = async (req, res, next) => {
    try {
        const { requestId, testName, findings, interpretation, comments } = req.body;
        if (!requestId || !testName || !findings) {
            return sendBadRequest(res, 'requestId, testName, and findings are required');
        }

        const result = await labService.submitResult(req.user.user_id, {
            requestId, testName, findings, interpretation, comments
        }, req.files);

        return sendCreated(res, { message: 'Result submitted successfully', data: result });
    } catch (err) {
        next(err);
    }
};

const getResults = async (req, res, next) => {
    try {
        const results = await labService.getResults(req.user.user_id);
        return sendSuccess(res, { message: 'Results retrieved', data: results });
    } catch (err) {
        next(err);
    }
};

const getResultById = async (req, res, next) => {
    try {
        const result = await labService.getResultById(req.user.user_id, req.params.id);
        return sendSuccess(res, { message: 'Result details retrieved', data: result });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboardStats,
    getRequests,
    getRequestById,
    acceptRequest,
    rejectRequest,
    startTest,
    submitResult,
    getResults,
    getResultById
};
