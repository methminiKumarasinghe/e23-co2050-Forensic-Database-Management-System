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
  const container = document.getElementById(containerId);
  if (!container) return;

  const isTbody = container.tagName === 'TBODY';

  if (isLoading) {
    const content = `
            <div style="padding: 2rem; text-align: center; color: #666;">
                <div class="spinner" style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                <p>Loading data...</p>
            </div>
        `;
    container.innerHTML = isTbody ? `<tr><td colspan="100">${content}</td></tr>` : content;
  }
}

function setTableEmpty(containerId, message = 'No records found.') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isTbody = container.tagName === 'TBODY';
  const content = `
        <div style="padding: 2rem; text-align: center; color: #666;">
            <p>${message}</p>
        </div>
    `;
  container.innerHTML = isTbody ? `<tr><td colspan="100">${content}</td></tr>` : content;
}

function setTableError(containerId, error) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isTbody = container.tagName === 'TBODY';
  const content = `
        <div style="padding: 2rem; text-align: center; color: #e74c3c;">
            <p>⚠ Failed to load data</p>
            <p style="font-size: 0.9em;">${error}</p>
        </div>
    `;
  container.innerHTML = isTbody ? `<tr><td colspan="100">${content}</td></tr>` : content;
}

window.fetchAPI = fetchAPI;
window.setTableLoading = setTableLoading;
window.setTableEmpty = setTableEmpty;
window.setTableError = setTableError;

// Auto-wire notifications badge logic globally
document.addEventListener("DOMContentLoaded", async () => {
  const badge = document.querySelector('.topbar-badge[title="Notifications"]');
  if (!badge) return;

  badge.style.cursor = 'pointer';
  
  // Bind click navigation based on user's current directory path
  badge.addEventListener('click', (e) => {
    e.preventDefault();
    const path = window.location.pathname;
    if (path.includes('/jmo/') || path.includes('_jmo')) {
      window.location.href = 'jmo_notifications.html';
    } else if (path.includes('/police/') || path.includes('_police')) {
      window.location.href = 'police_notifications.html';
    } else if (path.includes('staff')) {
      window.location.href = 'staff-notifications.html';
    } else if (path.includes('admin') || path.includes('/admin.html')) {
      window.location.href = 'admin-notifications.html';
    } else if (path.includes('laboratory.html')) {
      // In single page app, switch view inline
      if (typeof switchView === 'function') {
        const navItem = document.querySelector('.nav-item[onclick*="notifications"]');
        switchView('notifications', navItem);
      }
    }
  });

  // Dynamically update the red badge dot if there are unread notifications
  try {
    const notifications = await window.API.get('/notifications');
    if (notifications && Array.isArray(notifications)) {
      const hasUnread = notifications.some(n => !n.is_read);
      const dot = badge.querySelector('.badge-dot');
      if (dot) {
        dot.style.display = hasUnread ? 'block' : 'none';
      }
    }
  } catch (e) {
    console.warn('Failed to auto-load notifications status:', e);
  }
});
