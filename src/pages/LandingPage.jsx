import React from 'react';
import Hero from '../components/sections/Hero';
import CommunityFeed from '../components/sections/CommunityFeed';
import ClubsSection from '../components/sections/ClubsSection';
import EventsSection from '../components/sections/EventsSection';
import CuratedForYou from '../components/sections/CuratedForYou';
import CampusAiSection from '../components/sections/CampusAiSection';
import CtaSection from '../components/sections/CtaSection';

export default function LandingPage({ currentUser, showToast, setIsAuthModalOpen }) {
  return (
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
      <CommunityFeed currentUser={currentUser} onActionNotification={showToast} />
      <ClubsSection onActionNotification={showToast} />
      <EventsSection onActionNotification={showToast} />
      <CuratedForYou onActionNotification={showToast} />
      <CampusAiSection />
      <CtaSection onOpenSignIn={() => setIsAuthModalOpen(true)} />
    </main>
  );
}
