import React, { useState, useEffect } from 'react';

export default function Navbar({ onOpenSignIn, onOpenSignUp, onOpenAiAgent, currentUser, onOpenPortalView }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'community', label: 'Community' },
    { id: 'clubs', label: 'Clubs' },
    { id: 'events', label: 'Events' },
    { id: 'curated', label: 'Curated' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sectionIds = ['home', 'community', 'clubs', 'events', 'curated'];
      const scrollPosition = window.scrollY + 140;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const secId = sectionIds[i];
        const el = document.getElementById(secId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(secId);
            return;
          }
        }
      }
      if (window.scrollY < 100) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, id) => {
    setMobileMenuOpen(false);
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const studentDisplayName = currentUser?.name || currentUser?.displayName || 'Student';
  const firstName = studentDisplayName.split(' ')[0] || 'Student';

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-outline-variant/10 ${
        scrolled
          ? 'bg-surface/90 backdrop-blur-xl shadow-lg'
          : 'bg-surface/80 backdrop-blur-xl shadow-sm'
      }`}
      id="main-nav"
    >
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className="font-sans text-2xl md:text-3xl font-extrabold text-primary tracking-tight leading-none z-20 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-base">
            <span className="material-symbols-outlined text-lg">school</span>
          </span>
          CampusSync
        </a>

        {/* Desktop Menu */}
        <div
          className={`hidden md:flex gap-5 lg:gap-7 items-center h-full ${
            mobileMenuOpen ? '!flex mobile-menu-active' : ''
          }`}
          id="mobile-menu"
        >
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                className={`h-full flex items-center font-sans text-xs uppercase tracking-[0.1em] transition-all py-2 md:py-0 ${
                  isActive
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary font-semibold'
                }`}
                href={`#${link.id}`}
                onClick={(e) => handleNavClick(e, link.id)}
              >
                {link.label}
              </a>
            );
          })}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAiAgent();
            }}
            className="text-primary hover:text-primary-fixed border border-primary/30 bg-primary/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-[0.1em] transition-all hover:bg-primary/20"
          >
            <span className="material-symbols-outlined text-sm">smart_toy</span>
            Campus AI
          </button>

          {/* Mobile-Only Action Controls */}
          <div className="md:hidden flex flex-col gap-2.5 w-full mt-4">
            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPortalView();
                }}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-[0.1em] transition-colors w-full flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                <span>{firstName}'s Dashboard</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSignIn('login');
                  }}
                  className="border border-outline/30 text-on-surface hover:text-white px-4 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-[0.1em]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSignUp();
                  }}
                  className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-sans text-xs font-bold uppercase tracking-[0.1em]"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls (Desktop) - Clean & Single State */}
        <div className="flex items-center gap-2.5 z-20">
          {!currentUser ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onOpenSignIn('login')}
                className="border border-outline/30 hover:border-primary text-on-surface hover:text-white px-4 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-[0.1em] transition-all"
              >
                Sign In
              </button>
              <button
                onClick={onOpenSignUp}
                className="bg-primary text-on-primary hover:bg-primary-fixed px-5 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-[0.1em] transition-all glow-hover shadow-sm"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenPortalView}
              className="hidden sm:flex items-center gap-2 bg-primary text-on-primary hover:bg-primary-fixed px-5 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-[0.1em] transition-all glow-hover shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              <span>{firstName}'s Dashboard</span>
            </button>
          )}

          <button
            className="md:hidden text-primary p-2 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-3xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
