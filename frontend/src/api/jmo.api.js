import api from './axios';

export const getLaboratories = () => api.get('/jmo/laboratories').then(res => res.data.data);

export const getJmoSpecimens = () => api.get('/jmo/specimens').then(res => res.data.data);

export const createLabRequest = (data) => api.post('/jmo/laboratory/requests', data).then(res => res.data.data);

export const getJmoRequests = (params) => api.get('/jmo/laboratory/requests', { params }).then(res => res.data.data);

export const cancelLabRequest = (id) => api.put(`/jmo/laboratory/request/${id}/cancel`).then(res => res.data.data);

export const getLabResults = (params) => api.get('/jmo/lab-results', { params }).then(res => res.data.data);

export const getResultById = (id) => api.get(`/jmo/lab-result/${id}`).then(res => res.data.data);

export const getNotifications = () => api.get('/jmo/notifications').then(res => res.data.data);

export const markNotificationRead = (id) => api.put(`/jmo/notification/${id}/read`).then(res => res.data.data);
