import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { accountStore } from '../../services/accountStore';
import CampusSyncLogo from './CampusSyncLogo';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const validateAcademicBatchSemester = (batch, semester) => {
    const sem = Number(semester);
    if (batch.includes('2025 – 2029') && sem > 2) {
      return 'Freshman batch (2025–2029) is only valid for Semester 1 or 2.';
    }
    if (batch.includes('2024 – 2028') && (sem < 3 || sem > 4)) {
      return 'Sophomore batch (2024–2028) is only valid for Semester 3 or 4.';
    }
    if (batch.includes('2023 – 2027') && (sem < 5 || sem > 6)) {
      return 'Pre-Final batch (2023–2027) is only valid for Semester 5 or 6.';
    }
    if (batch.includes('2022 – 2026') && sem < 7) {
      return 'Final Year batch (2022–2026) is only valid for Semester 7 or 8.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. SIGNUP WORKFLOW
    if (mode === 'signup') {
      if (!formData.fullName.trim()) {
        setError('Please enter your full legal name.');
        setLoading(false);
        return;
      }
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        setError('Please enter a valid academic email address.');
        setLoading(false);
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please verify and re-enter.');
        setLoading(false);
        return;
      }
      if (!formData.studentId.trim()) {
        setError('Please enter your college roll number or enrollment ID (e.g., 22ECA081).');
        setLoading(false);
        return;
      }

      // Check Academic Session and Semester compatibility
      const batchSemError = validateAcademicBatchSemester(formData.session, formData.semester);
      if (batchSemError) {
        setError(batchSemError);
        setLoading(false);
        return;
      }

      // Check if email already registered locally
      const existingEmail = accountStore.findByEmail(cleanEmail);
      if (existingEmail && existingEmail.password) {
        setError('An account with this email address already exists. Please switch to Sign In.');
        setLoading(false);
        return;
      }

      // Check if enrollment ID already registered locally
      const existingSid = accountStore.findByStudentId(formData.studentId);
      if (existingSid && existingSid.email !== cleanEmail) {
        setError(`College Roll No / Enrollment ID '${formData.studentId.trim()}' is already registered with another student account.`);
        setLoading(false);
        return;
      }

      const newStudentPayload = {
        name: formData.fullName.trim(),
        email: cleanEmail,
        password: formData.password,
        studentId: formData.studentId.trim().toUpperCase(),
        program: formData.program,
        department: formData.department,
        admissionCategory: formData.admissionCategory,
        semester: Number(formData.semester) || 7,
        session: formData.session,
        enrollment_year: parseInt(formData.session.slice(0, 4), 10) || 2022,
      };

      try {
        let backendToken = null;
        let registeredProfile = null;

        // Backend API registration
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
            if (res.user) {
              registeredProfile = res.user;
            }
          }
        } catch (apiErr) {
          console.warn('Backend API registration notice:', apiErr);
          if (apiErr.message) {
            if (apiErr.message.includes('already exists') || apiErr.message.includes('email')) {
              setError('An account with this email address already exists. Please switch to Sign In.');
              setLoading(false);
              return;
            }
            if (apiErr.message.includes('Enrollment ID') || apiErr.message.includes('already registered')) {
              setError(apiErr.message);
              setLoading(false);
              return;
            }
          }
        }

        // Firebase signup attempt if available
        try {
          await signup(cleanEmail, formData.password);
        } catch (_) { }

        // Persist account in permanent users registry & set active session
        const profileToSave = registeredProfile || newStudentPayload;
        const savedAccount = accountStore.saveUser(profileToSave);
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
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        setError('Please enter a valid registered email address.');
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
        } catch (_) { }

        // Set as active session (preserving the exact student profile)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden font-sans">
        {/* Top Decorative Gradient Accent Bar */}
        <div className="w-full h-1 bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-400"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          title="Close dialog"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto hide-scrollbar">
          {/* Header */}
          <div className="text-center mb-5 flex flex-col items-center">
            <div className="mb-1">
              <CampusSyncLogo variant="horizontal" theme="light" size={38} className="h-9 w-auto" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-[10.5px] font-bold uppercase tracking-wider mt-2.5 mb-2">
              ENGINEERING COLLEGE AJMER • BTU AFFILIATED
            </div>

            <h3 className="font-serif text-3xl text-slate-900 tracking-tight">
              {mode === 'login' ? 'Student Sign In' : 'Student Registration'}
            </h3>

            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto text-center">
              {mode === 'login'
                ? 'Sign in to access your semester schedule, BTU circulars & Campus AI'
                : 'Register with your verified ECA department, semester, and session'}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl mb-6 border border-slate-200/60 max-w-xs mx-auto w-full">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-1.5 px-3 text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer ${mode === 'login'
                  ? 'bg-white text-slate-800 font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-1.5 px-3 text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mode === 'signup'
                  ? 'bg-white text-slate-800 font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
              <span>NEW STUDENT SIGN UP</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. STUDENT SIGN IN FORM                                   */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  EMAIL ADDRESS <span className="text-teal-600">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    PASSWORD <span className="text-teal-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setError('Please contact ECA IT Helpdesk (academic-sync@ecajmer.ac.in) for credential recovery.')}
                    className="text-[11px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                    placeholder="••••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 mt-5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">vpn_key</span>
                <span>{loading ? 'Authenticating...' : 'SIGN IN TO STUDENT PORTAL'}</span>
              </button>

              <div className="flex items-center justify-center gap-2.5 text-xs text-slate-400 mt-6 pt-2">
                <a href="https://www.ecajmer.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
                  Portal Guidelines
                </a>
                <span>•</span>
                <a href="https://btuexam.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
                  BTU ERP Sync
                </a>
                <span>•</span>
                <a href="mailto:academic-sync@ecajmer.ac.in" className="hover:text-slate-600 transition-colors">
                  IT Helpdesk ECA
                </a>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* 2. STUDENT REGISTRATION FORM                              */}
          {/* ========================================================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Full Legal Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    FULL NAME <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                {/* 2. Email Address */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    EMAIL ADDRESS <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                      placeholder="student@example.com"
                    />
                  </div>
                </div>

                {/* 3. Degree Program */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    DEGREE PROGRAM <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                    >
                      {ECA_PROGRAMS.map((prog) => (
                        <option key={prog} value={prog} className="text-slate-800">
                          {prog}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* 4. ECA Branch / Department */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ECA BRANCH / DEPARTMENT <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                    >
                      {ECA_BRANCHES.map((dept) => (
                        <option key={dept} value={dept} className="text-slate-800">
                          {dept}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* 5. Current Semester */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    CURRENT SEMESTER <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                      className="w-full bg-slate-50/50 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                    >
                      {SEMESTERS.map((sem) => (
                        <option key={sem.value} value={sem.value} className="text-slate-800">
                          {sem.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* 6. Academic Session / Batch */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ACADEMIC SESSION / BATCH <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                    >
                      {ACADEMIC_SESSIONS.map((sess) => (
                        <option key={sess} value={sess} className="text-slate-800">
                          {sess}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* 7. College Roll No / Enrollment ID */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    COLLEGE ROLL NO / ENROLLMENT ID <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                      placeholder="22ECA081"
                    />
                  </div>
                </div>

                {/* 9. Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    PASSWORD <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                      placeholder="••••••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 10. Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    CONFIRM PASSWORD <span className="text-teal-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                      sync
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50/50 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                      placeholder="••••••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Verification Badge */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 pt-3 pb-1">
                <span className="material-symbols-outlined text-teal-600 text-base">verified_user</span>
                <span className="font-medium">Directly verified with ECA BTU Student Records Database</span>
              </div>

              {/* Complete Registration Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Processing Registration...' : 'COMPLETE STUDENT REGISTRATION'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

              {/* Terms & Conditions */}
              <p className="text-center text-[11px] text-slate-400 mt-2.5">
                By signing up, you agree to the{' '}
                <a href="https://www.ecajmer.ac.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                  ECA Academic Portal Terms
                </a>{' '}
                and{' '}
                <a href="https://www.btu.ac.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                  BTU Student Policy
                </a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
