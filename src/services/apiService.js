/**
 * Central API Service
 * This service makes calls to the FastAPI backend.
 */

const getAuthHeaders = () => {
    const token = localStorage.getItem('campussync_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiClient = async (endpoint, options = {}) => {
    const url = `http://localhost:8000/api/v1${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
    };
    
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
};

export const apiService = {
  // Student Profile
  getStudentProfile: async () => {
    return apiClient('/profile/');
  },

  // Dashboard Summary
  getDashboardSummary: async () => {
    return apiClient('/dashboard/summary');
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

  // Saved Items
  getSavedItems: async () => {
    return apiClient('/saved/');
  },

  // Notifications
  getNotifications: async () => {
    return apiClient('/notifications/');
  }
};
