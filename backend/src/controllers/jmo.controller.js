const jmoService = require('../services/jmo.service');
const { sendSuccess, sendCreated, sendBadRequest } = require('../utils/response');

const getAutopsyCases = async (req, res, next) => {
    try {
        const cases = await jmoService.getAutopsyCases(req.user.user_id);
        return sendSuccess(res, { message: 'Autopsy cases retrieved', data: cases });
    } catch (err) {
        next(err);
    }
};

const getAutopsyNotification = async (req, res, next) => {
    try {
        const notification = await jmoService.getAutopsyNotification(req.user.user_id, req.params.caseId);
        return sendSuccess(res, { message: 'Autopsy notification retrieved', data: notification });
    } catch (err) {
        next(err);
    }
};

const saveAutopsyNotification = async (req, res, next) => {
    try {
        const result = await jmoService.saveAutopsyNotification(req.user.user_id, req.body);
        return sendCreated(res, { message: 'Health 1328 Autopsy Notification saved successfully', data: result });
    } catch (err) {
        next(err);
    }
};

const getMlrCases = async (req, res, next) => {
    try {
        const cases = await jmoService.getMlrCases(req.user.user_id);
        return sendSuccess(res, { message: 'MLR cases retrieved', data: cases });
    } catch (err) {
        next(err);
    }
};

const getMlrCaseData = async (req, res, next) => {
    try {
        const data = await jmoService.getMlrCaseData(req.user.user_id, req.params.mlefId);
        return sendSuccess(res, { message: 'MLR case details loaded', data });
    } catch (err) {
        next(err);
    }
};

const saveMlrReport = async (req, res, next) => {
    try {
        const report = await jmoService.saveMlrReport(req.user.user_id, req.params.mlefId, req.body);
        return sendCreated(res, { message: 'MLR report saved', data: report });
    } catch (err) {
        next(err);
    }
};

const signMlrReport = async (req, res, next) => {
    try {
        const signedReport = await jmoService.signMlrReport(req.user.user_id, req.params.reportId, req.body);
        return sendSuccess(res, { message: 'MLR report digitally signed successfully', data: signedReport });
    } catch (err) {
        next(err);
    }
};

const getFinalMlrReport = async (req, res, next) => {
    try {
        const report = await jmoService.getFinalMlrReport(req.user.user_id, req.params.reportId);
        return sendSuccess(res, { message: 'Final MLR report retrieved', data: report });
    } catch (err) {
        next(err);
    }
};

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

const getMlrReports = async (req, res, next) => {
    try {
        const reports = await jmoService.getMlrReports(req.user.user_id);
        return sendSuccess(res, { message: 'Medico-Legal Reports retrieved', data: reports });
    } catch (err) {
        next(err);
    }
};

const getAutopsies = async (req, res, next) => {
    try {
        const autopsies = await jmoService.getAutopsies(req.user.user_id);
        return sendSuccess(res, { message: 'Autopsies retrieved', data: autopsies });
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
    getAutopsyCases,
    getAutopsyNotification,
    saveAutopsyNotification,
    getMlrCases,
    getMlrCaseData,
    saveMlrReport,
    signMlrReport,
    getFinalMlrReport,
    getAssignedMlefs,
    getMlefPoliceDetails,
    submitMlefExamination,
    getMlefReport,
    getMlrReports,
    getAutopsies,
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
