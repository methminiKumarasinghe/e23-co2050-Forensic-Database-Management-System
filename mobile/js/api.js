/**
 * Digital Forensic Medical Information System
 * Reusable utility for handling frontend API calls.
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://forensic-website.azurewebsites.net';

function getAuthToken() {
  return sessionStorage.getItem('token') || sessionStorage.getItem('jwt_token');
}

function getLoginRedirectDepth() {
  return window.location.pathname.includes('/pages/police/') || window.location.pathname.includes('/pages/jmo/') ? '../../' : '../';
}

function handleUnauthorized() {
  if (sessionStorage.getItem('loggedIn') === 'true') {
    sessionStorage.clear();
    alert('Session expired or access denied. Redirecting to login.');
    window.location.href = `${getLoginRedirectDepth()}index.html`;
  }
}

async function readResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    return;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP Error ${response.status}`);
  }

  return readResponse(response);
}

window.API = {
  getHeaders() {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  request,

  get(endpoint) {
    return request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return request(endpoint, { method: 'DELETE' });
  },

  async postMultipart(endpoint, formData) {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP Error ${response.status}`);
    }

    return readResponse(response);
  }
};

async function fetchAPI(endpoint, options = {}) {
  try {
    return await request(endpoint, options);
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

function setTableLoading(containerId, isLoading) {
  let container = document.getElementById(containerId);
  if (!container) return;
  if (container.tagName !== 'TBODY') {
    const tbody = container.querySelector('tbody');
    if (tbody) container = tbody;
  }

  if (isLoading) {
    if (container.tagName === 'TBODY') {
      container.innerHTML = `<tr><td colspan="100" style="text-align: center; padding: 2rem; color: #666;"><div class="spinner" style="font-size: 2rem; margin-bottom: 1rem;">⏳</div><p>Loading data...</p></td></tr>`;
    } else {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #666;">
            <div class="spinner" style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <p>Loading data...</p>
        </div>
      `;
    }
  }
}

function setTableEmpty(containerId, message = 'No records found.') {
  let container = document.getElementById(containerId);
  if (!container) return;
  if (container.tagName !== 'TBODY') {
    const tbody = container.querySelector('tbody');
    if (tbody) container = tbody;
  }

  if (container.tagName === 'TBODY') {
    container.innerHTML = `<tr><td colspan="100" style="text-align: center; padding: 2rem; color: #666;">${message}</td></tr>`;
  } else {
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #666;">
            <p>${message}</p>
        </div>
    `;
  }
}

function setTableError(containerId, error) {
  let container = document.getElementById(containerId);
  if (!container) return;
  if (container.tagName !== 'TBODY') {
    const tbody = container.querySelector('tbody');
    if (tbody) container = tbody;
  }

  if (container.tagName === 'TBODY') {
    container.innerHTML = `<tr><td colspan="100" style="text-align: center; padding: 2rem; color: #e74c3c;"><p>⚠ Failed to load data</p><p style="font-size: 0.9em;">${error}</p></td></tr>`;
  } else {
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #e74c3c;">
            <p>⚠ Failed to load data</p>
            <p style="font-size: 0.9em;">${error}</p>
        </div>
    `;
  }
}

window.fetchAPI = fetchAPI;
window.setTableLoading = setTableLoading;
window.setTableEmpty = setTableEmpty;
window.setTableError = setTableError;

document.addEventListener("DOMContentLoaded", () => {
  const un = sessionStorage.getItem("username");
  const ro = sessionStorage.getItem("role");
  
  if (un) {
      document.querySelectorAll('.user-info .name').forEach(el => el.textContent = un);
      const welcomeText = document.querySelector('.welcome-text h2');
      if (welcomeText && welcomeText.innerHTML.includes('Welcome,')) {
          welcomeText.innerHTML = `Welcome, ${un} 👋`;
      }
  }
  if (ro) {
      document.querySelectorAll('.user-info .role').forEach(el => el.textContent = ro);
  }
});
