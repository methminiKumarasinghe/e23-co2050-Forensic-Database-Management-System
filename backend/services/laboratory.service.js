const repo = require('../repositories/laboratory.repository');

const getDashboardStats = async (userId) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getDashboardStats(tech.hospital_id);
};

const getLabRequests = async (userId, filters) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getLabRequests(tech.hospital_id, filters);
};

const getLabRequestById = async (userId, requestId) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getLabRequestById(requestId, tech.hospital_id);
};

const updateRequestStatus = async (userId, requestId, status) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.updateRequestStatus(requestId, status, tech.technician_id, userId);
};

const getSpecimens = async (userId) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getSpecimens(tech.hospital_id);
};

const getSpecimenById = async (userId, specimenId) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getSpecimenById(specimenId, tech.hospital_id);
};

const getTests = async (userId) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getTests(tech.hospital_id);
};

const createTest = async (userId, testData) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.createTest(testData, tech.technician_id, userId);
};

const updateTest = async (userId, testId, updateData) => {
    return await repo.updateTest(testId, updateData, userId);
};

const getResults = async (userId) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getResults(tech.hospital_id);
};

const createResult = async (userId, resultData) => {
    return await repo.createResult(resultData, userId);
};

const updateResult = async (userId, resultId, updateData) => {
    return await repo.updateResult(resultId, updateData, userId);
};

const uploadAttachment = async (userId, resultId, filePath) => {
    return await repo.uploadAttachment(resultId, filePath, userId);
};

const completeTest = async (userId, testId) => {
    return await repo.completeTest(testId, userId);
};

const search = async (userId, filters) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.search(tech.hospital_id, filters);
};

const getActivityTimeline = async (userId) => {
    const tech = await repo.getTechnicianDataByUserId(userId);
    if (!tech) throw new Error("Technician profile not found.");
    return await repo.getActivityTimeline(tech.hospital_id);
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
