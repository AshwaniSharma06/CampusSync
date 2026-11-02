/**
 * Central API Service
 * Manages communication with the FastAPI backend with token injection,
 * environment configuration, and structured error handling.
 */

// Normalize API base URL: support VITE_API_URL and VITE_API_BASE_URL,
// and gracefully append /api/v1 if the user provides only the host (e.g. on Vercel/Render)
const getApiBaseUrl = () => {
  const raw = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const clean = raw.trim().replace(/\/+$/, '');
  if (clean.endsWith('/api/v1')) {
    return clean;
  }
  if (clean.endsWith('/api')) {
    return `${clean}/v1`;
  }
  return `${clean}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem('campussync_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData?.detail) {
        errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch (_) {
      // Fallback to generic message
    }
    throw new Error(errorMessage);
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

  // Events
  getEvents: async () => {
    return apiClient('/events/');
  },

  // Clubs
  getClubs: async () => {
    return apiClient('/events/clubs');
  },

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

  // AI RAG Chatbot
  chatWithAI: async (query) => {
    return apiClient('/rag/chat', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};
