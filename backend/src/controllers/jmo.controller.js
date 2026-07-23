const jmoService = require('../services/jmo.service');
const { sendSuccess, sendCreated, sendBadRequest } = require('../utils/response');

const getLaboratories = async (req, res, next) => {
    try {
        const laboratories = await jmoService.getLaboratories();
        return sendSuccess(res, { message: 'Laboratories retrieved', data: laboratories });
    } catch (err) {
        next(err);
    }
};

const getJmoSpecimens = async (req, res, next) => {
    try {
        const specimens = await jmoService.getJmoSpecimens(req.user.user_id);
        return sendSuccess(res, { message: 'Specimens retrieved', data: specimens });
    } catch (err) {
        next(err);
    }
};

const createLabRequest = async (req, res, next) => {
    try {
        const { specimenId, laboratoryId, testName, priority, clinicalNotes } = req.body;
        if (!specimenId || !laboratoryId) {
            return sendBadRequest(res, 'Specimen and Laboratory are required');
        }

        const request = await jmoService.createLabRequest(req.user.user_id, {
            specimenId, laboratoryId, testName, priority, clinicalNotes
        });

        return sendCreated(res, { message: 'Laboratory request submitted successfully', data: request });
    } catch (err) {
        next(err);
    }
};

const getJmoRequests = async (req, res, next) => {
    try {
        const { search, status, priority } = req.query;
        const requests = await jmoService.getJmoRequests(req.user.user_id, search, { status, priority });
        return sendSuccess(res, { message: 'Laboratory requests retrieved', data: requests });
    } catch (err) {
        next(err);
    }
};

const cancelLabRequest = async (req, res, next) => {
    try {
        const result = await jmoService.cancelLabRequest(req.user.user_id, req.params.id);
        return sendSuccess(res, { message: 'Request cancelled successfully', data: result });
    } catch (err) {
        next(err);
    }
};

const getLabResults = async (req, res, next) => {
    try {
        const { search } = req.query;
        const results = await jmoService.getLabResults(req.user.user_id, search);
        return sendSuccess(res, { message: 'Lab results retrieved', data: results });
    } catch (err) {
        next(err);
    }
};

const getResultById = async (req, res, next) => {
    try {
        const result = await jmoService.getResultById(req.user.user_id, req.params.id);
        return sendSuccess(res, { message: 'Lab result details retrieved', data: result });
    } catch (err) {
        next(err);
    }
};

const getNotifications = async (req, res, next) => {
    try {
        const notifications = await jmoService.getNotifications(req.user.user_id);
        return sendSuccess(res, { message: 'Notifications retrieved', data: notifications });
    } catch (err) {
        next(err);
    }
};

const markNotificationRead = async (req, res, next) => {
    try {
        await jmoService.markNotificationRead(req.user.user_id, req.params.id);
        return sendSuccess(res, { message: 'Notification marked as read' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getLaboratories,
    getJmoSpecimens,
    createLabRequest,
    getJmoRequests,
    cancelLabRequest,
    getLabResults,
    getResultById,
    getNotifications,
    markNotificationRead
};
