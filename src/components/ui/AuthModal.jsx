import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { accountStore } from '../../services/accountStore';

// Official Academic Departments & Branches from ecajmer.ac.in
const ECA_BRANCHES = [
  'Computer Engineering (CSE)',
  'CSE (Cyber Security)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Electronics Instrumentation & Control Engineering (EIC)',
  'Electrical Engineering (EE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Master of Computer Applications (MCA)',
  'Master of Business Administration (MBA)',
];

const ECA_PROGRAMS = [
  'B.Tech (Regular 4-Year)',
  'B.Tech (LEEP • Lateral Entry 2nd Year)',
  'MCA (2-Year)',
  'MBA (Dual Specialization)',
];

const ADMISSION_CATEGORIES = [
  'GAS (Government Aided Seat)',
  'SFS (Self Finance Scheme)',
  'TFWS (Tuition Fee Waiver Scheme)',
];

const SEMESTERS = [
  { value: 1, label: 'Semester 1 (1st Year)' },
  { value: 2, label: 'Semester 2 (1st Year)' },
  { value: 3, label: 'Semester 3 (2nd Year)' },
  { value: 4, label: 'Semester 4 (2nd Year)' },
  { value: 5, label: 'Semester 5 (3rd Year)' },
  { value: 6, label: 'Semester 6 (3rd Year)' },
  { value: 7, label: 'Semester 7 (4th Year • Final Year)' },
  { value: 8, label: 'Semester 8 (4th Year • Final Year)' },
];

