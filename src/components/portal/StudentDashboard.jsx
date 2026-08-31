import React, { useState } from 'react';

export default function StudentDashboard({ user, onSignOut, onActionNotification }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans pt-24 pb-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto animate-in fade-in duration-300">
      {/* Dashboard Top Header */}
      <div className="glass-card rounded-3xl p-6 md:p-8 mb-8 border border-outline/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-2xl shadow-lg">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-0.5 rounded-full text-xs font-bold text-primary mb-1 uppercase tracking-wider">
              Student Portal Active • 2026
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Welcome back, {user.name}!</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {user.department || 'Computer Science'} • ID: {user.studentId || 'CS2026-8941'} • Semester V
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onActionNotification('Viewing student profile settings...')}
            className="border border-outline/30 text-on-surface hover:bg-surface-bright px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Profile
          </button>
          <button
            onClick={onSignOut}
            className="bg-error/20 text-error border border-error/30 hover:bg-error/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="glass-card rounded-2xl p-5 border border-outline/10">
          <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Current GPA</span>
          <div className="text-3xl font-serif text-primary mt-2 font-normal">3.85 / 4.0</div>
          <span className="text-xs text-primary font-medium mt-1 inline-block">Top 5% in Dept</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-outline/10">
          <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Attendance Rate</span>
          <div className="text-3xl font-serif text-secondary mt-2 font-normal">94.2%</div>
          <span className="text-xs text-secondary font-medium mt-1 inline-block">47 / 50 Classes</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-outline/10">
          <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Credits Completed</span>
          <div className="text-3xl font-serif text-tertiary mt-2 font-normal">68 / 120</div>
          <span className="text-xs text-tertiary font-medium mt-1 inline-block">On track for graduation</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-outline/10">
          <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Pending Assignments</span>
          <div className="text-3xl font-serif text-error mt-2 font-normal">2 Tasks</div>
          <span className="text-xs text-error font-medium mt-1 inline-block">Due in 2 days</span>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Today's Schedule & Enrolled Courses */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Today's Schedule Card */}
          <div className="glass-card rounded-3xl p-6 border border-outline/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl text-white">Today's Schedule</h3>
              <span className="text-xs text-primary font-bold uppercase tracking-wider">Fall 2026</span>
            </div>
            <div className="space-y-4">
              <div className="bg-surface/50 rounded-2xl p-4 border border-outline/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                    10:00
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Advanced Physics Lab</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Science Bldg • Room 402</p>
                  </div>
                </div>
                <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">
                  Next Up
                </span>
              </div>

              <div className="bg-surface/50 rounded-2xl p-4 border border-outline/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-tertiary/20 flex items-center justify-center text-tertiary font-bold">
                    14:00
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Study Group: Calculus III</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Main Library • Pod B</p>
                  </div>
                </div>
                <span className="text-xs bg-surface-bright text-on-surface-variant px-3 py-1 rounded-full font-medium">
                  Scheduled
                </span>
              </div>

              <div className="bg-surface/50 rounded-2xl p-4 border border-outline/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    16:00
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Machine Learning Lecture</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Turing Hall • Room 101</p>
                  </div>
                </div>
                <span className="text-xs bg-surface-bright text-on-surface-variant px-3 py-1 rounded-full font-medium">
                  Scheduled
                </span>
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="glass-card rounded-3xl p-6 border border-outline/10">
            <h3 className="font-serif text-2xl text-white mb-6">Enrolled Courses (Spring 2026)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { code: 'CS 401', title: 'Database Systems Phase 2', instructor: 'Dr. Robert Vance', progress: '75%' },
                { code: 'CS 450', title: 'Machine Learning Fundamentals', instructor: 'Prof. Elena Rostova', progress: '60%' },
                { code: 'PHYS 302', title: 'Advanced Physics Lab', instructor: 'Dr. Marcus Brody', progress: '85%' },
                { code: 'WEB 410', title: 'Web3 & Decentralized Apps', instructor: 'Prof. Sarah Jenkins', progress: '40%' },
              ].map((c) => (
                <div
                  key={c.code}
                  onClick={() => onActionNotification(`Opening course module for ${c.code}...`)}
                  className="bg-surface/50 rounded-2xl p-4 border border-outline/10 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <span className="text-xs text-primary font-bold">{c.code}</span>
                  <h4 className="text-white font-semibold text-sm mt-1">{c.title}</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">{c.instructor}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1 text-on-surface-variant">
                      <span>Syllabus Progress</span>
                      <span className="text-primary font-bold">{c.progress}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: c.progress }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Portal Actions & Exam Schedule */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="glass-card rounded-3xl p-6 border border-outline/10">
            <h3 className="font-sans text-xs font-bold text-primary uppercase tracking-[0.12em] mb-4">
              Portal Quick Tools
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => onActionNotification('Opening Assignment Submission portal...')}
                className="w-full bg-surface-bright/50 hover:bg-surface-bright text-white p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between border border-outline/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">upload_file</span> Submit Homework
                </span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                onClick={() => onActionNotification('Opening Library Pod Reservation tool...')}
                className="w-full bg-surface-bright/50 hover:bg-surface-bright text-white p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between border border-outline/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">meeting_room</span> Reserve Study Pod
                </span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                onClick={() => onActionNotification('Opening Academic Transcript generator...')}
                className="w-full bg-surface-bright/50 hover:bg-surface-bright text-white p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between border border-outline/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-sm">download</span> Download Transcript
                </span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Exam Schedule 2026 */}
          <div className="glass-card rounded-3xl p-6 border border-outline/10">
            <h3 className="font-serif text-xl text-white mb-4">Mid-Term Exams 2026</h3>
            <div className="space-y-3">
              <div className="bg-surface/50 rounded-xl p-3.5 border border-error/20 border-l-4 border-l-error">
                <span className="text-xs text-error font-bold">Oct 18, 2026 • 10:00 AM</span>
                <h4 className="text-white text-sm font-semibold mt-0.5">Database Systems (CS 401)</h4>
              </div>
              <div className="bg-surface/50 rounded-xl p-3.5 border border-outline/10">
                <span className="text-xs text-tertiary font-bold">Oct 22, 2026 • 02:00 PM</span>
                <h4 className="text-white text-sm font-semibold mt-0.5">Machine Learning (CS 450)</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
