import api from './axios';

export const getOfficerProfile = async () => {
  const response = await api.get('/police/me');
  return response.data;
};

export const getPoliceStats = async () => {
  const response = await api.get('/police/stats');
  return response.data;
};

export const getAssignedCases = async () => {
  const response = await api.get('/police/cases');
  return response.data;
};

export const createPoliceCase = async (caseData) => {
  const response = await api.post('/police/cases', caseData);
  return response.data;
};

export const getCaseDetails = async (caseId) => {
  const response = await api.get(`/police/cases/${caseId}`);
  return response.data;
};

export const assignOfficerToCase = async (assignmentData) => {
  const response = await api.post('/police/cases/assign', assignmentData);
  return response.data;
};

export const updateCaseStatus = async (statusData) => {
  const response = await api.post('/police/cases/status', statusData);
  return response.data;
};

export const registerPatient = async (patientData) => {
  const response = await api.post('/police/patients', patientData);
  return response.data;
};

export const searchPatients = async (search = '', caseId = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (caseId) params.append('case_id', caseId);
  const response = await api.get(`/police/patients?${params.toString()}`);
  return response.data;
};

export const getHospitals = async () => {
  const response = await api.get('/police/hospitals');
  return response.data;
};

export const getOfficersList = async () => {
  const response = await api.get('/police/officers');
  return response.data;
};

export const createMlef = async (mlefData) => {
  const response = await api.post('/police/mlef', mlefData);
  return response.data;
};

export const getOfficerMlefs = async () => {
  const response = await api.get('/police/mlef');
  return response.data;
};

export const addEvidence = async (evidenceData) => {
  const response = await api.post('/police/evidence', evidenceData);
  return response.data;
};

export const uploadEvidencePhoto = async (evidenceId, formData) => {
  const response = await api.post(`/police/evidence/${evidenceId}/photos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