const ACADEMIC_SESSIONS = [
  '2022 – 2026 (Final Year Batch)',
  '2023 – 2027 (Pre-Final Batch)',
  '2024 – 2028 (Sophomore Batch)',
  '2025 – 2029 (Freshman Batch)',
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    program: 'B.Tech (Regular 4-Year)',
    department: 'Computer Engineering (CSE)',
    admissionCategory: 'GAS (Government Aided Seat)',
    semester: 7,
    session: '2022 – 2026 (Final Year Batch)',
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setError('');
      // If blank, set smart default placeholders for easy demo testing
      if (initialMode === 'login' && !formData.email) {
        setFormData(prev => ({
          ...prev,
          email: 'student@example.com',
          password: 'password123',
        }));
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = (formData.email || '').trim().toLowerCase();

    // 1. SIGNUP WORKFLOW
    if (mode === 'signup') {
      if (!formData.fullName.trim()) {
        setError('Please enter your full legal name.');
        setLoading(false);
        return;
      }
      if (!cleanEmail) {
        setError('Please provide a valid email address.');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        setLoading(false);
        return;
      }
      if (!formData.studentId.trim()) {
        setError('Please enter your college roll number or enrollment ID (e.g., 22ECA081).');
        setLoading(false);
        return;
      }

      // Check if this email is already registered locally
      const existing = accountStore.findByEmail(cleanEmail);
      if (existing && existing.password) {
        setError('An account with this email already exists. Please switch to Sign In.');
        setLoading(false);
        return;
      }

      const newStudentPayload = {
        name: formData.fullName.trim(),
        email: cleanEmail,
        password: formData.password,
        studentId: formData.studentId.trim(),
        program: formData.program,
        department: formData.department,
        admissionCategory: formData.admissionCategory,
        semester: Number(formData.semester) || 7,
        session: formData.session,
        enrollment_year: parseInt(formData.session.slice(0, 4), 10) || 2022,
      };

      try {
        let backendToken = null;
        // Attempt backend registration
        try {
          const res = await apiService.registerUser({
            email: cleanEmail,
            password: formData.password,
            full_name: newStudentPayload.name,
            student_id: newStudentPayload.studentId,
            department: newStudentPayload.department,
            semester: newStudentPayload.semester,
            session: newStudentPayload.session,
            program: newStudentPayload.program,
            admission_category: newStudentPayload.admissionCategory,
          });
          if (res?.access_token) {
            backendToken = res.access_token;
          }
        } catch (apiErr) {
          console.warn('Backend API registration offline or skipped:', apiErr);
          // If backend actively reported duplicate user
          if (apiErr.message && apiErr.message.includes('already exists')) {
            setError('An account with this email already exists. Please switch to Sign In.');
            setLoading(false);
            return;
          }
        }

        // Firebase signup attempt if available
        try {
          await signup(cleanEmail, formData.password);
        } catch (_) {}

        // Persist account in permanent users registry & set active session
        const savedAccount = accountStore.saveUser(newStudentPayload);
        accountStore.setActiveSession(savedAccount, backendToken);

        onAuthSuccess?.(savedAccount);
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. SIGN IN / LOGIN WORKFLOW
    if (mode === 'login') {
      if (!cleanEmail) {
        setError('Please enter your registered email address.');
        setLoading(false);
        return;
      }
      if (!formData.password) {
        setError('Please enter your password.');
        setLoading(false);
        return;
      }

      try {
        let authenticatedProfile = null;
        let backendToken = null;

        // Step A: Attempt authentication via FastAPI backend
        try {
          const res = await apiService.loginUser(cleanEmail, formData.password);
          if (res?.user) {
            authenticatedProfile = res.user;
            backendToken = res.access_token;
          }
        } catch (backendErr) {
          console.warn('Backend login fallback to local account registry:', backendErr);
          if (backendErr.message && backendErr.message.includes('Incorrect password')) {
            setError('Incorrect password. Please verify your credentials and try again.');
            setLoading(false);
            return;
          }
        }

        // Step B: Verify credentials against permanent local account store
        if (!authenticatedProfile) {
          const check = accountStore.verifyCredentials(cleanEmail, formData.password);
          if (!check.success) {
            setError(check.message);
            setLoading(false);
            return;
          }
          authenticatedProfile = check.user;
        }

        // Firebase login attempt if available
        try {
          await login(cleanEmail, formData.password);
        } catch (_) {}

        // Set as active session (preserving the exact user profile, never overwriting with defaults)
        const finalProfile = accountStore.saveUser(authenticatedProfile);
        accountStore.setActiveSession(finalProfile, backendToken);

        onAuthSuccess?.(finalProfile);
      } catch (err) {
        setError(err.message || 'Authentication error. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickDemoAccess = () => {
    const demoPayload = {
      name: 'Ashwani Sharma',
      email: 'ashwani.sharma@example.com',
      studentId: '22ECA8941',
      program: 'B.Tech (Regular 4-Year)',
      department: 'Computer Engineering (CSE)',
      admissionCategory: 'GAS (Government Aided Seat)',
      semester: 7,
      session: '2022 – 2026 (Final Year Batch)',
      enrollment_year: 2022,
    };
    accountStore.saveUser(demoPayload);
    accountStore.setActiveSession(demoPayload);
    onAuthSuccess?.(demoPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-surface-container-high border border-primary/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden font-sans">
        {/* Top Decorative Ambient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
          title="Close dialog"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto p-5 sm:p-7 hide-scrollbar">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-xs">school</span>
              Engineering College Ajmer • BTU Affiliated
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-white">
              {mode === 'login' ? 'Student Sign In' : 'Student Registration'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto">
              {mode === 'login'
                ? 'Sign in to access your semester schedule, BTU circulars & Campus AI'
                : 'Register with your verified ECA department, semester, and session'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-surface-container p-1 rounded-xl mb-4 border border-outline/10">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              New Student Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* SIGNUP: Full Legal Name */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Full Name <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-surface-container rounded-xl pl-10 pr-4 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors placeholder:text-on-surface-variant/40"
                    placeholder="Ashwani Sharma"
                  />
                </div>
              </div>
            )}

            {/* Email Field (Both Modes - Standard Simple Email) */}
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Email Address <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-container rounded-xl pl-10 pr-4 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors placeholder:text-on-surface-variant/40"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            {/* SIGNUP: Official ECA Academic Fields */}
            {mode === 'signup' && (
              <>
                {/* Row 1: Program Degree & Branch / Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Degree Program <span className="text-primary">*</span>
                    </label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                    >
                      {ECA_PROGRAMS.map((prog) => (
                        <option key={prog} value={prog} className="bg-surface-container-high text-white">
                          {prog}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      ECA Branch / Department <span className="text-primary">*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                    >
                      {ECA_BRANCHES.map((dept) => (
                        <option key={dept} value={dept} className="bg-surface-container-high text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Current Semester & Academic Session / Batch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Current Semester <span className="text-primary">*</span>
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                      className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                    >
                      {SEMESTERS.map((sem) => (
                        <option key={sem.value} value={sem.value} className="bg-surface-container-high text-white">
                          {sem.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Academic Session / Batch <span className="text-primary">*</span>
                    </label>
                    <select
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                    >
                      {ACADEMIC_SESSIONS.map((sess) => (
                        <option key={sess} value={sess} className="bg-surface-container-high text-white">
                          {sess}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: College Roll No / Enrollment ID & Admission Category (GAS/SFS/TFWS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      College Roll No / Enrollment ID <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                        badge
                      </span>
                      <input
                        type="text"
                        required
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full bg-surface-container rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors placeholder:text-on-surface-variant/40"
                        placeholder="22ECA081"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                      Admission Scheme
                    </label>
                    <select
                      value={formData.admissionCategory}
                      onChange={(e) => setFormData({ ...formData, admissionCategory: e.target.value })}
                      className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                    >
                      {ADMISSION_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-surface-container-high text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Password Fields */}
            <div className={mode === 'signup' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-1'}>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Password <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-surface-container rounded-xl pl-10 pr-10 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors placeholder:text-on-surface-variant/40"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Confirm Password <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                      lock_reset
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-surface-container rounded-xl pl-10 pr-4 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors placeholder:text-on-surface-variant/40"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-xs uppercase tracking-[0.14em] transition-all shadow-lg mt-3 flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-fixed glow-hover'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {mode === 'login' ? 'login' : 'how_to_reg'}
              </span>
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'login'
                  ? 'Sign In to Student Portal'
                  : 'Register Student Account'}
              </span>
            </button>
          </form>

          {/* Quick 1-Click Demo Access for Viva / Professor Evaluation */}
          <div className="mt-4 pt-3 border-t border-outline/10 text-center space-y-2">
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:text-teal-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm text-teal-400">bolt</span>
              <span>1-Click Demo Access (Ashwani Sharma • 22ECA8941 • CSE)</span>
            </button>
            <p className="text-[11px] text-on-surface-variant">
              Quick evaluator preview matching official ECA BTU records
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
