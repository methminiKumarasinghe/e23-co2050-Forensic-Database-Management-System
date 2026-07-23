const jmoService = require('../services/jmo.service');
const { sendSuccess, sendCreated, sendBadRequest } = require('../utils/response');

const getAssignedMlefs = async (req, res, next) => {
    try {
        const mlefs = await jmoService.getAssignedMlefs(req.user.user_id);
        return sendSuccess(res, { message: 'Assigned MLEF cases retrieved', data: mlefs });
    } catch (err) {
        next(err);
    }
};

const getMlefPoliceDetails = async (req, res, next) => {
    try {
        const details = await jmoService.getMlefPoliceDetails(req.user.user_id, req.params.id);
        return sendSuccess(res, { message: 'Police MLEF details retrieved', data: details });
    } catch (err) {
        next(err);
    }
};

const submitMlefExamination = async (req, res, next) => {
    try {
        const result = await jmoService.submitMlefExamination(req.user.user_id, req.params.id, req.body);
        return sendCreated(res, { message: 'MLEF examination completed successfully', data: result });
    } catch (err) {
        next(err);
    }
};

const getMlefReport = async (req, res, next) => {
    try {
        const report = await jmoService.getMlefReport(req.user.user_id, req.params.id);
        return sendSuccess(res, { message: 'Full MLEF Report retrieved', data: report });
    } catch (err) {
        next(err);
    }
};

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
    getAssignedMlefs,
    getMlefPoliceDetails,
    submitMlefExamination,
    getMlefReport,
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
