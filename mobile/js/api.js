/**
 * api.js
 * Digital Forensic Medical Information System
 * Reusable utility for handling frontend API calls.
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Perform an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/staff/dashboard')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<any>}
 */
async function fetchAPI(endpoint, options = {}) {
    const token = sessionStorage.getItem('jwt_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            // Unauthorized or Forbidden, redirect to login
            sessionStorage.clear();
            window.location.href = '../index.html';
            throw new Error('Unauthorized');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}

/**
 * Handle UI Loading State
 * @param {string} containerId - Element ID to show loading inside
 * @param {boolean} isLoading - Whether to show or hide loading
 */
function setTableLoading(containerId, isLoading) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (isLoading) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #666;">
                <div class="spinner" style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                <p>Loading data...</p>
            </div>
        `;
    }
}

/**
 * Handle UI Empty State
 * @param {string} containerId - Element ID
 * @param {string} message - Empty message
 */
function setTableEmpty(containerId, message = 'No records found.') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #666;">
            <p>${message}</p>
        </div>
    `;
}

/**
 * Handle UI Error State
 * @param {string} containerId - Element ID
 * @param {string} error - Error message
 */
function setTableError(containerId, error) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #e74c3c;">
            <p>⚠ Failed to load data</p>
            <p style="font-size: 0.9em;">${error}</p>
        </div>
    `;
}

// Ensure globally available
window.fetchAPI = fetchAPI;
window.setTableLoading = setTableLoading;
window.setTableEmpty = setTableEmpty;
window.setTableError = setTableError;
