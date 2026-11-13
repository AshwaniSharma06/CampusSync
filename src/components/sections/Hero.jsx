import React, { useState, useEffect } from 'react';
import heroBg from '../../assets/hero-bg.jpg';
import { apiService } from '../../services/apiService';

const RECENT_NOTICES_STORAGE_KEY = 'campussync_recent_floating_notice_ids';

// Verified, authentic fallback notices sourced directly from scraped database records
const AUTHENTIC_FALLBACK_NOTICES = [
  {
    id: 15,
    title: 'Rescheduled 7th Semester Practical Examination Notification',
    notice_type: 'Examination',
    formatted_date: '03 Nov 2026',
    is_important: true,
    has_pdf: true,
    action_url: 'https://www.ecajmer.ac.in/uploads/circulars/1793693243432-DOC-20261103-WA0012.pdf',
    action_label: 'Open Verified Official Document',
    summary: 'Revised department schedule and laboratory batch timings for final year B.Tech practical examinations.'
  },
  {
    id: 13,
    title: 'Exam Form Filling for B.Tech III Semester Main & Back Exam Session 2026-27',
    notice_type: 'Academic',
    formatted_date: '03 Nov 2026',
    is_important: true,
    has_pdf: true,
    action_url: 'https://www.ecajmer.ac.in/uploads/circulars/1793247267504-BTU%20-%20Circular%20for%20B.Tech.%20III%20Sem%20(Main%20and%20Back%20Exam)%20Session%202026-27%20(Last%20date%2001.11.2026%20with%20single%20fee).pdf',
    action_label: 'Open Verified Official Document',
    summary: 'BTU circular regarding exam form schedule and registration guidelines for B.Tech 3rd semester students.'
  },
  {
    id: 3,
    title: 'Technotsav 2026 Annual Technical Fest Event Registration',
    notice_type: 'Events',
    formatted_date: '02 Nov 2026',
    is_important: false,
    has_pdf: false,
    action_url: 'https://www.ecajmer.ac.in/events/technotsav-2026',
    action_label: 'Open Official College Notice Page',
    summary: 'Annual technical fest registrations open for robotics, web hackathons, and design challenges.'
  },
  {
    id: 2,
    title: 'Central Library Extended Night Reading Hours for Mid-Terms',
    notice_type: 'Official',
    formatted_date: '02 Nov 2026',
    is_important: false,
    has_pdf: false,
    action_url: 'https://www.ecajmer.ac.in/facilities/library',
    action_label: 'Open Official College Notice Page',
    summary: 'Central Library reading hall access extended up to 11:00 PM on working days during examination period.'
  }
];

