import React from 'react';
import heroBg from '../../assets/hero-bg.jpg';

export default function Hero({ onEnter, onExplore }) {
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
              Engineering College Ajmer • BTU & RTU Affiliated
            </span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-normal leading-[1.05] tracking-tight drop-shadow-md">
            One Campus.
            <br />
            <span className="font-serif-italic text-gradient">One Platform.</span>
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
                <span className="font-sans text-sm text-white font-semibold tracking-wide">ECA Today's Overview</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">more_horiz</span>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-surface/50 rounded-xl p-4 border border-outline/10 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <h4 className="font-sans text-white font-semibold">Advanced AI & ML Lab (CSE VII Sem)</h4>
                  <p className="text-sm text-on-surface-variant mt-1">10:00 AM - Barliya Block, Room 402</p>
                </div>
              </div>
              <div className="bg-surface/50 rounded-xl p-4 border border-outline/10 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary-fixed">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <div>
                  <h4 className="font-sans text-white font-semibold">Creative Art Society Workshop</h4>
                  <p className="text-sm text-on-surface-variant mt-1">2:00 PM - ECA Central Auditorium</p>
                </div>
              </div>
              {/* Progress */}
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-2 font-sans">
                  <span className="text-on-surface-variant">BTU Semester Progress</span>
                  <span className="text-primary font-bold">65%</span>
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
                <h4 className="font-sans text-[11px] font-bold text-error uppercase tracking-wider">ECA Notice</h4>
                <p className="text-sm text-white font-medium mt-1">B.Tech III, V, VII Sem BTU Exam Registration Schedule Released.</p>
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
                <h4 className="font-sans text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Upcoming Event</h4>
                <p className="text-sm text-white font-semibold line-clamp-2">Technotsav 2026 - ECA Tech Fest</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
