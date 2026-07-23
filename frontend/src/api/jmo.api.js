import api from './axios';

export const getLabResults = (params) => api.get('/jmo/lab-results', { params }).then(res => res.data.data);

export const getResultById = (id) => api.get(`/jmo/lab-result/${id}`).then(res => res.data.data);

export const getNotifications = () => api.get('/jmo/notifications').then(res => res.data.data);

export const markNotificationRead = (id) => api.put(`/jmo/notification/${id}/read`).then(res => res.data.data);
