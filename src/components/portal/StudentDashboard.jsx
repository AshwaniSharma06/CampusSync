import React, { useState } from 'react';

export default function StudentDashboard({ user, onSignOut, onActionNotification }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const notifications = [
    { id: 1, title: 'BTU Exam Registration Open', time: '10 mins ago', urgent: true },
    { id: 2, title: 'Physics Lab Report Graded (A)', time: '2 hours ago', urgent: false },
    { id: 3, title: 'Library Pod B Reservation Confirmed', time: '1 day ago', urgent: false },
  ];

  const handleAiPromptClick = (promptText) => {
    setAiQuery(promptText);
    if (promptText.includes('focus')) {
      setAiResponse(
        '🎯 **Today\'s Priority Focus:** 1) Prepare for Advanced Physics Lab at 10:00 AM in Science Bldg Room 402. 2) Review CS 401 Database Systems Assignment before Friday.'
      );
    } else if (promptText.includes('deadlines') || promptText.includes('Summarize')) {
      setAiResponse(
        '📅 **Upcoming Key Deadlines:** Oct 18 - CS 401 Midterm Exam (10:00 AM) • Oct 22 - CS 450 ML Exam (02:00 PM) • 2 lab reports due this week.'
      );
    } else {
      setAiResponse(
        '📊 **Attendance & BTU Status:** You are currently at 94.2% attendance (47/50 classes). You are fully eligible for BTU End-Sem Examinations!'
      );
    }
    onActionNotification(`AI Copilot: Processing "${promptText}"`);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', badge: null },
    { id: 'courses', label: 'Courses', icon: 'library_books', badge: '4' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar_today', badge: null },
    { id: 'assignments', label: 'Assignments', icon: 'assignment', badge: '2', badgeColor: 'bg-red-100 text-red-700' },
    { id: 'ai_assistant', label: 'CampusSync AI', icon: 'smart_toy', badge: 'AI', badgeColor: 'bg-teal-100 text-teal-800' },
  ];

  const enrolledCourses = [
    {
      code: 'CS 401',
      title: 'Database Systems Phase 2',
      instructor: 'Dr. Robert Vance',
      progress: '75%',
      icon: 'database',
      nextClass: 'Mon 10:00 AM • Barliya Lab 2',
      grade: 'A-',
    },
    {
      code: 'CS 450',
      title: 'Machine Learning Fundamentals',
      instructor: 'Prof. Elena Rostova',
      progress: '60%',
      icon: 'smart_toy',
      nextClass: 'Today 04:00 PM • Turing 101',
      grade: 'A',
    },
    {
      code: 'PHYS 302',
      title: 'Advanced Physics Lab',
      instructor: 'Dr. Marcus Brody',
      progress: '85%',
      icon: 'science',
      nextClass: 'Today 10:00 AM • Science 402',
      grade: 'A+',
    },
    {
      code: 'WEB 410',
      title: 'Web3 & Decentralized Apps',
      instructor: 'Prof. Sarah Jenkins',
      progress: '40%',
      icon: 'hub',
      nextClass: 'Thu 04:00 PM • Innovation Hub',
      grade: 'B+',
    },
  ];

  return (
    <div className="dashboard-simple-font min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pt-20 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      {/* Top Welcome Header - Clean Light Theme */}
      <header className="bg-white rounded-3xl p-6 md:p-8 mb-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-amber-500"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Student Avatar */}
            <div className="relative group">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 p-0.5 shadow-md transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-teal-600 rounded-[14px] flex items-center justify-center text-white font-bold text-2xl tracking-wider">
                  {user.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2) : 'AS'}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-sm animate-pulse"></span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-0.5 rounded-full text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping"></span>
                  Academic Command Center • Fall 2026
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline-block font-medium">
                  Sept 1, 2026
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl text-slate-900 font-extrabold tracking-tight">
                Welcome back, <span className="text-teal-600">{user.name || 'Student'}</span>!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                <span>{user.department || 'Computer Science Engineering'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-indigo-600 font-semibold">ID: {user.studentId || 'ECA2026-8941'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-700 font-semibold">Semester V (BTU Affiliated)</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Notification Bell */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all hover:scale-105"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-xl text-indigo-600">notifications</span>
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl p-4 border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Campus Alerts</span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">3 Unread</span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onActionNotification(`Opening notification: ${n.title}`)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100"
                      >
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onActionNotification('Opening Student Profile Settings...')}
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all hover:border-teal-400 shadow-2xs"
            >
              Profile
            </button>
            <button
              onClick={onSignOut}
              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout: Left Navigation + Content Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Navigation Rail */}
        <aside className="w-full lg:w-64 shrink-0 bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm sticky top-24 z-20">
          <div className="hidden lg:block text-[11px] font-bold text-teal-700 uppercase tracking-wider px-3 mb-3">
            Command Navigation
          </div>
          
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto hide-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onActionNotification(`Switched view tab to ${item.label}`);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-50 border border-teal-200 text-teal-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content View Container */}
        <main className="flex-1 w-full flex flex-col gap-8">
          {/* TAB 1: OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
              {/* Left 2 Columns: Schedule & Enrolled Courses */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Today's Schedule Card */}
                <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-2xl text-slate-900 font-bold tracking-tight">Today's Academic Schedule</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Fall 2026 Semester • Barliya Academic Block</p>
                    </div>
                    <span className="text-[11px] bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      3 Lectures Scheduled Today
                    </span>
                  </div>

                  {/* Timeline Container */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-teal-500 before:via-indigo-400 before:to-slate-200">
                    {/* Timeline Event 1 (Next Up) */}
                    <div className="relative group">
                      <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-teal-500 border-4 border-white shadow-md animate-pulse"></div>
                      <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-200 shadow-2xs hover:border-teal-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-teal-100 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-teal-800">10:00</span>
                            <span className="text-[9px] text-teal-600 font-semibold uppercase">AM</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-slate-900 font-bold text-base">Advanced Physics Lab (PHYS 302)</h4>
                              <span className="bg-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                Next Up
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-3 font-medium">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-teal-600">location_on</span> Science Bldg • Room 402
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-indigo-600">person</span> Dr. Marcus Brody
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onActionNotification('Launching Physics Lab Virtual Pod...')}
                          className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto shrink-0 shadow-sm"
                        >
                          Join Lab Pod
                        </button>
                      </div>
                    </div>

                    {/* Timeline Event 2 */}
                    <div className="relative group">
                      <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-indigo-700">14:00</span>
                            <span className="text-[9px] text-indigo-500 font-semibold uppercase">PM</span>
                          </div>
                          <div>
                            <h4 className="text-slate-900 font-bold text-base">Calculus III Peer Study Group</h4>
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-3 font-medium">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-indigo-600">meeting_room</span> Central Library • Pod B
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>Peer Learning Session</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
                          Scheduled
                        </span>
                      </div>
                    </div>

                    {/* Timeline Event 3 */}
                    <div className="relative group">
                      <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-sm"></div>
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-amber-700">16:00</span>
                            <span className="text-[9px] text-amber-600 font-semibold uppercase">PM</span>
                          </div>
                          <div>
                            <h4 className="text-slate-900 font-bold text-base">Machine Learning Fundamentals (CS 450)</h4>
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-3 font-medium">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-amber-600">school</span> Turing Hall • Room 101
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>Prof. Elena Rostova</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-semibold self-start sm:self-auto">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Assistant Card & Midterms */}
              <div className="col-span-1 flex flex-col gap-6">
                {/* CampusSync AI Interactive Card */}
                <div className="bg-gradient-to-b from-teal-50/80 via-white to-white rounded-3xl p-6 border border-teal-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md">
                      <span className="material-symbols-outlined text-xl">auto_awesome</span>
                    </div>
                    <div>
                      <h3 className="text-lg text-slate-900 font-bold tracking-tight">CampusSync AI</h3>
                      <p className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping"></span> Intelligent Academic Assistant
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                    Ask AI anything about your schedule, GPA goals, BTU syllabus, or assignment deadlines.
                  </p>

                  {/* Quick AI Prompts */}
                  <div className="space-y-2 mb-4">
                    <button
                      onClick={() => handleAiPromptClick('What should I focus on today?')}
                      className="w-full text-left p-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs text-slate-800 transition-all flex items-center justify-between font-semibold group shadow-2xs"
                    >
                      <span>🎯 "What should I focus on today?"</span>
                      <span className="material-symbols-outlined text-xs text-teal-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                    <button
                      onClick={() => handleAiPromptClick('Summarize my upcoming deadlines')}
                      className="w-full text-left p-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs text-slate-800 transition-all flex items-center justify-between font-semibold group shadow-2xs"
                    >
                      <span>📅 "Summarize my upcoming deadlines"</span>
                      <span className="material-symbols-outlined text-xs text-teal-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                    <button
                      onClick={() => handleAiPromptClick('Calculate required attendance for 75% goal')}
                      className="w-full text-left p-3 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs text-slate-800 transition-all flex items-center justify-between font-semibold group shadow-2xs"
                    >
                      <span>📊 "Calculate required attendance status"</span>
                      <span className="material-symbols-outlined text-xs text-teal-600 group-hover:translate-x-1 transition-transform">chevron_right</span>
                    </button>
                  </div>

                  {/* AI Output Display Box */}
                  {aiResponse && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs leading-relaxed animate-in fade-in duration-200 shadow-md">
                      <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px] mb-1.5">
                        <span className="material-symbols-outlined text-sm">smart_toy</span> AI Response:
                      </div>
                      {aiResponse}
                    </div>
                  )}
                </div>

                {/* BTU Mid-Term Exams Schedule Panel */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-slate-900 font-bold tracking-tight">Upcoming BTU Midterms 2026</h3>
                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      Official Schedule
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 flex items-center gap-4 hover:border-amber-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-amber-600 flex flex-col items-center justify-center shrink-0 text-white shadow-xs">
                        <span className="text-xs font-bold">OCT</span>
                        <span className="text-base font-extrabold leading-none">18</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-slate-900 text-sm font-bold">Database Systems (CS 401)</h4>
                          <span className="text-[10px] text-amber-800 font-bold">In 47 Days</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">10:00 AM • Exam Hall A, Desk 42</p>
                      </div>
                    </div>

                    <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-200 flex items-center gap-4 hover:border-indigo-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 flex flex-col items-center justify-center shrink-0 text-white shadow-xs">
                        <span className="text-xs font-bold">OCT</span>
                        <span className="text-base font-extrabold leading-none">22</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-slate-900 text-sm font-bold">Machine Learning (CS 450)</h4>
                          <span className="text-[10px] text-indigo-800 font-bold">In 51 Days</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">02:00 PM • Exam Hall C, Desk 18</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSES TAB */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-3xl text-slate-900 font-extrabold tracking-tight">Full Academic Courses Directory</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Detailed Syllabus, Lecture Materials & Faculty Schedule</p>
                </div>
                <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Fall Semester 2026
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses.map((c) => (
                  <div key={c.code} className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200 hover:border-teal-400 transition-all shadow-2xs">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold px-3 py-1 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                          {c.code}
                        </span>
                        <h4 className="text-xl text-slate-900 font-bold mt-2">{c.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{c.instructor} • Department of CSE</p>
                      </div>
                      <span className="text-sm font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                        Grade {c.grade}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 mb-4 font-medium">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-teal-600">schedule</span> {c.nextClass}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-indigo-600">folder</span> 12 Lecture Slides • 4 Lab Exercises • 1 Project
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Course Completion</span>
                        <span className="font-bold text-teal-700">{c.progress}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600" style={{ width: c.progress }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-3xl text-slate-900 font-extrabold tracking-tight">Full Weekly Timetable & Room Map</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">ECA Barliya Academic Block & Lab Schedule</p>
                </div>
                <button
                  onClick={() => onActionNotification('Downloading Timetable PDF...')}
                  className="bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span> Download PDF Timetable
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { day: 'Monday', classes: 'Advanced Physics Lab (10:00 AM - 12:00 PM) • Room 402' },
                  { day: 'Tuesday', classes: 'Machine Learning Fundamentals (02:00 PM - 03:30 PM) • Turing Hall 101' },
                  { day: 'Wednesday', classes: 'Database Systems Phase 2 (10:00 AM - 11:30 AM) • Barliya Lab 2' },
                  { day: 'Thursday', classes: 'Web3 & Decentralized Apps (04:00 PM - 05:30 PM) • Innovation Hub' },
                  { day: 'Friday', classes: 'Calculus III Peer Study Group (02:00 PM - 03:30 PM) • Library Pod B' },
                ].map((s) => (
                  <div key={s.day} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="font-bold text-slate-900 text-sm w-32">{s.day}</span>
                    <span className="text-xs text-teal-700 font-semibold flex-1">{s.classes}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-bold uppercase w-fit">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ASSIGNMENTS TAB */}
          {activeTab === 'assignments' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-3xl text-slate-900 font-extrabold tracking-tight">Pending Assignments & Lab Submissions</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Submit reports and view faculty grading rubrics</p>
                </div>
                <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  2 Pending Submissions
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Due Sept 3, 2026 (In 2 Days)</span>
                    <h4 className="text-lg text-slate-900 font-bold mt-0.5">Database Systems Phase 2 (CS 401) Lab Report</h4>
                    <p className="text-xs text-slate-600 mt-1 font-medium">Dr. Robert Vance • SQL Query Optimization & Indexing Documentation</p>
                  </div>
                  <button
                    onClick={() => onActionNotification('Opening Assignment File Upload Dropzone...')}
                    className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 shadow-xs"
                  >
                    Submit Report
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/80 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Due Sept 4, 2026 (In 3 Days)</span>
                    <h4 className="text-lg text-slate-900 font-bold mt-0.5">Machine Learning Assignment 3: Neural Networks</h4>
                    <p className="text-xs text-slate-600 mt-1 font-medium">Prof. Elena Rostova • PyTorch Model Training Jupyter Notebook</p>
                  </div>
                  <button
                    onClick={() => onActionNotification('Opening Assignment File Upload Dropzone...')}
                    className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 shadow-xs"
                  >
                    Submit Notebook
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI ASSISTANT FULL WORKSPACE TAB */}
          {activeTab === 'ai_assistant' && (
            <div className="bg-gradient-to-b from-teal-50/90 to-white rounded-3xl p-6 md:p-8 border border-teal-200 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-2xl text-slate-900 font-extrabold tracking-tight">CampusSync AI Workspace</h3>
                  <p className="text-xs text-teal-700 font-bold">Your 24/7 Academic & BTU Course Assistant</p>
                </div>
              </div>

              <div className="space-y-4 max-w-2xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask AI anything about BTU syllabus, assignments, exam tips..."
                    className="flex-1 bg-white rounded-xl px-4 py-3 text-slate-900 text-xs border border-slate-300 focus:outline-none focus:border-teal-500 transition-colors shadow-2xs font-medium"
                  />
                  <button
                    onClick={() => handleAiPromptClick(aiQuery || 'Summarize my upcoming deadlines')}
                    className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-teal-700 transition-all shadow-xs"
                  >
                    Ask AI
                  </button>
                </div>

                {aiResponse && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs leading-relaxed shadow-md font-medium">
                    <div className="flex items-center gap-1.5 text-teal-400 font-bold text-xs mb-2">
                      <span className="material-symbols-outlined text-base">smart_toy</span> Copilot Answer:
                    </div>
                    {aiResponse}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
