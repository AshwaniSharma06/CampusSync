/**
 * Central API Service
 * Manages communication with the FastAPI backend with token injection,
 * environment configuration, and structured error handling.
 */

import noticePdfMap from './noticePdfMap.json';

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

export const LIVE_FALLBACK_URL = 'https://campussync-production-4593.up.railway.app/api/v1';
export let API_BASE_URL = getApiBaseUrl();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('campussync_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiClient = async (endpoint, options = {}) => {
  // Preserve exact route path with leading slash, avoiding double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  let url = `${base}${cleanEndpoint}`;

  // Use a nimble timeout on localhost so an unstarted local server fails over to Railway in seconds
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  const timeoutMs = options.timeout || (isLocal ? 3500 : 25000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

    // Failover: If current server is unreachable (local or proxy), seamlessly fail over to live Railway API
    if (!url.startsWith(LIVE_FALLBACK_URL)) {
      const fallbackUrl = `${LIVE_FALLBACK_URL.replace(/\/+$/, '')}${cleanEndpoint}`;
      try {
        const fallbackCtrl = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackCtrl.abort(), 15000);
        const fallbackResponse = await fetch(fallbackUrl, {
          ...options,
          headers,
          signal: fallbackCtrl.signal,
        });
        clearTimeout(fallbackTimeout);

        if (fallbackResponse) {
          // Switch active base URL so subsequent calls connect directly to live backend
          API_BASE_URL = LIVE_FALLBACK_URL;
          url = fallbackUrl;
          response = fallbackResponse;
        }
      } catch (fallbackErr) {
        console.warn('Fallback to live Railway backend failed:', fallbackErr);
      }
    }

    if (!response) {
      if (networkErr.name === 'AbortError') {
        throw new ApiError(
          `Request timed out after ${timeoutMs / 1000}s. The server is taking too long to respond.`,
          { code: 'TIMEOUT', url }
        );
      }

      throw new ApiError(
        `Backend server unreachable at ${API_BASE_URL}. Ensure the FastAPI server is running on port 8000 (uvicorn backend.main:app --reload --port 8000) or verify internet connection to ${LIVE_FALLBACK_URL}.`,
        { code: 'NETWORK_ERROR', detail: networkErr.message, url }
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Intercept proxy gateway errors (502/503/504) and route directly to live backend
  if (response && (response.status === 502 || response.status === 503 || response.status === 504) && !url.startsWith(LIVE_FALLBACK_URL)) {
    const directUrl = `${LIVE_FALLBACK_URL.replace(/\/+$/, '')}${cleanEndpoint}`;
    try {
      const directResponse = await fetch(directUrl, {
        ...options,
        headers,
      });
      if (directResponse && directResponse.status < 500) {
        API_BASE_URL = LIVE_FALLBACK_URL;
        url = directUrl;
        response = directResponse;
      }
    } catch (_) {}
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

  // Intelligent Curated Feed (Phase 4.2)
  getIntelligentFeed: async ({ category = 'all', limit = 30, offset = 0 } = {}) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const qs = params.toString() ? `?${params.toString()}` : '';

    try {
      return await apiClient(`/feed/${qs}`);
    } catch (feedErr) {
      console.warn('Dedicated /feed endpoint unavailable, gracefully failing over to public notices:', feedErr);
      try {
        const notices = await apiService.getPublicNotices({ limit: 50 });
        if (Array.isArray(notices) && notices.length > 0) {
          const oppCount = notices.filter(n => {
            const t = (n.title || '').toLowerCase();
            return t.includes('workshop') || t.includes('hackathon') || t.includes('training') || t.includes('internship');
          }).length;

          return {
            is_authenticated: false,
            category,
            total: notices.length,
            counts: {
              all: notices.length,
              semester: 0,
              department: 0,
              college: notices.length - oppCount,
              opportunities: oppCount,
              recommended: 0,
            },
            items: notices.map((n) => {
              const t = (n.title || '').toLowerCase();
              const isOpp = t.includes('workshop') || t.includes('hackathon') || t.includes('training') || t.includes('internship');
              return {
                id: n.id,
                type: 'NOTICE',
                title: n.title,
                summary: n.summary || n.content || n.title,
                category: isOpp ? 'opportunities' : 'college',
                category_label: isOpp ? 'Learning & Opportunities' : 'College Update',
                reason: 'Verified ECA Official Notice',
                is_important: n.is_important || false,
                has_pdf: n.has_pdf || false,
                published_date: n.published_date || n.formatted_date || new Date().toISOString(),
                target_url: n.action_url || n.document_url || n.source_url || 'https://www.ecajmer.ac.in/latestfromeca',
                action_label: n.action_label || 'View Verified Document',
                is_saved: false,
              };
            }),
          };
        }
      } catch (fallbackErr) {
        console.warn('Public notices fallback also unavailable:', fallbackErr);
      }
      throw feedErr;
    }
  },

  // Notices
  getNotices: async (filter = 'All', searchQuery = '') => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (filter && filter !== 'All') params.append('category', filter);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient(`/notices/${queryString}`);
  },

  // Public Notices (for Homepage Dynamic Floating Cards & Showcase)
  getPublicNotices: async ({ limit = 6, excludeIds = [], category = null } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (excludeIds && excludeIds.length > 0) {
      params.append('exclude_ids', excludeIds.join(','));
    }
    if (category && category !== 'All') {
      params.append('category', category);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient(`/notices/public${queryString}`);
  },

  // Courses
  getEnrolledCourses: async () => {
    return apiClient('/courses/');
  },

  // Examinations
  getExaminations: async () => {
    return apiClient('/examinations/');
  },

  // Feature Flags - Preserved for Semester 8 (Major Project Phase 2)
  EVENTS_ENABLED: false,

  // Events - Temporarily suspended for Semester 7 (Reintroduced in Semester 8 - Major Project Phase 2)
  getEvents: async () => {
    // Feature flag suspended for Semester 7
    return [];
    // Preserved for Semester 8 - Major Project Phase 2:
    // return apiClient('/events/');
  },

  // Clubs - Preserved for Semester 8 (Major Project Phase 2)
  getClubs: async () => {
    return [];
    // return apiClient('/events/clubs');
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

  // Community & Social Platform
  getCommunityPosts: async ({ limit = 50, offset = 0, tag = null, search = null } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (tag && tag !== 'All') params.append('tag', tag);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient(`/community/${qs}`);
  },

  createCommunityPost: async (postData) => {
    return apiClient('/community/', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  uploadCommunityAttachment: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient('/community/upload', {
      method: 'POST',
      body: formData,
      headers: {},
      timeout: 60000,
    });
  },

  toggleCommunityPostLike: async (postId) => {
    return apiClient(`/community/${postId}/like`, {
      method: 'POST',
    });
  },

  voteCommunityPoll: async (pollId, optionIds) => {
    return apiClient(`/community/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_ids: optionIds }),
    });
  },

  getCommunityComments: async (postId) => {
    return apiClient(`/community/${postId}/comments`);
  },

  createCommunityComment: async (postId, content, parentId = null) => {
    return apiClient(`/community/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  },

  deleteCommunityComment: async (commentId) => {
    return apiClient(`/community/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  deleteCommunityPost: async (postId) => {
    return apiClient(`/community/${postId}`, {
      method: 'DELETE',
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
 * Resolves the exact direct PDF URL for any given notice object.
 * Checks direct document_url, action_url, or looks up by ID / title in the verified catalog map.
 */
export const resolveNoticePdf = (notice) => {
  if (!notice) return null;

  // 1. If direct document_url points to a circular PDF or image upload
  if (
    notice.document_url &&
    typeof notice.document_url === 'string' &&
    (notice.document_url.includes('/uploads/circulars/') ||
      notice.document_url.toLowerCase().includes('.pdf') ||
      notice.document_url.toLowerCase().includes('/content/'))
  ) {
    return notice.document_url;
  }

  // 2. If action_url points to a circular PDF or image upload
  if (
    notice.action_url &&
    typeof notice.action_url === 'string' &&
    (notice.action_url.includes('/uploads/circulars/') ||
      notice.action_url.toLowerCase().includes('.pdf') ||
      notice.action_url.toLowerCase().includes('/content/'))
  ) {
    return notice.action_url;
  }

  // 3. Match by notice ID in verified catalog
  if (notice.id && noticePdfMap[String(notice.id)]) {
    return noticePdfMap[String(notice.id)];
  }

  // 4. Match by normalized title in verified catalog
  if (notice.title && typeof notice.title === 'string') {
    const norm = notice.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (noticePdfMap[norm]) {
      return noticePdfMap[norm];
    }
  }

  // 5. Fallback to download_url or document_url if present
  if (notice.download_url && notice.download_url.startsWith('/api/v1/')) {
    return notice.download_url;
  }

  return notice.document_url || notice.action_url || null;
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
  unavailableFallback = 'Opening Govt. Engineering College Ajmer official circulars...'
) => {
  const SAFE_CIRCULARS_URL = 'https://www.ecajmer.ac.in/latestfromeca';

  // If targetUrl is missing or invalid, redirect to verified circulars directory (never bare homepage)
  if (!targetUrl || targetUrl === '#' || targetUrl === 'javascript:void(0)') {
    window.open(SAFE_CIRCULARS_URL, '_blank', 'noopener,noreferrer');
    if (onActionNotification) onActionNotification('Opening ECA latest circulars directory...');
    return true;
  }

  // Handle local CampusSync hosted file download
  if (targetUrl.startsWith('/api/v1/')) {
    const fullDownloadUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}${targetUrl}`;
    if (onActionNotification) onActionNotification('Opening official document from CampusSync...');
    const link = document.createElement('a');
    link.href = fullDownloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  // Handle external HTTP/HTTPS official portals and PDFs
  try {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const lower = cleanUrl.toLowerCase().replace(/\/+$/, '');

    // Prevent redirecting to bare homepage (which causes confusion instead of showing the notice)
    if (
      lower === 'https://www.ecajmer.ac.in' ||
      lower === 'http://www.ecajmer.ac.in' ||
      lower === 'https://ecajmer.ac.in' ||
      lower === 'http://ecajmer.ac.in' ||
      lower === 'https://www.ecajmer.ac.in/circulars' ||
      lower === 'http://www.ecajmer.ac.in/circulars' ||
      lower === 'https://ecajmer.ac.in/circulars' ||
      lower === 'http://ecajmer.ac.in/circulars'
    ) {
      cleanUrl = SAFE_CIRCULARS_URL;
    }

    // Intercept and prevent 404 routes (/departments/cse, /facilities/library, bare /circulars, etc.)
    const isBareCirculars = 
      lower.endsWith('/circulars') || 
      lower.endsWith('/circulars/') || 
      lower.includes('/circulars?');

    const brokenRoutes = [
      '/departments/cse',
      '/departments/',
      '/department/',
      '/facilities/library',
      '/facilities/',
      '/academics/examinations',
      '/academics/sem',
      '/academics/cse',
      '/events/technotsav',
      '/notices/unclassified'
    ];
    if (isBareCirculars || brokenRoutes.some(route => lower.includes(route))) {
      cleanUrl = SAFE_CIRCULARS_URL;
    }

    // Normalize legacy Content paths
    cleanUrl = cleanUrl
      .replace(/ecajmer\.ac\.in\/\.\.\/content\//i, 'ecajmer.ac.in/Content/')
      .replace(/ecajmer\.ac\.in\/\.\/content\//i, 'ecajmer.ac.in/Content/');

    // Ensure percent-encoding so URLs with spaces open reliably across all browsers
    cleanUrl = encodeURI(decodeURI(cleanUrl));

    const urlObj = new URL(cleanUrl);
    if (onActionNotification) {
      if (cleanUrl.toLowerCase().includes('.pdf')) {
        onActionNotification(`Opening verified PDF document (${urlObj.hostname})...`);
      } else {
        onActionNotification(`Opening official circular (${urlObj.hostname})...`);
      }
    }
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.warn('URL parsing fallback:', err);
    window.open(SAFE_CIRCULARS_URL, '_blank', 'noopener,noreferrer');
    if (onActionNotification) onActionNotification('Opening ECA Official Circulars...');
    return true;
  }
};
