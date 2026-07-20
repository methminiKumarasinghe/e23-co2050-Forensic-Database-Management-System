const policeRepo = require('../repositories/police.repository');

const getOfficerId = async (userId) => {
  const officerId = await policeRepo.getOfficerIdByUserId(userId);
  if (!officerId) throw new Error('User is not mapped to a Police Officer profile.');
  return officerId;
};

const getDashboardStats = async (userId) => {
  const officerId = await getOfficerId(userId);
  return await policeRepo.getDashboardStats(officerId);
};

const createCase = async (caseData, userId) => {
  return await policeRepo.createCase(caseData, userId);
};

const getCases = async (userId, filters) => {
  const officerId = await getOfficerId(userId);
  return await policeRepo.getCases(officerId, filters);
};

const getCaseById = async (caseId) => {
  return await policeRepo.getCaseById(caseId);
};

const updateCase = async (caseId, updateData, userId) => {
  return await policeRepo.updateCase(caseId, updateData, userId);
};

const assignOfficer = async (caseId, officerIdToAssign, role, userId) => {
  return await policeRepo.assignOfficer(caseId, officerIdToAssign, role, userId);
};

const getCaseOfficers = async (caseId) => {
  return await policeRepo.getCaseOfficers(caseId);
};

const getIncidents = async (caseId) => {
  return await policeRepo.getIncidents(caseId);
};

const createIncident = async (caseId, incidentData, userId) => {
  return await policeRepo.createIncident(caseId, incidentData, userId);
};

const updateIncident = async (incidentId, incidentData) => {
  return await policeRepo.updateIncident(incidentId, incidentData);
};

const getEvidence = async (caseId) => {
  return await policeRepo.getEvidence(caseId);
};

const createEvidence = async (caseId, evidenceData, userId) => {
  const officerId = await getOfficerId(userId);
  return await policeRepo.createEvidence(caseId, evidenceData, officerId, userId);
};

const updateEvidence = async (evidenceId, evidenceData) => {
  return await policeRepo.updateEvidence(evidenceId, evidenceData);
};

const addEvidencePhoto = async (evidenceId, filePath, userId, description) => {
  return await policeRepo.addEvidencePhoto(evidenceId, filePath, userId, description);
};

const getChainOfCustody = async (evidenceId) => {
  return await policeRepo.getChainOfCustody(evidenceId);
};

const transferEvidence = async (evidenceId, transferData, userId) => {
  return await policeRepo.transferEvidence(evidenceId, transferData, userId);
};

const getMlefRequests = async (userId) => {
  const officerId = await getOfficerId(userId);
  return await policeRepo.getMlefRequests(officerId);
};

const getMlefById = async (mlefId) => {
  return await policeRepo.getMlefById(mlefId);
};

const createMlefRequest = async (mlefData, userId) => {
  const officerId = await getOfficerId(userId);
  return await policeRepo.createMlefRequest(mlefData, officerId, userId);
};

const getCaseTimeline = async (caseId) => {
  return await policeRepo.getCaseTimeline(caseId);
};

const search = async (userId, searchParams) => {
  const officerId = await getOfficerId(userId);
  return await policeRepo.search(officerId, searchParams);
};

module.exports = {
  getDashboardStats,
  createCase, getCases, getCaseById, updateCase,
  assignOfficer, getCaseOfficers,
  getIncidents, createIncident, updateIncident,
  getEvidence, createEvidence, updateEvidence,
  addEvidencePhoto,
  getChainOfCustody, transferEvidence,
  getMlefRequests, getMlefById, createMlefRequest,
  getCaseTimeline,
  search
};
