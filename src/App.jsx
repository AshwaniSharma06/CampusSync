import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
  const { currentUser, logout, jwtToken } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    // Fetch user profile from FastAPI when JWT is ready
    if (jwtToken && currentUser) {
      apiService.getStudentProfile().then(profile => {
        setUserProfile({
          name: profile.full_name || currentUser.displayName || 'Ashwani Sharma',
          email: profile.email,
          department: profile.department || 'Computer Science & Engineering',
          studentId: profile.student_id || 'ECA2026-8941',
          semester: profile.semester || 7
        });
      }).catch(err => console.error("Failed to fetch profile", err));
    } else {
      setUserProfile(null);
    }
  }, [jwtToken, currentUser]);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    showToast(`Welcome back! Student portal loading...`);
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('Signed out of Student Portal.');
      navigate('/');
    } catch (e) {
      showToast('Error signing out.');
    }
  };

  const effectiveUser = userProfile || {
    name: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Ashwani Sharma'),
    email: currentUser?.email || 'ashwani.sharma@eca.ac.in',
    department: 'Computer Science & Engineering',
    studentId: 'ECA2026-8941',
    semester: 7
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-on-surface font-sans antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">

      {!isDashboard && (
        <Navbar
          onOpenSignIn={() => setIsAuthModalOpen(true)}
          onOpenAiAgent={() => setAiWidgetOpen(true)}
          currentUser={currentUser}
          onOpenPortalView={() => navigate('/dashboard')}
        />
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            <LandingPage 
              currentUser={currentUser} 
              showToast={showToast} 
              setIsAuthModalOpen={setIsAuthModalOpen} 
            />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={currentUser}>
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
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
    </ErrorBoundary>
  );
}

