const repo = require('../repositories/staff.repository');
const pool = require('../database/connection');

const checkStaff = async (userId) => {
    const staff = await repo.getStaffDataByUserId(userId);
    // If not a staff but admin, let them pass with dummy hospital id or null
    // In a real app we'd handle admin separately, but here we enforce staff for these queries
    return staff; 
};

const getDashboardStats = async (userId) => {
    const staff = await checkStaff(userId);
    return await repo.getDashboardStats(staff ? staff.hospital_id : null);
};

const getCases = async (userId, filters) => {
    return await repo.getCases(filters);
};

const getCaseById = async (userId, caseId) => {
    const client = await pool.connect();
    await repo.logActivity(client, userId, 'Case Viewed', 'police_case', caseId, 'Viewed case details.');
    client.release();
    return await repo.getCaseById(caseId);
};

const getCaseTimeline = async (userId, caseId) => {
    return await repo.getCaseTimeline(caseId);
};

const getMlefRequests = async (userId) => {
    return await repo.getMlefRequests();
};

const getMlefById = async (userId, mlefId) => {
    return await repo.getMlefById(mlefId);
};

const getExaminations = async (userId) => {
    return await repo.getExaminations();
};

const getExaminationById = async (userId, examId) => {
    return await repo.getExaminationById(examId);
};

const getLabRequests = async (userId) => {
    return await repo.getLabRequests();
};

const getLabResultById = async (userId, resultId) => {
    return await repo.getLabResultById(resultId);
};

const getDocuments = async (userId) => {
    return await repo.getDocuments();
};

const getDocumentById = async (userId, docId, type) => {
    const client = await pool.connect();
    await repo.logActivity(client, userId, 'Document Accessed', type, docId, 'Accessed forensic document.');
    client.release();
    return await repo.getDocumentById(docId, type);
};

const getAppointments = async (userId) => {
    const staff = await checkStaff(userId);
    if (!staff) throw new Error("Staff profile not found");
    return await repo.getAppointments(staff.hospital_id);
};

const createAppointment = async (userId, apptData) => {
    return await repo.createAppointment(apptData, userId);
};

const updateAppointment = async (userId, apptId, updateData) => {
    return await repo.updateAppointment(apptId, updateData, userId);
};

const getNotifications = async (userId) => {
    return await repo.getNotifications(userId);
};

const markNotificationRead = async (userId, notificationId) => {
    return await repo.markNotificationRead(notificationId, userId);
};

const search = async (userId, queryText) => {
    return await repo.search(queryText);
};

module.exports = {
  getDashboardStats,
  getCases, getCaseById, getCaseTimeline,
  getMlefRequests, getMlefById,
  getExaminations, getExaminationById,
  getLabRequests, getLabResultById,
  getDocuments, getDocumentById,
  getAppointments, createAppointment, updateAppointment,
  getNotifications, markNotificationRead,
  search
};
