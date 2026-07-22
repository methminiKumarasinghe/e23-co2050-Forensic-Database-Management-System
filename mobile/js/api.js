/**
 * api.js
 * Unified DFMIS API Client Utility
 * Handles token inclusion, automatic base URL determination, and authentication redirects.
 */

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://forensic-website.azurewebsites.net';

window.API = {
  getHeaders() {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      // Session expired or unauthorized role access
      const depth = window.location.pathname.includes('/pages/police/') || window.location.pathname.includes('/pages/jmo/') ? '../../' : '../';
      if (sessionStorage.getItem('loggedIn') === 'true') {
        sessionStorage.clear();
        alert('Session expired or access denied. Redirecting to login.');
        window.location.href = `${depth}index.html`;
      }
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    return response.json();
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // Helper for uploading files using FormData (where boundary header must be determined by the browser)
  async postMultipart(endpoint, formData) {
    const url = `${API_URL}${endpoint}`;
    const token = sessionStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    if (response.status === 401 || response.status === 403) {
      const depth = window.location.pathname.includes('/pages/police/') || window.location.pathname.includes('/pages/jmo/') ? '../../' : '../';
      if (sessionStorage.getItem('loggedIn') === 'true') {
        sessionStorage.clear();
        alert('Session expired or access denied. Redirecting to login.');
        window.location.href = `${depth}index.html`;
      }
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    return response.json();
  }
};
