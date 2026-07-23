import api from './axios';

/**
 * Fetch all MLEF requisitions sent to the user's hospital
 */
export const getHospitalMlefs = async () => {
  const response = await api.get('/medical/mlefs');
  return response.data;
};

/**
 * Fetch all available Judicial Medical Officers (JMOs) for the hospital
 */
export const getHospitalJmos = async () => {
  const response = await api.get('/medical/jmos');
  return response.data;
};

/**
 * Assign an MLEF requisition to an available JMO
 */
export const assignMlefToJmo = async (mlefId, jmoId) => {
  const response = await api.post('/medical/assign', {
    mlef_id: mlefId,
    jmo_id: jmoId,
  });
  return response.data;
};
