import api from './axios';

export const getDashboardStats = () => api.get('/lab/dashboard').then(res => res.data.data);

export const getRequests = (params) => api.get('/lab/requests', { params }).then(res => res.data.data);

export const getRequestById = (id) => api.get(`/lab/request/${id}`).then(res => res.data.data);

export const acceptRequest = (id) => api.put(`/lab/request/${id}/accept`).then(res => res.data.data);

export const rejectRequest = (id) => api.put(`/lab/request/${id}/reject`).then(res => res.data.data);

export const startTest = (id, testName) => api.put(`/lab/request/${id}/start`, { testName }).then(res => res.data.data);

export const submitResult = (formData) => api.post('/lab/result', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    }
}).then(res => res.data.data);

export const getResults = () => api.get('/lab/results').then(res => res.data.data);

export const getResultById = (id) => api.get(`/lab/result/${id}`).then(res => res.data.data);
