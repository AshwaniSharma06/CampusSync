import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import CoreNetworkSection from './components/sections/CoreNetworkSection';
import CommunityFeed from './components/sections/CommunityFeed';
import ClubsSection from './components/sections/ClubsSection';
import EventsSection from './components/sections/EventsSection';
import CuratedForYou from './components/sections/CuratedForYou';
import CampusAiSection from './components/sections/CampusAiSection';
import CtaSection from './components/sections/CtaSection';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';

export default function App() {
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleOpenPortal = () => {
    showToast('Student Portal authentication is coming soon! Landing page preview active.');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-lg antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <Navbar onOpenPortal={handleOpenPortal} />
      <main>
        <Hero
          onEnter={() => {
            const el = document.getElementById('features');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onExplore={() => {
            const el = document.getElementById('community');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <CoreNetworkSection />
        <CommunityFeed onActionNotification={showToast} />
        <ClubsSection onActionNotification={showToast} />
        <EventsSection onActionNotification={showToast} />
        <CuratedForYou onActionNotification={showToast} />
        <CampusAiSection />
        <CtaSection onOpenPortal={handleOpenPortal} />
      </main>
      <Footer onActionNotification={showToast} />
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
