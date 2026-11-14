import React from 'react';

/**
 * Floating Campus AI Quick Action Button
 *
 * Implements Task 13:
 * - Direct navigation to the Campus AI section (#ai-assistant)
 * - Identical smooth navigation behavior on desktop and mobile
 * - Automatically positions and focuses the Campus AI chat interface
 */
export default function AiWidget({ onNavigateToAi }) {
  const handleClick = (e) => {
    if (e) e.preventDefault();
    if (onNavigateToAi) {
      onNavigateToAi();
      return;
    }

    const el = document.getElementById('ai-assistant');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const input = document.getElementById('campus-ai-input');
        if (input) input.focus();
      }, 450);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <aside 
      className="fixed bottom-6 right-6 z-40 flex items-center justify-end"
      aria-label="Campus AI Assistant Navigation"
    >
      <button
        type="button"
        onClick={handleClick}
        className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-2xl bg-teal-600/95 hover:bg-teal-500 text-white shadow-[0_10px_30px_rgba(20,184,166,0.4)] border border-teal-400/40 hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-md cursor-pointer"
        title="Open Campus AI Assistant (Navigate to section)"
        aria-label="Navigate to Campus AI Section"
      >
        <div className="relative flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-white group-hover:rotate-6 transition-transform">
            smart_toy
          </span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-900 animate-pulse"></span>
        </div>
        <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider text-white">
          Campus AI
        </span>
      </button>
    </aside>
  );
}
