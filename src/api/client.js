/**
 * Centralized API client with automatic JWT refresh.
 * All API calls go through this module.
 */

// In development, leave REACT_APP_API_URL unset — requests go to /api/...
// and CRA's proxy (package.json "proxy") forwards them to localhost:5000.
// In production, set REACT_APP_API_URL=https://your-api.com/api
const BASE_URL = process.env.REACT_APP_API_URL || '/api';

// ── Token storage (sessionStorage for XSS mitigation) ────────────────────────
export const tokenStorage = {
  getAccess:     () => sessionStorage.getItem('accessToken'),
  getRefresh:    () => sessionStorage.getItem('refreshToken'),
  setTokens:     (access, refresh) => {
    sessionStorage.setItem('accessToken', access);
    if (refresh) sessionStorage.setItem('refreshToken', refresh);
  },
  clearTokens:   () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  },
};

// ── Refresh logic ─────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

async function refreshAccessToken() {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokenStorage.clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const accessToken = tokenStorage.getAccess();

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && tokenStorage.getRefresh()) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        refreshQueue.forEach(cb => cb(newToken));
        refreshQueue = [];

        // Retry original request with new token
        res = await fetch(url, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        });
      } catch (err) {
        isRefreshing = false;
        refreshQueue.forEach(cb => cb(null));
        refreshQueue = [];
        throw err;
      }
    } else {
      // Queue this request until refresh completes
      await new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (token) resolve(token);
          else reject(new Error('Refresh failed'));
        });
      });
      const newToken = tokenStorage.getAccess();
      res = await fetch(url, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    }
  }

  if (!res.ok) {
    let errorData;
    try { errorData = await res.json(); } catch { errorData = { error: res.statusText }; }
    const err = new Error(errorData.error || 'Request failed');
    err.status  = res.status;
    err.details = errorData.details;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

// ── Public API methods ────────────────────────────────────────────────────────

export const api = {
  // Auth
  login:    (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password, studentId) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, studentId }) }),
  logout:   (refreshToken) =>
    apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  me:       () => apiFetch('/auth/me'),

  // Books
  getBooks: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return apiFetch(`/books${qs ? '?' + qs : ''}`);
  },
  getBook:    (id)   => apiFetch(`/books/${id}`),
  getGenres:  ()     => apiFetch('/books/genres'),
  createBook: (data) => apiFetch('/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id, data) => apiFetch(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (id)   => apiFetch(`/books/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return apiFetch(`/transactions${qs ? '?' + qs : ''}`);
  },
  getPendingRequests: () => apiFetch('/transactions/pending'),
  borrowRequest:  (bookId) =>
    apiFetch('/transactions/borrow-request', { method: 'POST', body: JSON.stringify({ bookId }) }),
  returnRequest:  (transactionId) =>
    apiFetch('/transactions/return-request', { method: 'POST', body: JSON.stringify({ transactionId }) }),
  cancelRequest:  (txId) =>
    apiFetch(`/transactions/${txId}/cancel`, { method: 'POST' }),
  approveRequest: (txId, dueDate) =>
    apiFetch(`/transactions/${txId}/approve`, { method: 'POST', body: JSON.stringify({ dueDate }) }),
  declineRequest: (txId) =>
    apiFetch(`/transactions/${txId}/decline`, { method: 'POST' }),

  // Users
  getUsers:         ()     => apiFetch('/users'),
  getUser:          (id)   => apiFetch(`/users/${id}`),
  getUserLoans:     (id)   => apiFetch(`/users/${id}/active-loans`),
  getUserHistory:   (id)   => apiFetch(`/users/${id}/reading-history`),
  createUser:       (data) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser:       (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Recommendations
  getRecommendations:       (limit) => apiFetch(`/recommendations${limit ? '?limit=' + limit : ''}`),
  getUserRecommendations:   (userId, limit) => apiFetch(`/recommendations/user/${userId}${limit ? '?limit=' + limit : ''}`),
  getSimilarBooks:          (bookId, limit) => apiFetch(`/recommendations/similar/${bookId}${limit ? '?limit=' + limit : ''}`),
  getOverduePredictions:    () => apiFetch('/recommendations/overdue-predictions'),

  // Dashboard
  getAdminDashboard:   () => apiFetch('/dashboard/admin'),
  getStudentDashboard: () => apiFetch('/dashboard/student'),

  // Analytics (admin only)
  getAnalyticsOverview:      () => apiFetch('/analytics/overview'),
  getBorrowsOverTime:        () => apiFetch('/analytics/borrows-over-time'),
  getTopBooks:               () => apiFetch('/analytics/top-books'),
  getGenreDistribution:      () => apiFetch('/analytics/genre-distribution'),
  getUserActivity:           () => apiFetch('/analytics/user-activity'),
  getAiMetrics:              () => apiFetch('/analytics/ai-metrics'),
  clearModelCache:           () => apiFetch('/analytics/clear-model-cache', { method: 'POST' }),
  debugTrainingData:         () => apiFetch('/analytics/debug-training'),

  // Chatbot
  chat: (message) =>
    apiFetch('/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  // Fines
  getFineConfig:        () => apiFetch('/fines/config'),
  updateFineConfig:     (data) => apiFetch('/fines/config', { method: 'PUT', body: JSON.stringify(data) }),
  recalculateFines:     () => apiFetch('/fines/recalculate', { method: 'POST' }),
  waiveFines:           (userId) => apiFetch(`/fines/waive/${userId}`, { method: 'POST' }),

  // Ratings
  getBookRatings:  (bookId) => apiFetch(`/ratings/book/${bookId}`),
  rateBook:        (bookId, rating) => apiFetch('/ratings', { method: 'POST', body: JSON.stringify({ bookId, rating }) }),
  removeRating:    (bookId) => apiFetch(`/ratings/${bookId}`, { method: 'DELETE' }),
};

export default api;