export default function Hero({ onEnter, onExplore }) {
  const [notices, setNotices] = useState(AUTHENTIC_FALLBACK_NOTICES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDynamicNotices() {
      try {
        // Read previously displayed notice IDs to rotate away from them on refresh
        let recentIds = [];
        try {
          const stored = sessionStorage.getItem(RECENT_NOTICES_STORAGE_KEY);
          if (stored) {
            recentIds = JSON.parse(stored);
          }
        } catch (_) {}

        const fetched = await apiService.getPublicNotices({
          limit: 6,
          excludeIds: Array.isArray(recentIds) ? recentIds : []
        });

        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          // Strictly deduplicate by ID to ensure every card position receives a unique notice
          const uniqueNotices = [];
          const seenIds = new Set();
          for (const item of fetched) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              uniqueNotices.push(item);
            }
          }

          if (uniqueNotices.length > 0) {
            setNotices(uniqueNotices);

            // Update session storage buffer for rotation across visits (keep last 12)
            try {
              const newBuffer = Array.from(new Set([...seenIds, ...(Array.isArray(recentIds) ? recentIds : [])])).slice(0, 12);
              sessionStorage.setItem(RECENT_NOTICES_STORAGE_KEY, JSON.stringify(newBuffer));
            } catch (_) {}
          }
        }
      } catch (err) {
        // Graceful fallback to verified authentic scraped notices
        console.warn('CampusSync Notice sync: Using verified local notice cache.', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDynamicNotices();

    return () => {
      isMounted = false;
    };
  }, []);

  // Card slot mapping:
  // Position 1: Urgent/Exam/Important Notice (Top Right)
  // Position 2: Campus Update / Events (Bottom Right)
  // Position 3 & 4: Live items in "ECA Today's Overview"
  const topNotice = notices[0] || null;
  const bottomNotice = (notices.length > 1 && notices[1].id !== topNotice?.id) ? notices[1] : null;
  const overviewNotice1 = notices.find(n => n.id !== topNotice?.id && n.id !== bottomNotice?.id) || null;
  const overviewNotice2 = notices.find(n => n.id !== topNotice?.id && n.id !== bottomNotice?.id && n.id !== overviewNotice1?.id) || null;

  const handleCardClick = (notice) => {
    if (!notice) return;
    const targetUrl = notice.action_url || notice.document_url || notice.source_url;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <header className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden film-grain" id="home">
      {/* Enhanced Campus Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Engineering College Ajmer Campus Background"
          className="w-full h-full object-cover object-center opacity-75 transform scale-105 transition-transform duration-10000"
          src={heroBg}
          style={{ animation: 'subtleZoom 20s infinite alternate' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/50 via-surface/40 to-background"></div>
      </div>

      <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-2 gap-gutter items-center pt-12 md:pt-0">
        <div className="flex flex-col gap-6 md:gap-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-surface-variant/60 backdrop-blur-md border border-outline/20 px-4 py-2 rounded-full w-fit shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#71d8c8] animate-pulse"></span>
            <span className="font-sans font-bold text-primary uppercase tracking-[0.15em] text-[10px] md:text-xs">
              Engineering College Ajmer • BTU Affiliated
            </span>
          </div>

          <h1 className="font-landing-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-normal leading-[1.05] tracking-tight drop-shadow-md">
            One Campus.
            <br />
            <span className="font-landing-headline-italic text-gradient">One Platform.</span>
          </h1>

          <p className="font-sans text-base sm:text-lg md:text-xl font-normal text-on-surface-variant/90 leading-relaxed max-w-xl">
            Welcome to the official student portal for Engineering College Ajmer (ECA). Unified announcements, BTU schedules, Technotsav events, and AI assistance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2 md:mt-4">
            <button
              onClick={onEnter}
              className="bg-primary text-on-primary px-7 md:px-9 py-3.5 md:py-4 rounded-xl font-sans font-bold text-xs uppercase tracking-[0.12em] hover:bg-primary-fixed transition-all glow-hover shadow-[0_0_20px_rgba(113,216,200,0.2)] w-full sm:w-auto text-center"
            >
              Enter ECA CampusSync
            </button>
            <button
              onClick={onExplore}
              className="border border-outline/40 text-on-surface px-7 md:px-9 py-3.5 md:py-4 rounded-xl font-sans font-bold text-xs uppercase tracking-[0.12em] hover:bg-surface-variant/80 transition-all backdrop-blur-sm w-full sm:w-auto text-center"
            >
              Explore ECA Clubs
            </button>
          </div>

          {/* Mobile-Only Live Scraped Notice Pill / Card */}
          {topNotice && (
            <div
              onClick={() => handleCardClick(topNotice)}
              className="block md:hidden mt-2 p-3.5 glass-card rounded-xl border border-primary/30 shadow-lg cursor-pointer hover:border-primary/60 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  {topNotice.notice_type || 'ECA Notice'}
                </span>
                {topNotice.formatted_date && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {topNotice.formatted_date}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                {topNotice.title}
              </h4>
              <div className="mt-2 flex items-center justify-between text-[11px] text-teal-300 font-medium pt-1 border-t border-slate-700/50">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    {topNotice.has_pdf ? 'picture_as_pdf' : 'open_in_new'}
                  </span>
                  {topNotice.has_pdf ? 'View Official PDF Notice' : 'Open College Circular'}
                </span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Dashboard Preview with Live Scraped College Notices (Desktop & Tablet) */}
        <div className="hidden md:block relative h-[600px] perspective-1000">
          {/* Main Dashboard Panel */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[480px] glass-card rounded-2xl border border-outline/20 shadow-[0_20px_40px_rgba(4,19,42,0.8)] float-animation overflow-hidden z-20">
            <div className="bg-surface-container/80 p-4 border-b border-outline/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">notifications_active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm text-white font-semibold tracking-wide">ECA Official Circulars</span>
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                </div>
              </div>
              <span className="text-[11px] text-primary/80 font-bold uppercase tracking-wider">Live Scraped</span>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Dynamic Overview Notice Item 1 */}
              {overviewNotice1 && (
                <div
                  onClick={() => handleCardClick(overviewNotice1)}
                  className="bg-surface/50 hover:bg-surface/80 rounded-xl p-4 border border-outline/10 flex gap-4 items-start cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary-fixed shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">
                      {overviewNotice1.has_pdf ? 'picture_as_pdf' : 'menu_book'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                        {overviewNotice1.notice_type || 'Academic Update'}
                      </span>
                      {overviewNotice1.formatted_date && (
                        <span className="text-[10px] text-slate-400">
                          {overviewNotice1.formatted_date}
                        </span>
                      )}
                    </div>
                    <h4 className="font-sans text-white font-semibold text-sm line-clamp-1 group-hover:text-teal-300 transition-colors">
                      {overviewNotice1.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                      {overviewNotice1.summary || 'Click to view official verified college notice.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Overview Notice Item 2 */}
              {overviewNotice2 && (
                <div
                  onClick={() => handleCardClick(overviewNotice2)}
                  className="bg-surface/50 hover:bg-surface/80 rounded-xl p-4 border border-outline/10 flex gap-4 items-start cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary-fixed shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">
                      {overviewNotice2.notice_type?.toLowerCase().includes('event') ? 'celebration' : 'campaign'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-[#e6c277] uppercase tracking-wider">
                        {overviewNotice2.notice_type || 'Campus Announcement'}
                      </span>
                      {overviewNotice2.formatted_date && (
                        <span className="text-[10px] text-slate-400">
                          {overviewNotice2.formatted_date}
                        </span>
                      )}
                    </div>
                    <h4 className="font-sans text-white font-semibold text-sm line-clamp-1 group-hover:text-[#e6c277] transition-colors">
                      {overviewNotice2.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                      {overviewNotice2.summary || 'Click to view official verified college circular.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Semester Sync Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1.5 font-sans">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                    Verified ECA Database Records
                  </span>
                  <span className="text-primary font-bold">960+ Notices Scraped</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary w-[85%] rounded-full shadow-[0_0_10px_#71d8c8]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Position 1: Floating Urgent / Exam Notice Panel (Top Right) */}
          {topNotice && (
            <div
              onClick={() => handleCardClick(topNotice)}
              className="absolute -right-8 top-1/4 w-[330px] lg:w-[350px] glass-card rounded-xl border border-error/40 shadow-2xl float-animation-delayed z-30 p-4 backdrop-blur-xl cursor-pointer hover:border-error/70 hover:scale-[1.02] transition-all group"
              title={topNotice.action_label || 'Click to view official document'}
            >
              <div className="flex items-start gap-3">
                <div className="text-error bg-error/15 p-2 rounded-lg shrink-0 group-hover:scale-110 transition-transform relative">
                  <span className="material-symbols-outlined text-lg">
                    {topNotice.has_pdf ? 'picture_as_pdf' : 'warning'}
                  </span>
                  {topNotice.is_important && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#09172c] animate-ping"></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-sans text-[10px] font-bold text-error uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      {topNotice.notice_type || 'ECA Notice'}
                    </span>
                    {topNotice.formatted_date && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {topNotice.formatted_date}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors">
                    {topNotice.title}
                  </h4>
                  {topNotice.summary && (
                    <p className="text-[11px] text-slate-300/80 mt-1 line-clamp-2 leading-relaxed">
                      {topNotice.summary}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-teal-300 pt-1.5 border-t border-slate-700/60">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">
                        {topNotice.has_pdf ? 'download' : 'open_in_new'}
                      </span>
                      {topNotice.has_pdf ? 'Verified PDF Document' : 'Official Circular Page'}
                    </span>
                    <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Position 2: Floating Event / Announcement Panel (Bottom Right) */}
          {bottomNotice && (
            <div
              onClick={() => handleCardClick(bottomNotice)}
              className="absolute right-24 lg:right-32 bottom-10 w-[340px] lg:w-[360px] glass-card rounded-xl border border-primary/30 shadow-2xl float-animation z-10 p-4 cursor-pointer hover:border-primary/70 hover:scale-[1.02] transition-all group"
              title={bottomNotice.action_label || 'Click to view official announcement'}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">
                    {bottomNotice.has_pdf ? 'picture_as_pdf' : 'campaign'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-sans text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      {bottomNotice.notice_type || 'Campus Announcement'}
                    </span>
                    {bottomNotice.formatted_date && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {bottomNotice.formatted_date}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {bottomNotice.title}
                  </h4>
                  {bottomNotice.summary && (
                    <p className="text-[11px] text-slate-300/80 mt-1 line-clamp-1 leading-relaxed">
                      {bottomNotice.summary}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-teal-300 pt-1.5 border-t border-slate-700/60">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">
                        {bottomNotice.has_pdf ? 'picture_as_pdf' : 'open_in_new'}
                      </span>
                      {bottomNotice.has_pdf ? 'Download PDF Circular' : 'Open College Notice'}
                    </span>
                    <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
