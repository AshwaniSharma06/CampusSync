import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import AiWidget from './components/ui/AiWidget';
import AuthModal from './components/ui/AuthModal';
import StudentDashboard from './components/portal/StudentDashboard';
import LandingPage from './pages/LandingPage';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [aiWidgetOpen, setAiWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${userData.name}! Student portal loaded.`);
    navigate('/dashboard');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    showToast('Signed out of Student Portal.');
    navigate('/');
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
            currentUser ? (
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
                  user={currentUser}
                  onSignOut={handleSignOut}
                  onActionNotification={showToast}
                />
              </main>
            ) : (
              <Navigate to="/" replace />
            )
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
