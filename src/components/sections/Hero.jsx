import React from 'react';

export default function Hero({ onEnter, onExplore }) {
  return (
    <header className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden film-grain" id="home">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Campus background"
          className="w-full h-full object-cover object-center opacity-70 transform scale-105 transition-transform duration-10000"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtGnaPng_QLBwZTULZMw46KDSbf5wUlTHNaZT8OmQSZLGm3qWfgpey-Cy7yR6DbfSt2H45tYou6EXGpEj4Xwzq3O0_7DFBQ79K5JxggG--n_o33zgM_YJtCXTm9xN8ExoX9qOn494AX49HrlzGZ2rOb4R8owCwY3s3V5XyLTvwB7kZ8lJ0bc_TdyfeAQhXdzfQ5JM2yhhJO1K6h9dLbWGAEjqKLDbQ8akxU_jNAYSUwDwhVg9B_6uPqtxQv9pC3bOK6vs"
          style={{ animation: 'subtleZoom 20s infinite alternate' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/40 to-background"></div>
      </div>

      <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-2 gap-gutter items-center pt-12 md:pt-0">
        <div className="flex flex-col gap-6 md:gap-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-surface-variant/50 backdrop-blur border border-outline/20 px-4 py-2 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#71d8c8] animate-pulse"></span>
            <span className="font-label-sm text-primary uppercase text-[10px] md:text-xs">The New Standard</span>
          </div>
          <h1 className="font-display-lg text-4xl md:text-6xl text-white leading-tight">
            Your Entire <span className="text-gradient">Campus.</span>
            <br />
            Connected.
          </h1>
          <p className="font-body-lg text-base md:text-lg text-on-surface-variant max-w-xl">
            CampusSync brings announcements, schedules, events, resources and intelligent academic assistance into one beautifully connected student experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2 md:mt-4">
            <button
              onClick={onEnter}
              className="bg-primary text-on-primary px-6 md:px-8 py-3 md:py-4 rounded-xl font-label-sm uppercase tracking-wider hover:bg-primary-fixed transition-colors glow-hover shadow-[0_0_20px_rgba(113,216,200,0.2)] w-full sm:w-auto text-center"
            >
              Enter CampusSync
            </button>
            <button
              onClick={onExplore}
              className="border border-outline text-on-surface px-6 md:px-8 py-3 md:py-4 rounded-xl font-label-sm uppercase tracking-wider hover:bg-surface-variant transition-colors backdrop-blur-sm w-full sm:w-auto text-center"
            >
              Explore the Experience
            </button>
          </div>
        </div>

        {/* Floating Dashboard Preview (Desktop) */}
        <div className="hidden md:block relative h-[600px] perspective-1000">
          {/* Main Dashboard Panel */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[480px] glass-card rounded-2xl border border-outline/20 shadow-[0_20px_40px_rgba(4,19,42,0.8)] float-animation overflow-hidden z-20">
            <div className="bg-surface-container/80 p-4 border-b border-outline/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">person</span>
                </div>
                <span className="font-body-md text-white font-semibold">Today's Overview</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">more_horiz</span>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-surface/50 rounded-xl p-4 border border-outline/10 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <h4 className="font-body-md text-white">Advanced Physics Lab</h4>
                  <p className="text-sm text-on-surface-variant mt-1">10:00 AM - Science Bldg, Room 402</p>
                </div>
              </div>
              <div className="bg-surface/50 rounded-xl p-4 border border-outline/10 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary-fixed">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <div>
                  <h4 className="font-body-md text-white">Study Group: Calculus</h4>
                  <p className="text-sm text-on-surface-variant mt-1">2:00 PM - Main Library, Pod B</p>
                </div>
              </div>
              {/* Progress */}
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant">Daily Progress</span>
                  <span className="text-primary font-semibold">65%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%] rounded-full shadow-[0_0_10px_#71d8c8]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Notice Panel */}
          <div className="absolute -right-8 top-1/4 w-[320px] glass-card rounded-xl border border-error/30 shadow-xl float-animation-delayed z-30 p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="text-error bg-error/10 p-2 rounded-lg">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h4 className="font-label-sm text-error uppercase tracking-wider">Urgent Notice</h4>
                <p className="text-sm text-white mt-1">Mid-term Examination Schedule Updated. Check portal.</p>
              </div>
            </div>
          </div>

          {/* Floating Event Panel */}
          <div className="absolute right-32 bottom-12 w-[340px] glass-card rounded-xl border border-primary/20 shadow-xl float-animation z-10 p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB5jXPfylE7j7JakUiF0du50ydq0KIO56XHDyCkmlO8GOfN58YJF5G51zKxzmpZQUwF7mq1rJMJQ3nA2AhH5rGGrTR2r2XUF327OlBFufQcgfzgcaZcwjNWx2HQLRdodIrRRHuZCLZQFc05JrvoyfVjncwpixl3UReuf9Iekhqyxu6xguOhf57MVXjAGfebQVodbOqoEx0d6EEDtu91R8PlUkNplfQs03asa7ccpRnUdz7yGr8BNv78VA")',
                  }}
                ></div>
              </div>
              <div>
                <h4 className="font-label-sm text-primary uppercase tracking-wider mb-1">Upcoming Event</h4>
                <p className="text-sm text-white font-semibold line-clamp-2">Annual Tech Symposium 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
