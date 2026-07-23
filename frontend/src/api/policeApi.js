import api from './axios';

export const getOfficerProfile = async () => {
  const response = await api.get('/police/me');
  return response.data;
};

export const getAssignedCases = async () => {
  const response = await api.get('/police/cases');
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

export const createMlef = async (mlefData) => {
  const response = await api.post('/police/mlef', mlefData);
  return response.data;
};

export const getOfficerMlefs = async () => {
  const response = await api.get('/police/mlef');
  return response.data;
};
