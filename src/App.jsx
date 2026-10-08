import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import AiWidget from './components/ui/AiWidget';
import AuthModal from './components/ui/AuthModal';
import StudentDashboard from './components/portal/StudentDashboard';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { apiService } from './services/apiService';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [aiWidgetOpen, setAiWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { currentUser, logout, jwtToken } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    // Fetch user profile from FastAPI when JWT is ready
    if (jwtToken && currentUser) {
      apiService.getStudentProfile().then(profile => {
        setUserProfile({
          name: profile.full_name || currentUser.displayName,
          email: profile.email,
          department: profile.department,
          studentId: profile.student_id,
          semester: profile.semester
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

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <Navbar
        onOpenSignIn={() => setIsAuthModalOpen(true)}
        onOpenAiAgent={() => setAiWidgetOpen(true)}
        currentUser={currentUser}
        onOpenPortalView={() => navigate('/dashboard')}
      />

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
              <main>
                <div className="bg-surface-container border-b border-outline/10 pt-20 px-margin-mobile md:px-margin-desktop text-center py-2">
                  <button
                    onClick={() => navigate('/')}
                    className="text-xs text-primary font-bold uppercase tracking-wider hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Return to CampusSync Landing Page
                  </button>
                </div>
                <StudentDashboard
                  user={userProfile || { name: currentUser?.email }}
                  onSignOut={handleSignOut}
                  onActionNotification={showToast}
                />
              </main>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer onActionNotification={showToast} />
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      <AiWidget isOpenExternal={aiWidgetOpen} setIsOpenExternal={setAiWidgetOpen} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
