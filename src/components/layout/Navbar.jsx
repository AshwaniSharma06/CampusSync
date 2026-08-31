import React, { useState, useEffect } from 'react';

export default function Navbar({ onOpenPortal, onOpenAiAgent }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <a href="#" className="font-serif text-3xl md:text-4xl font-normal text-primary tracking-tight leading-none z-20 font-brand">
          CampusSync
        </a>

        {/* Desktop Menu */}
        <div
          className={`hidden md:flex gap-8 items-center h-full ${
            mobileMenuOpen ? '!flex mobile-menu-active' : ''
          }`}
          id="mobile-menu"
        >
          <a
            className="text-primary border-b-2 border-primary pb-1 h-full flex items-center font-sans text-xs uppercase tracking-[0.1em] font-bold"
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors h-full flex items-center font-sans text-xs uppercase tracking-[0.1em] font-semibold hover:bg-surface-bright/50 transition-all duration-300 md:px-4 rounded-xl md:my-2 py-2 md:py-0 w-full md:w-auto"
            href="#community"
            onClick={() => setMobileMenuOpen(false)}
          >
            Community
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors h-full flex items-center font-sans text-xs uppercase tracking-[0.1em] font-semibold hover:bg-surface-bright/50 transition-all duration-300 md:px-4 rounded-xl md:my-2 py-2 md:py-0 w-full md:w-auto"
            href="#clubs"
            onClick={() => setMobileMenuOpen(false)}
          >
            Clubs
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors h-full flex items-center font-sans text-xs uppercase tracking-[0.1em] font-semibold hover:bg-surface-bright/50 transition-all duration-300 md:px-4 rounded-xl md:my-2 py-2 md:py-0 w-full md:w-auto"
            href="#events"
            onClick={() => setMobileMenuOpen(false)}
          >
            Events
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors h-full flex items-center font-sans text-xs uppercase tracking-[0.1em] font-semibold hover:bg-surface-bright/50 transition-all duration-300 md:px-4 rounded-xl md:my-2 py-2 md:py-0 w-full md:w-auto"
            href="#curated"
            onClick={() => setMobileMenuOpen(false)}
          >
            Curated
          </a>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAiAgent();
            }}
            className="text-primary hover:text-primary-fixed border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-[0.1em] transition-all hover:bg-primary/20"
          >
            <span className="material-symbols-outlined text-sm">smart_toy</span>
            AI Copilot
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenPortal();
            }}
            className="md:hidden bg-primary text-on-primary px-6 py-2.5 rounded-full font-sans text-xs font-bold uppercase tracking-[0.1em] hover:bg-primary-fixed transition-colors mt-4 w-full"
          >
            Student Portal
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 z-20">
          <button
            onClick={onOpenPortal}
            className="hidden md:flex bg-primary text-on-primary px-6 py-2.5 rounded-full font-sans text-xs font-bold uppercase tracking-[0.12em] hover:bg-primary-fixed transition-colors glow-hover scale-95 active:scale-90 transition-transform"
          >
            Student Portal
          </button>
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
