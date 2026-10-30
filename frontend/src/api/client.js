const BASE_URL = '/api';

export const tokenStorage = {
  getAccess: () => localStorage.getItem('homielink_access_token'),
  getRefresh: () => localStorage.getItem('homielink_refresh_token'),
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem('homielink_access_token', access);
    if (refresh) localStorage.setItem('homielink_refresh_token', refresh);
  },
  clear: () => {
    localStorage.removeItem('homielink_access_token');
    localStorage.removeItem('homielink_refresh_token');
    localStorage.removeItem('homielink_user');
  }
};

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const accessToken = tokenStorage.getAccess();
  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers
  });

  // Handle token expired (401)
  if (response.status === 401 && tokenStorage.getRefresh() && !options._retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: tokenStorage.getRefresh() })
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          tokenStorage.setTokens(data.access, data.refresh);
          onRefreshed(data.access);
        } else {
          tokenStorage.clear();
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired'));
        }
      } catch (err) {
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    const retryOriginalRequest = new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        options._retry = true;
        headers['Authorization'] = `Bearer ${newToken}`;
        resolve(fetch(url, { ...options, headers }));
      });
    });

    response = await retryOriginalRequest;
  }

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText };
    }
    const error = new Error(errorData.detail || errorData.error || 'API Request failed');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

