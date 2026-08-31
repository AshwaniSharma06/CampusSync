import React from 'react';

export default function Footer({ onActionNotification }) {
  const handleLinkClick = (e, linkName) => {
    e.preventDefault();
    onActionNotification(`Navigating to ${linkName}...`);
  };

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/10 w-full py-section-gap mt-8 md:mt-section-gap">
      <div className="grid grid-cols-1 md:grid-cols-4 px-margin-mobile md:px-margin-desktop gap-8 md:gap-gutter max-w-container-max mx-auto">
        <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
          <div className="font-serif text-3xl md:text-4xl text-primary font-brand">CampusSync</div>
          <p className="font-sans text-on-surface-variant mt-2 md:mt-4 text-sm leading-relaxed">
            © 2026 CampusSync Institutional. All rights reserved.
          </p>
        </div>
        <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 font-sans">
          <div className="flex flex-col gap-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-[0.12em] mb-2">Legal</h5>
            <a
              onClick={(e) => handleLinkClick(e, 'Privacy Policy')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'Terms of Service')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Terms of Service
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-[0.12em] mb-2">Campus</h5>
            <a
              onClick={(e) => handleLinkClick(e, 'Campus Map')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Campus Map
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'Directory')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Directory
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'Library Resources')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Library Resources
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-[0.12em] mb-2">Community</h5>
            <a
              onClick={(e) => handleLinkClick(e, 'Clubs & Orgs')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#clubs"
            >
              Clubs &amp; Orgs
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'Events Calendar')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#events"
            >
              Events Calendar
            </a>
            <a
              onClick={(e) => handleLinkClick(e, 'Student Council')}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm"
              href="#"
            >
              Student Council
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
