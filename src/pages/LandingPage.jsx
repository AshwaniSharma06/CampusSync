import React from 'react';
import Hero from '../components/sections/Hero';
import CommunityFeed from '../components/sections/CommunityFeed';
// ClubsSection preserved for Semester 8 (Project Phase 2)
// import ClubsSection from '../components/sections/ClubsSection';
// EventsSection preserved for Semester 8 (Major Project Phase 2)
// import EventsSection from '../components/sections/EventsSection';
import CuratedForYou from '../components/sections/CuratedForYou';
import CampusAiSection from '../components/sections/CampusAiSection';
import CtaSection from '../components/sections/CtaSection';

export default function LandingPage({ currentUser, showToast, onOpenAuth }) {
  return (
    <main>
      <Hero
        onEnter={() => {
          const el = document.getElementById('community');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSignUp={() => onOpenAuth?.('signup')}
      />
      <CommunityFeed
        currentUser={currentUser}
        onActionNotification={showToast}
        onRequireAuth={() => onOpenAuth?.('login')}
      />
      {/* ECA Clubs temporarily disabled for Semester 7 (Reintroduced in Sem 8 - Project Phase 2) */}
      {/* Events temporarily disabled for Semester 7 (Reintroduced in Sem 8 - Major Project Phase 2) */}
      {/* <EventsSection onActionNotification={showToast} /> */}
      <CuratedForYou
        currentUser={currentUser}
        onActionNotification={showToast}
        onOpenAuth={onOpenAuth}
      />
      <CampusAiSection />
      <CtaSection onOpenAuth={onOpenAuth} />
    </main>
  );
}
