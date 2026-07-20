const jmoRepository = require('../repositories/jmo.repository');

const getJmoData = async (userId) => {
  const jmo = await jmoRepository.getJmoDataByUserId(userId);
  if (!jmo) {
    throw new Error('JMO profile not found for the user');
  }
  return jmo;
};

const getDashboardStats = async (userId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getDashboardStats(jmo.jmo_id, jmo.hospital_id);
};

const getMlefRequests = async (userId, filters) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getMlefRequests(jmo.hospital_id, filters);
};

const getMlefById = async (userId, mlefId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getMlefById(mlefId, jmo.hospital_id);
};

const getExaminations = async (userId) => {
    const jmo = await getJmoData(userId);
    return await jmoRepository.getExaminations(jmo.jmo_id);
};

const createExamination = async (userId, examData) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.createExamination(examData, jmo.jmo_id, userId);
};

const updateExamination = async (userId, examinationId, updateData) => {
  return await jmoRepository.updateExamination(examinationId, updateData, userId);
};

const addVitals = async (userId, examinationId, vitalsData) => {
  return await jmoRepository.addVitals(examinationId, vitalsData);
};

const updateVitals = async (userId, vitalSignId, updateData) => {
  return await jmoRepository.updateVitals(vitalSignId, updateData);
};

const getInjuries = async (examinationId) => {
  return await jmoRepository.getInjuries(examinationId);
};

const createInjury = async (userId, examinationId, injuryData) => {
  return await jmoRepository.createInjury(examinationId, injuryData, userId);
};

const updateInjury = async (userId, injuryId, updateData) => {
  return await jmoRepository.updateInjury(injuryId, updateData, userId);
};

const uploadInjuryPhoto = async (injuryId, filePath, description) => {
  return await jmoRepository.uploadInjuryPhoto(injuryId, filePath, description);
};

const uploadBodyDiagram = async (injuryId, filePath, annotation) => {
  return await jmoRepository.uploadBodyDiagram(injuryId, filePath, annotation);
};

const getSpecimens = async (examinationId) => {
  return await jmoRepository.getSpecimens(examinationId);
};

const createSpecimen = async (userId, examinationId, specimenData) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.createSpecimen(examinationId, specimenData, jmo.jmo_id, userId);
};

const getLabRequests = async (userId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getLabRequests(jmo.jmo_id);
};

const createLabRequest = async (userId, requestData) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.createLabRequest(requestData, jmo.jmo_id, userId);
};

const getLabResults = async (userId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getLabResults(jmo.jmo_id);
};

const getLabResultById = async (userId, resultId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getLabResultById(resultId, jmo.jmo_id);
};

const getReports = async (userId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getReports(jmo.jmo_id);
};

const getReportById = async (userId, reportId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getReportById(reportId, jmo.jmo_id);
};

const createReport = async (userId, reportData) => {
  return await jmoRepository.createReport(reportData, userId);
};

const updateReport = async (userId, reportId, updateData) => {
  return await jmoRepository.updateReport(reportId, updateData, userId);
};

const signReport = async (userId, reportId, signatureData) => {
  return await jmoRepository.signReport(reportId, signatureData, userId);
};

const getAppointments = async (userId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getAppointments(jmo.jmo_id);
};

const createAppointment = async (userId, appointmentData) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.createAppointment(appointmentData, jmo.jmo_id);
};

const updateAppointment = async (appointmentId, updateData) => {
  return await jmoRepository.updateAppointment(appointmentId, updateData);
};

const search = async (userId, searchParams) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.search(jmo.jmo_id, jmo.hospital_id, searchParams);
};

// --- MODULE 10.5: Autopsy ---
const getPendingAutopsies = async (userId) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.getPendingAutopsies(jmo.jmo_id, jmo.hospital_id);
};

const createAutopsyNotification = async (userId, data) => {
  const jmo = await getJmoData(userId);
  return await jmoRepository.createAutopsyNotification(jmo.jmo_id, jmo.hospital_id, data, userId);
};

const updateAutopsyExternal = async (userId, autopsyId, data) => {
  return await jmoRepository.updateAutopsyExternal(autopsyId, data, userId);
};

const updateAutopsyInternal = async (userId, autopsyId, data) => {
  return await jmoRepository.updateAutopsyInternal(autopsyId, data, userId);
};

const recordCauseOfDeath = async (userId, autopsyId, data) => {
  return await jmoRepository.recordCauseOfDeath(autopsyId, data, userId);
};

const generateAutopsyReport = async (userId, autopsyId, data) => {
  return await jmoRepository.generateAutopsyReport(autopsyId, data, userId);
};

module.exports = {
  getDashboardStats,
  getMlefRequests, getMlefById,
  getExaminations, createExamination, updateExamination,
  addVitals, updateVitals,
  getInjuries, createInjury, updateInjury,
  uploadInjuryPhoto, uploadBodyDiagram,
  getSpecimens, createSpecimen,
  getLabRequests, createLabRequest,
  getLabResults, getLabResultById,
  getPendingAutopsies, createAutopsyNotification, updateAutopsyExternal, updateAutopsyInternal, recordCauseOfDeath, generateAutopsyReport,
  getReports, getReportById, createReport, updateReport, signReport,
  getAppointments, createAppointment, updateAppointment,
  search
};
