const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8000/api'
  : 'https://YOUR-RENDER-URL.onrender.com/api'; // ⚠️ Replace with your Render URL after deployment

function showLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getAuthHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getAuthHeadersFormData() {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiGet(url) {
  try {
    const res = await fetch(`${API_BASE}${url}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return await res.json();
  } catch (e) {
    throw e;
  }
}

async function apiPost(url, data) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return await res.json();
  } catch (e) {
    throw e;
  }
}

async function apiPut(url, data) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return await res.json();
  } catch (e) {
    throw e;
  }
}

async function apiDelete(url) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return await res.json();
  } catch (e) {
    throw e;
  }
}

async function apiUpload(url, formData) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getAuthHeadersFormData(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return await res.json();
  } catch (e) {
    throw e;
  }
}
