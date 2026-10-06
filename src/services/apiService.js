/**
 * Central API Service
 * This service will eventually make calls to the FastAPI backend.
 * For now, it wraps mock data from '../data/mockData.js' in Promises to simulate network requests.
 */

import { noticesData, notifications, enrolledCourses } from '../data/mockData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  // Student Profile
  getStudentProfile: async () => {
    await delay(800);
    return { name: 'Student', department: 'Computer Science', studentId: 'ECA2026-8941' };
  },

  // Notices
  getNotices: async (filter = 'All', searchQuery = '') => {
    await delay(500);
    return noticesData.filter(n => 
      (filter === 'All' || n.type === filter) &&
      n.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },

  // Courses
  getEnrolledCourses: async () => {
    await delay(600);
    return enrolledCourses;
  },

  // Notifications
  getNotifications: async () => {
    await delay(300);
    return notifications;
  }
};
