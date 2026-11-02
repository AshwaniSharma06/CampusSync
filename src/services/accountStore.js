/**
 * CampusSync User Account & Identity Store
 * 
 * Manages persistent student accounts across sessions and page reloads.
 * Synchronizes with backend database and maintains an immutable local registry
 * so student profiles (Name, Roll No, Branch, Semester) are never lost on sign-out.
 */

const USERS_DB_KEY = 'campussync_users_db';
const ACTIVE_PROFILE_KEY = 'campussync_student_profile';
const DEMO_USER_FLAG = 'campussync_demo_user';
const TOKEN_KEY = 'campussync_token';

// Seed default official accounts
const DEFAULT_ACCOUNTS = {
  'student@example.com': {
    name: 'Ashwani Sharma',
    email: 'student@example.com',
    password: 'password123',
    studentId: '22ECA8941',
    program: 'B.Tech (Regular 4-Year)',
    department: 'Computer Engineering (CSE)',
    semester: 7,
    session: '2022 – 2026 (Final Year Batch)',
    admissionCategory: 'GAS (Government Aided Seat)',
    enrollment_year: 2022,
  },
  'student@ecajmer.ac.in': {
    name: 'Ashwani Sharma',
    email: 'student@ecajmer.ac.in',
    password: 'password123',
    studentId: '22ECA8941',
    program: 'B.Tech (Regular 4-Year)',
    department: 'Computer Engineering (CSE)',
    semester: 7,
    session: '2022 – 2026 (Final Year Batch)',
    admissionCategory: 'GAS (Government Aided Seat)',
    enrollment_year: 2022,
  }
};

export const accountStore = {
  /**
   * Get all registered accounts dictionary
   */
  getAllUsers: () => {
    try {
      const data = localStorage.getItem(USERS_DB_KEY);
      if (!data) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
        return { ...DEFAULT_ACCOUNTS };
      }
      return { ...DEFAULT_ACCOUNTS, ...JSON.parse(data) };
    } catch (_) {
      return { ...DEFAULT_ACCOUNTS };
    }
  },

  /**
   * Find an account by email (case-insensitive)
   */
  findByEmail: (email) => {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const users = accountStore.getAllUsers();
    return users[cleanEmail] || null;
  },

  /**
   * Register or update an account
   */
  saveUser: (userPayload) => {
    if (!userPayload || !userPayload.email) return null;
    const cleanEmail = userPayload.email.trim().toLowerCase();
    const users = accountStore.getAllUsers();

    const existing = users[cleanEmail] || {};
    const updatedAccount = {
      ...existing,
      ...userPayload,
      email: cleanEmail,
      name: userPayload.name || userPayload.fullName || existing.name || cleanEmail.split('@')[0],
      studentId: userPayload.studentId || existing.studentId || '22ECA8941',
      department: userPayload.department || existing.department || 'Computer Engineering (CSE)',
      semester: Number(userPayload.semester) || existing.semester || 7,
      session: userPayload.session || existing.session || '2022 – 2026 (Final Year Batch)',
      program: userPayload.program || existing.program || 'B.Tech (Regular 4-Year)',
      admissionCategory: userPayload.admissionCategory || existing.admissionCategory || 'GAS (Government Aided Seat)',
      enrollment_year: userPayload.enrollment_year || existing.enrollment_year || 2022,
      updatedAt: new Date().toISOString(),
    };

    users[cleanEmail] = updatedAccount;
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to persist users db to localStorage:', e);
    }

    return updatedAccount;
  },

  /**
   * Verify credentials for login
   */
  verifyCredentials: (email, password) => {
    if (!email) return { success: false, message: 'Please enter your email.' };
    const user = accountStore.findByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'No registered account found with this email. Please sign up first.',
      };
    }

    // If password was stored and is different, reject
    if (user.password && password && user.password !== password) {
      return {
        success: false,
        message: 'Incorrect password. Please verify your credentials and try again.',
      };
    }

    return { success: true, user };
  },

  /**
   * Set active student session
   */
  setActiveSession: (profileData, token = null) => {
    if (!profileData) return;
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profileData));
      localStorage.setItem(DEMO_USER_FLAG, 'true');
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch (_) {}
  },

  /**
   * Get currently active student profile
   */
  getActiveSession: () => {
    try {
      const data = localStorage.getItem(ACTIVE_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  },

  /**
   * Clear active session upon sign out WITHOUT deleting the users registry
   */
  clearActiveSession: () => {
    try {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
      localStorage.removeItem(DEMO_USER_FLAG);
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }
};

