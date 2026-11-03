/**
 * Central API Service
 * Manages communication with the FastAPI backend with token injection,
 * environment configuration, and structured error handling.
 */

export class ApiError extends Error {
  constructor(message, { status = null, code = null, detail = null, url = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.url = url;
  }
}

// Normalize API base URL: support VITE_API_URL and VITE_API_BASE_URL,
// and gracefully append /api/v1 if the user provides only the host (e.g. on Vercel/Render).
// Also defensively re-map legacy :5000 to FastAPI's standard :8000.
export const getApiBaseUrl = () => {
  // 1. In browser production environments (e.g. Vercel or any non-localhost domain),
  // ALWAYS use same-origin relative '/api/v1'. This is proxied server-to-server by
  // Vercel rewrites to Railway, completely eliminating browser cross-origin CORS checks.
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '/api/v1';
    }
  }

  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (clean.startsWith('/')) {
      return clean.endsWith('/v1') ? clean : (clean.endsWith('/api') ? `${clean}/v1` : clean);
    }
    if (clean.includes('localhost:5000') || clean.includes('127.0.0.1:5000')) {
      clean = clean.replace(':5000', ':8000');
    }
    if (clean.endsWith('/api/v1')) return clean;
    if (clean.endsWith('/api')) return `${clean}/v1`;
    return `${clean}/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('campussync_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const timeoutMs = options.timeout || 35000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (networkErr) {
    clearTimeout(timeoutId);

    if (networkErr.name === 'AbortError') {
      throw new ApiError(
        `Request timed out after ${timeoutMs / 1000}s. The server is taking too long to respond.`,
        { code: 'TIMEOUT', url }
      );
    }

    const currentOrigin = typeof window !== 'undefined' ? window.location?.origin : 'frontend';
    throw new ApiError(
      `Backend server unreachable at ${API_BASE_URL}. Ensure the FastAPI server is running on port 8000 (uvicorn backend.main:app --reload --port 8000) and allows CORS from ${currentOrigin}.`,
      { code: 'NETWORK_ERROR', detail: networkErr.message, url }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let detail = null;
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    try {
      const errData = await response.json();
      if (errData?.detail) {
        detail = errData.detail;
        if (Array.isArray(errData.detail)) {
          errorMessage = `Validation Error: ${errData.detail.map(e => `${e.loc ? e.loc.join('.') : 'field'}: ${e.msg}`).join('; ')}`;
        } else if (typeof errData.detail === 'string') {
          errorMessage = errData.detail;
        } else {
          errorMessage = JSON.stringify(errData.detail);
        }
      }
    } catch (_) {
      // Body not JSON
    }

    if (response.status === 401) {
      errorMessage = 'Session expired or authentication required. Please log in again.';
    } else if (response.status === 403) {
      errorMessage = errorMessage || 'Access denied. You do not have permission for this resource or cohort.';
    } else if (response.status === 404) {
      errorMessage = errorMessage || 'Requested resource was not found on the server.';
    } else if (response.status === 422) {
      errorMessage = errorMessage || 'Request validation failed. Please check submitted parameters.';
    } else if (response.status >= 500) {
      errorMessage = `Backend Internal Error (${response.status}): ${detail || 'The server encountered an unexpected error. Please check server logs.'}`;
    }

    throw new ApiError(errorMessage, {
      status: response.status,
      detail,
      url,
    });
  }

  return response.json();
};

export const apiService = {
  // Authentication & Session
  registerUser: async (registrationData) => {
    return apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  },

  loginUser: async (email, password) => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser: async () => {
    return apiClient('/auth/me');
  },

  // Student Profile
  getStudentProfile: async () => {
    return apiClient('/profile/');
  },

  updateStudentProfile: async (profileData) => {
    return apiClient('/profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Dashboard Summary
  getDashboardSummary: async () => {
    return apiClient('/dashboard/summary');
  },

  // Personalized Recommendations & Alerts
  getRecommendations: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    if (params.interests && params.interests.length > 0) {
      query.append('interests', params.interests.join(','));
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient(`/recommendations/${queryString}`);
  },

  // Notices
  getNotices: async (filter = 'All', searchQuery = '') => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (filter && filter !== 'All') params.append('category', filter);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient(`/notices/${queryString}`);
  },

  // Courses
  getEnrolledCourses: async () => {
    return apiClient('/courses/');
  },

  // Examinations
  getExaminations: async () => {
    return apiClient('/examinations/');
  },

  // Events
  getEvents: async () => {
    return apiClient('/events/');
  },

  // Clubs
  getClubs: async () => {
    return apiClient('/events/clubs');
  },

  // Academic Resources & Study Materials (Phase 4.1)
  getResources: async () => {
    return apiClient('/resources/');
  },

  getNoticeDownloadUrl: (id) => `${API_BASE_URL}/notices/${id}/download`,
  getResourceDownloadUrl: (id) => `${API_BASE_URL}/resources/${id}/download`,

  // Assignments
  getAssignments: async () => {
    return apiClient('/assignments/');
  },

  // Community
  getCommunityPosts: async () => {
    return apiClient('/community/');
  },

  createCommunityPost: async (postData) => {
    return apiClient('/community/', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // Saved Items
  getSavedItems: async () => {
    return apiClient('/saved/');
  },

  toggleSaveItem: async (itemData) => {
    return apiClient('/saved/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  // Notifications
  getNotifications: async () => {
    return apiClient('/notifications/');
  },

  // AI RAG Chatbot & Persistent Sessions (Phases 7 & 8)
  getChatSessions: async () => {
    return apiClient('/rag/sessions');
  },

  createChatSession: async (title = 'New Conversation') => {
    return apiClient('/rag/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  getChatSession: async (sessionId) => {
    return apiClient(`/rag/sessions/${sessionId}`);
  },

  renameChatSession: async (sessionId, title) => {
    return apiClient(`/rag/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  deleteChatSession: async (sessionId) => {
    return apiClient(`/rag/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  chatWithAI: async (query, history = [], studentProfile = null, sessionId = null) => {
    return apiClient('/rag/chat', {
      method: 'POST',
      body: JSON.stringify({
        query,
        session_id: sessionId,
        history,
        student_profile: studentProfile,
      }),
    });
  },
};

/**
 * Universal safe official link handler:
 * - Directs CampusSync-hosted files to local download
 * - Safely opens verified external college/university URLs in new tab
 * - Blocks unverified/untrusted domains
 * - Displays clear feedback if URL is unavailable or invalid
 */
export const openOfficialLink = (
  targetUrl,
  onActionNotification,
  unavailableFallback = 'Official link is currently unavailable.'
) => {
  if (!targetUrl || targetUrl === '#' || targetUrl === 'javascript:void(0)') {
    if (onActionNotification) onActionNotification(`⚠️ ${unavailableFallback}`);
    return false;
  }

  // Handle local CampusSync hosted file download
  if (targetUrl.startsWith('/api/v1/')) {
    const fullDownloadUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}${targetUrl}`;
    if (onActionNotification) onActionNotification('Downloading official file from CampusSync server...');
    const link = document.createElement('a');
    link.href = fullDownloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  // Handle external HTTP/HTTPS official portals
  try {
    const urlObj = new URL(targetUrl);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      if (onActionNotification) onActionNotification('⚠️ Invalid or untrusted link scheme.');
      return false;
    }

    const trustedDomains = ['ecajmer.ac.in', 'btu.ac.in', 'btuexam.in'];
    const isDomainTrusted = trustedDomains.some(
      (d) => urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`)
    );

    if (!isDomainTrusted) {
      if (onActionNotification) onActionNotification('⚠️ Unverified external link blocked for security.');
      return false;
    }

    if (onActionNotification) onActionNotification(`Opening official page (${urlObj.hostname})...`);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (_) {
    if (onActionNotification) onActionNotification(`⚠️ ${unavailableFallback}`);
    return false;
  }
};
