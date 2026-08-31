import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import CommunityFeed from './components/sections/CommunityFeed';
import ClubsSection from './components/sections/ClubsSection';
import EventsSection from './components/sections/EventsSection';
import CuratedForYou from './components/sections/CuratedForYou';
import CampusAiSection from './components/sections/CampusAiSection';
import CtaSection from './components/sections/CtaSection';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import AiWidget from './components/ui/AiWidget';
import AuthModal from './components/ui/AuthModal';
import StudentDashboard from './components/portal/StudentDashboard';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [aiWidgetOpen, setAiWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('landing'); // 'landing' or 'dashboard'

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthModalOpen(false);
    setViewMode('dashboard');
    showToast(`Welcome back, ${userData.name}! Student portal loaded.`);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setViewMode('landing');
    showToast('Signed out of Student Portal.');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <Navbar
        onOpenSignIn={() => setIsAuthModalOpen(true)}
        onOpenAiAgent={() => setAiWidgetOpen(true)}
        currentUser={currentUser}
        onOpenPortalView={() => setViewMode('dashboard')}
      />

      {viewMode === 'dashboard' && currentUser ? (
        <main>
          {/* Header Banner to Return to Landing Page */}
          <div className="bg-surface-container border-b border-outline/10 pt-20 px-margin-mobile md:px-margin-desktop text-center py-2">
            <button
              onClick={() => setViewMode('landing')}
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
        <main>
          <Hero
            onEnter={() => {
              const el = document.getElementById('community');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onExplore={() => {
              const el = document.getElementById('clubs');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <CommunityFeed onActionNotification={showToast} />
          <ClubsSection onActionNotification={showToast} />
          <EventsSection onActionNotification={showToast} />
          <CuratedForYou onActionNotification={showToast} />
          <CampusAiSection />
          <CtaSection onOpenSignIn={() => setIsAuthModalOpen(true)} />
        </main>
      )}

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
