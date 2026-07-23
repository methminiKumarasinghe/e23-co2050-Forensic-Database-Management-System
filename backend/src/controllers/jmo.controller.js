const jmoService = require('../services/jmo.service');
const { sendSuccess } = require('../utils/response');

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
    getLabResults,
    getResultById,
    getNotifications,
    markNotificationRead
};
