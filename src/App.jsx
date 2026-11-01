import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import AiWidget from './components/ui/AiWidget';
import AuthModal from './components/ui/AuthModal';
import StudentDashboard from './components/portal/StudentDashboard';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import { apiService } from './services/apiService';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [aiWidgetOpen, setAiWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const { currentUser, logout, jwtToken } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  // Restore cached profile on first mount if signed in
  useEffect(() => {
    const cachedProfile = localStorage.getItem('campussync_student_profile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setUserProfile(parsed);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    // Fetch user profile from FastAPI when JWT is ready
    if (jwtToken && currentUser) {
      apiService.getStudentProfile().then(profile => {
        const updated = {
          name: profile.full_name || currentUser.displayName || 'Ashwani Sharma',
          email: profile.email,
          department: profile.department || 'Computer Engineering (CSE)',
          studentId: profile.student_id || '22ECA8941',
          semester: profile.semester || 7,
          session: profile.enrollment_year ? `${profile.enrollment_year} – ${profile.enrollment_year + 4}` : '2022 – 2026'
        };
        setUserProfile(updated);
        localStorage.setItem('campussync_student_profile', JSON.stringify(updated));
      }).catch(err => console.error("Failed to fetch profile", err));
    }
  }, [jwtToken, currentUser]);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (profileData) => {
    setIsAuthModalOpen(false);
    if (profileData) {
      setUserProfile(profileData);
      localStorage.setItem('campussync_student_profile', JSON.stringify(profileData));
    }
    const displayName = profileData?.name || profileData?.fullName || 'Student';
    showToast(`Welcome ${displayName}! Accessing your student portal...`);
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (_) {}
    localStorage.removeItem('campussync_demo_user');
    localStorage.removeItem('campussync_student_profile');
    localStorage.removeItem('campussync_token');
    setUserProfile(null);
    showToast('Signed out of Student Portal.');
    navigate('/');
  };

  // Guard: Check if student has signed in or completed registration
  const isStudentAuthenticated = Boolean(
    currentUser || 
    userProfile || 
    localStorage.getItem('campussync_student_profile') || 
    localStorage.getItem('campussync_demo_user')
  );

  // When clicking dashboard without login, open auth popup modal
  const handleOpenDashboard = () => {
    if (isStudentAuthenticated) {
      navigate('/dashboard');
    } else {
      showToast('Please sign in or sign up first to access your student dashboard.');
      handleOpenAuth('login');
    }
  };

  const effectiveUser = userProfile || (currentUser ? {
    name: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Student'),
    email: currentUser?.email || 'student@example.com',
    department: 'Computer Engineering (CSE)',
    studentId: '22ECA8941',
    semester: 7,
    session: '2022 – 2026 (Final Year Batch)'
  } : null);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-on-surface font-sans antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">

      {!isDashboard && (
        <Navbar
          onOpenSignIn={(mode) => handleOpenAuth(mode || 'login')}
          onOpenSignUp={() => handleOpenAuth('signup')}
          onOpenAiAgent={() => setAiWidgetOpen(true)}
          currentUser={isStudentAuthenticated ? (currentUser || userProfile) : null}
          onOpenPortalView={handleOpenDashboard}
        />
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            <LandingPage 
              currentUser={isStudentAuthenticated ? (currentUser || userProfile) : null} 
              showToast={showToast} 
              onOpenAuth={handleOpenAuth} 
            />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={isStudentAuthenticated ? effectiveUser : null} redirectPath="/">
              <StudentDashboard
                user={effectiveUser}
                onSignOut={handleSignOut}
                onActionNotification={showToast}
                onReturnHome={() => navigate('/')}
              />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!isDashboard && <Footer onActionNotification={showToast} />}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      <AiWidget isOpenExternal={aiWidgetOpen} setIsOpenExternal={setAiWidgetOpen} />
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
    </ErrorBoundary>
  );
}
