import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#04132a] text-[#d7e3ff] flex items-center justify-center p-6 selection:bg-[#71d8c8] selection:text-[#04132a] relative overflow-hidden">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#71d8c8]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#e6c277]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full bg-[#112037]/80 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="material-symbols-outlined text-sm">error</span> HTTP 404 • Resource Not Found
        </div>

        <div className="font-serif text-8xl sm:text-9xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-[#71d8c8] to-[#e6c277] mb-4">
          404
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
          Academic Record Relocated
        </h1>

        <p className="font-sans text-sm sm:text-base text-[#d7e3ff]/70 mb-8 max-w-md mx-auto leading-relaxed">
          The lecture hall, notice, or academic resource you are seeking does not exist or may have been archived in the semester transition.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#71d8c8] hover:bg-[#5bc2b2] text-[#04132a] text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#71d8c8]/10 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">home</span>
            Return to Homepage
          </Link>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-white/15 hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            Student Dashboard
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-6 text-xs text-[#d7e3ff]/50 font-medium">
          <span>Need help? CampusSync AI is standing by</span>
        </div>
      </div>
    </div>
  );
}
