import React from 'react';
import CampusSyncLogo from '../ui/CampusSyncLogo';

export default function Footer({ onActionNotification }) {
  const handleLinkClick = (e, linkName) => {
    e.preventDefault();
    onActionNotification(`Navigating to ${linkName}...`);
  };

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/10 w-full py-section-gap mt-8 md:mt-section-gap">
      <div className="grid grid-cols-1 md:grid-cols-4 px-margin-mobile md:px-margin-desktop gap-8 md:gap-gutter max-w-container-max mx-auto">
        <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
          <div className="mb-1">
            <CampusSyncLogo variant="horizontal" theme="dark" size={42} className="h-10 md:h-11 w-auto" />
          </div>
          <p className="font-sans text-on-surface-variant mt-2 text-sm leading-relaxed">
            Engineering College Ajmer (ECA)
            <br />
            Badliya Chouraha, N.H.8, Ajmer, Rajasthan 305025
            <br />
            <span className="text-xs text-primary/80 mt-1 inline-block">Affiliated with BTU • Approved by AICTE</span>
          </p>
          <p className="font-sans text-xs text-on-surface-variant/70 mt-1">
            © 2026 Engineering College Ajmer. All rights reserved.
          </p>
        </div>
        <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 font-sans">
          <div className="flex flex-col gap-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-[0.12em] mb-2">ECA Portal</h5>
            <a
              onClick={(e) => handleLinkClick(e, 'BTU Syllabus & Orders')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              BTU Orders &amp; Syllabus
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'LEEP / REAP Admissions')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              LEEP / REAP Admissions
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-[0.12em] mb-2">Campus</h5>
            <a
              onClick={(e) => handleLinkClick(e, 'ECA Barliya Campus Map')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Barliya Campus Map
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'Faculty Directory')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Faculty Directory
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'ECA Library')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Central Library
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-[0.12em] mb-2">Student Life &amp; Community</h5>
            {/* Events links temporarily suspended for Semester 7 (Preserved for Semester 8 - Major Project Phase 2) */}
            <a
              onClick={(e) => handleLinkClick(e, 'Campus Community')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#community"
            >
              Campus Community
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'Curated Notices')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#curated"
            >
              Curated Academic Feed
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
