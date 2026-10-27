import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import EditProfileModal from './EditProfileModal';

export default function StudentDashboard({ user, onSignOut, onActionNotification, onReturnHome }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI interactive state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Notices filter
  const [noticeFilter, setNoticeFilter] = useState('All');
  const [savedResourceIds, setSavedResourceIds] = useState(['res-1', 'res-3']);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = studentProfile?.name || user?.name || 'Ashwani';
  const firstName = displayName.split(' ')[0] || 'Ashwani';

  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);

  useEffect(() => {
    setStudentProfile(user);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [summary, coursesData, noticesData, notifs] = await Promise.all([
          apiService.getDashboardSummary().catch(() => null),
          apiService.getEnrolledCourses().catch(() => []),
          apiService.getNotices().catch(() => []),
          apiService.getNotifications().catch(() => [])
        ]);
        if (isMounted) {
          setDashboardData(summary);
          setCourses(coursesData && coursesData.length > 0 ? coursesData : DEFAULT_COURSES);
          setNotices(noticesData && noticesData.length > 0 ? noticesData : DEFAULT_NOTICES);
          setNotificationsData(notifs && notifs.length > 0 ? notifs : DEFAULT_NOTIFICATIONS);
        }
      } catch (err) {
        if (isMounted) {
          setCourses(DEFAULT_COURSES);
          setNotices(DEFAULT_NOTICES);
          setNotificationsData(DEFAULT_NOTIFICATIONS);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleAiPromptClick = async (promptText) => {
    setAiQuery(promptText);
    setAiLoading(true);
    setAiResponse('');
    onActionNotification?.(`Campus AI: Processing "${promptText}"`);
    
    try {
      const response = await apiService.chatWithAI(promptText);
      setAiResponse(response.answer);
    } catch (err) {
      // Fallback response for offline or mock state
      setTimeout(() => {
        if (promptText.includes('focus')) {
          setAiResponse("Focus today on your Advanced Physics Lab at 10:00 AM (PHYS 302) in Barliya Block 402, followed by the Database Systems Phase 2 project report due in 2 days.");
        } else if (promptText.includes('deadlines')) {
          setAiResponse("Approaching deadlines: 1) B.Tech Project-1 Phase 2 Lab Report (Due in 2 days). 2) ML Assignment 3 Neural Networks (Due in 3 days). 3) BTU Semester Exam Registration Fee (Due in 5 days).");
        } else {
          setAiResponse(`Campus AI Copilot: Verified against BTU syllabus and ECA academic schedule for "${promptText}". Your attendance is 87% and academic standing is strong.`);
        }
        setAiLoading(false);
      }, 500);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleSaveResource = (id, title) => {
    if (savedResourceIds.includes(id)) {
      setSavedResourceIds(prev => prev.filter(item => item !== id));
      onActionNotification?.(`Removed "${title}" from saved resources`);
    } else {
      setSavedResourceIds(prev => [...prev, id]);
      onActionNotification?.(`Saved "${title}" to your offline library`);
    }
  };

  // Sidebar items as strictly required:
  // Overview, Academics, Community, Clubs, Events, Resources, and Campus AI.
  const sidebarNavItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', badge: null },
    { id: 'academics', label: 'Academics', icon: 'school', badge: '4 Courses' },
    { id: 'community', label: 'Community', icon: 'forum', badge: 'Active' },
    { id: 'clubs', label: 'Clubs', icon: 'groups', badge: '3 Joined' },
    { id: 'events', label: 'Events', icon: 'event', badge: 'Oct 15' },
    { id: 'resources', label: 'Resources', icon: 'folder_open', badge: 'BTU Docs' },
    { id: 'ai', label: 'Campus AI', icon: 'smart_toy', badge: '24/7 AI', badgeColor: 'bg-teal-100 text-teal-800 border border-teal-300' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6 max-w-[1440px] mx-auto animate-pulse flex flex-col gap-6">
        <div className="bg-slate-200 h-20 rounded-2xl w-full"></div>
        <div className="flex gap-6">
          <div className="w-64 h-96 bg-slate-200 rounded-2xl shrink-0 hidden md:block"></div>
          <div className="flex-1 space-y-6">
            <div className="h-44 bg-slate-200 rounded-2xl w-full"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 bg-slate-200 rounded-2xl"></div>
              <div className="h-80 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col">
      {/* 1. Compact Top Bar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 px-4 md:px-8 py-3.5 shadow-xs">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Page Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onReturnHome}
              className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 flex items-center justify-center transition-colors"
              title="Return to Public CampusSync Website"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <h1 className="text-[28px] md:text-[30px] font-extrabold text-slate-900 leading-tight tracking-tight">
                {activeTab === 'overview' && 'Student Dashboard'}
                {activeTab === 'academics' && 'Academics & Courses'}
                {activeTab === 'community' && 'Campus Community'}
                {activeTab === 'clubs' && 'Joined Clubs & SAC'}
                {activeTab === 'events' && 'Upcoming Events'}
                {activeTab === 'resources' && 'Saved Resources'}
                {activeTab === 'ai' && 'Campus AI Copilot'}
              </h1>
              <p className="text-[14px] text-slate-500 font-medium hidden sm:block">
                Engineering College Ajmer • BTU Affiliated
              </p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search schedule, notices, clubs, study resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 rounded-xl pl-10 pr-4 py-2 text-[14px] text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all hover:scale-105"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-xl text-teal-700">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl p-4 border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                    <span className="text-[14px] font-bold text-teal-800 uppercase tracking-wider">Campus Alerts</span>
                    <span className="text-[12px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">2 Unread</span>
                  </div>
                  <div className="space-y-2">
                    {notificationsData.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onActionNotification?.(`Opening alert: ${n.title}`);
                          setShowNotifications(false);
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100"
                      >
                        <p className="text-[14px] font-semibold text-slate-800 leading-snug">{n.title}</p>
                        <span className="text-[12px] text-slate-400 mt-1 block font-medium">Just now</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-white transition-all cursor-pointer shadow-2xs group"
              title="Click to Edit Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AS'}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <p className="text-[14px] font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {displayName}
                </p>
                <p className="text-[12px] text-slate-500 font-medium">
                  ID: {studentProfile?.studentId || 'ECA2026-8941'}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm hidden sm:block">
                expand_more
              </span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="hidden sm:flex items-center gap-1 text-[14px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition-colors"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Left Sidebar + Tab Views */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* 2. Sidebar: Overview, Academics, Community, Clubs, Events, Resources, Campus AI */}
        <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm lg:sticky lg:top-24 z-20">
          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2.5 hidden lg:block">
            Student Portal
          </div>
          
          <nav className="flex lg:flex-col gap-1 overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
            {sidebarNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onActionNotification?.(`Switched to ${item.label}`);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-bold transition-all whitespace-nowrap shrink-0 lg:w-full ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick link back to public landing page */}
          <div className="hidden lg:block mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={onReturnHome}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl text-[14px] font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-teal-600">home</span>
              <span>Back to Public Site</span>
            </button>
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 text-teal-700 font-bold mb-0.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                <span>Fall 2026 Session</span>
              </div>
              B.Tech VII Sem • Section CS-A
            </div>
          </div>
        </aside>

        {/* 3. Main Content Container */}
        <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
          {/* TAB: OVERVIEW (The Substantial Restructuring requested) */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Personal Welcome: “Good morning, Ashwani” with next important action */}
              <div className="bg-white rounded-2xl p-6 md:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-amber-500"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full text-[12px] font-bold text-teal-700 uppercase tracking-wider mb-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
                      Academic Command Center • Semester VII
                    </div>
                    <h2 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
                      {getGreeting()}, <span className="text-teal-600">{firstName}</span>!
                    </h2>
                    <p className="text-[16px] text-slate-600 mt-1 font-medium leading-relaxed">
                      You have 3 lectures scheduled today and 2 upcoming assignment submissions.
                    </p>
                  </div>

                  {/* Highlight: Next Important Action Card */}
                  <div className="w-full lg:w-auto bg-gradient-to-br from-teal-50/80 to-slate-50 rounded-2xl p-4 md:p-5 border border-teal-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-[11px] font-bold uppercase leading-none">Next</span>
                        <span className="text-sm font-extrabold mt-0.5">10:00</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-600 text-white animate-pulse">
                            Action Required
                          </span>
                          <span className="text-[12px] text-slate-500 font-semibold">Starts in 25 mins</span>
                        </div>
                        <h4 className="text-[16px] font-bold text-slate-900 mt-0.5">
                          Advanced Physics Lab (PHYS 302)
                        </h4>
                        <p className="text-[14px] text-slate-600 font-medium">
                          Barliya Block Room 402 • Dr. Marcus Brody
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onActionNotification?.('Joining Physics Virtual Lab Pod...')}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center shrink-0"
                    >
                      <span>Join Lab Pod</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Column Core Section: Main Column + Secondary Column */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* MAIN COLUMN (Schedule & Deadlines with Clear Actions) - 7 cols */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Today's Schedule Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-[20px] md:text-[22px] font-bold text-slate-900 tracking-tight">
                          Today's Academic Schedule
                        </h3>
                        <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                          Barliya Academic Block &amp; Central Labs
                        </p>
                      </div>
                      <span className="text-[12px] bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        3 Classes
                      </span>
                    </div>

                    {/* Schedule Items with clear action buttons */}
                    <div className="space-y-4">
                      {/* Class 1: Next Up */}
                      <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-teal-100 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[12px] font-bold text-teal-800 leading-none">10:00</span>
                            <span className="text-[10px] text-teal-600 font-semibold uppercase">AM</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-[16px] font-bold text-slate-900">Advanced Physics Lab (PHYS 302)</h4>
                              <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Next</span>
                            </div>
                            <p className="text-[14px] text-slate-600 font-medium mt-0.5 flex items-center gap-2">
                              <span>Barliya Block • Room 402</span>
                              <span>•</span>
                              <span>Dr. Marcus Brody</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onActionNotification?.('Opening Physics Lab Workbench...')}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[12px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto shadow-2xs"
                        >
                          Join Lab
                        </button>
                      </div>

                      {/* Class 2: Peer Study */}
                      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[12px] font-bold text-indigo-700 leading-none">02:00</span>
                            <span className="text-[10px] text-indigo-500 font-semibold uppercase">PM</span>
                          </div>
                          <div>
                            <h4 className="text-[16px] font-bold text-slate-900">Calculus III Peer Study Group</h4>
                            <p className="text-[14px] text-slate-600 font-medium mt-0.5 flex items-center gap-2">
                              <span>Central Library • Study Pod B</span>
                              <span>•</span>
                              <span>Maths Society</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onActionNotification?.('Viewing Central Library Pod B Map...')}
                          className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[12px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto"
                        >
                          View Room
                        </button>
                      </div>

                      {/* Class 3: Machine Learning */}
                      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[12px] font-bold text-amber-700 leading-none">04:00</span>
                            <span className="text-[10px] text-amber-600 font-semibold uppercase">PM</span>
                          </div>
                          <div>
                            <h4 className="text-[16px] font-bold text-slate-900">Machine Learning Fundamentals (CS 450)</h4>
                            <p className="text-[14px] text-slate-600 font-medium mt-0.5 flex items-center gap-2">
                              <span>Turing Hall • Room 101</span>
                              <span>•</span>
                              <span>Prof. Elena Rostova</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onActionNotification?.('Opening ML Lecture Slides & Syllabus...')}
                          className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[12px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto"
                        >
                          Notes
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Deadlines (Urgency Highlighted with Amber and Red) */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-[20px] md:text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span>Upcoming Deadlines</span>
                        </h3>
                        <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                          Submission portals and examination milestones
                        </p>
                      </div>
                      <span className="text-[12px] bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        2 Urgent
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Deadline 1: Red Urgency */}
                      <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-extrabold text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Due in 2 days
                            </span>
                            <span className="text-[12px] text-slate-500 font-medium">Friday, 11:59 PM</span>
                          </div>
                          <h4 className="text-[16px] font-bold text-slate-900 mt-1">
                            B.Tech Project-1 Phase 2 Lab Report (CS 401)
                          </h4>
                          <p className="text-[14px] text-slate-600 font-medium mt-0.5">
                            Dr. Robert Vance • SQL Query Optimization &amp; Indexing
                          </p>
                        </div>
                        <button
                          onClick={() => onActionNotification?.('Opening Assignment Submission Dropzone...')}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[12px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto shadow-2xs"
                        >
                          Submit Report
                        </button>
                      </div>

                      {/* Deadline 2: Amber Urgency */}
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Due in 3 days
                            </span>
                            <span className="text-[12px] text-slate-500 font-medium">Saturday, 5:00 PM</span>
                          </div>
                          <h4 className="text-[16px] font-bold text-slate-900 mt-1">
                            Machine Learning Assignment 3: Neural Networks
                          </h4>
                          <p className="text-[14px] text-slate-600 font-medium mt-0.5">
                            Prof. Elena Rostova • PyTorch Model Training Notebook
                          </p>
                        </div>
                        <button
                          onClick={() => onActionNotification?.('Opening Assignment Submission Dropzone...')}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[12px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto shadow-2xs"
                        >
                          Submit Notebook
                        </button>
                      </div>

                      {/* Deadline 3: Amber Urgency */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              In 5 days
                            </span>
                            <span className="text-[12px] text-slate-500 font-medium">BTU Portal</span>
                          </div>
                          <h4 className="text-[16px] font-bold text-slate-900 mt-1">
                            BTU Semester VII Examination Fee &amp; Subject Registration
                          </h4>
                          <p className="text-[14px] text-slate-600 font-medium mt-0.5">
                            Main &amp; Back Paper Verification Schedule
                          </p>
                        </div>
                        <button
                          onClick={() => onActionNotification?.('Opening BTU Exam Registration Portal...')}
                          className="border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-[12px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECONDARY COLUMN (Important Notices & Quick Access to Saved Resources) - 5 cols */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Important Notices */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-[20px] md:text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-teal-600">campaign</span>
                          Important Notices
                        </h3>
                        <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                          Official administrative and BTU alerts
                        </p>
                      </div>
                      <span className="text-[12px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                        {notices.length} Active
                      </span>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-1.5 mb-4 overflow-x-auto hide-scrollbar pb-1">
                      {['All', 'Official', 'Department', 'Events'].map(f => (
                        <button
                          key={f}
                          onClick={() => setNoticeFilter(f)}
                          className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all ${
                            noticeFilter === f
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {notices
                        .filter(n => noticeFilter === 'All' || n.notice_type === noticeFilter || n.type === noticeFilter)
                        .slice(0, 3)
                        .map(n => (
                          <div
                            key={n.id}
                            className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition-all flex items-start justify-between gap-3 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 uppercase">
                                  {n.notice_type || 'Official'}
                                </span>
                                <span className="text-[12px] text-slate-400 font-medium">
                                  {n.date || 'Today'}
                                </span>
                              </div>
                              <h4 className="text-[14px] font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                                {n.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onActionNotification?.(`Downloaded document: ${n.title}`)}
                                className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-white transition-colors"
                                title="Download Notice PDF"
                              >
                                <span className="material-symbols-outlined text-base">download</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Quick Access to Saved Resources */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-[20px] md:text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-teal-600">bookmark</span>
                          Saved Resources
                        </h3>
                        <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                          Quick access to syllabus, past papers &amp; maps
                        </p>
                      </div>
                      <span className="text-[12px] bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
                        {savedResourceIds.length} Saved
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          id: 'res-1',
                          title: 'BTU CSE VII Sem Complete Syllabus & Rubric',
                          format: 'PDF • 4.2 MB',
                          icon: 'description',
                          badge: 'Curriculum'
                        },
                        {
                          id: 'res-2',
                          title: 'Solved BTU Midterm Exam Question Bank (2023-2025)',
                          format: 'Archive • 18 MB',
                          icon: 'folder_zip',
                          badge: 'Exam Prep'
                        },
                        {
                          id: 'res-3',
                          title: 'ECA Barliya Academic Block & Lab Navigation Map',
                          format: 'Interactive Map',
                          icon: 'map',
                          badge: 'Campus'
                        },
                        {
                          id: 'res-4',
                          title: 'PyTorch ML Lab Jupyter Notebook Starter Pack',
                          format: 'IPYNB Notebooks',
                          icon: 'code',
                          badge: 'Code Lab'
                        },
                      ].map(res => {
                        const isSaved = savedResourceIds.includes(res.id);
                        return (
                          <div
                            key={res.id}
                            className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-lg">{res.icon}</span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[14px] font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                                  {res.title}
                                </h4>
                                <span className="text-[12px] text-slate-500 font-medium">
                                  {res.format}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => toggleSaveResource(res.id, res.title)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isSaved ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title={isSaved ? 'Remove from saved' : 'Save for quick access'}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {isSaved ? 'bookmark_added' : 'bookmark_border'}
                                </span>
                              </button>
                              <button
                                onClick={() => onActionNotification?.(`Opening resource: ${res.title}`)}
                                className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-white transition-colors"
                                title="Open Resource"
                              >
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Lower Section: Joined Clubs, Upcoming Events, Recent Community Activity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Lower 1: Joined Clubs */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-teal-600">groups</span>
                          Joined Clubs
                        </h3>
                        <p className="text-[14px] text-slate-500 font-medium">
                          Active ECA student societies
                        </p>
                      </div>
                      <span className="text-[12px] bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
                        3 Active
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-bold text-slate-900">Technotsav &amp; PCC Club</h4>
                          <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">Core Coder</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">
                          Next Meet: Tomorrow 4:00 PM • Central Robotics Lab
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-bold text-slate-900">AI &amp; Data Science Society</h4>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">Member</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">
                          Next Meet: Thursday 3:00 PM • AI Lab 204
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-bold text-slate-900">Creative Art Society (CAS)</h4>
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Volunteer</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">
                          Tarangini 2026 Preparations • Open Air Theatre
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('clubs')}
                    className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] uppercase tracking-wider py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View SAC Directory</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {/* Lower 2: Upcoming Events */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-teal-600">event</span>
                          Upcoming Events
                        </h3>
                        <p className="text-[14px] text-slate-500 font-medium">
                          Passes and registrations
                        </p>
                      </div>
                      <span className="text-[12px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                        Fall 2026
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-bold text-slate-900">Technotsav 2026 (Tech Fest)</h4>
                          <span className="text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">Pass Ready ✓</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">
                          Oct 15–17, 2026 • Robowar, Hackathon, Coding
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-bold text-slate-900">Tarangini 2026 (Cultural Fest)</h4>
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Notified</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">
                          Nov 05, 2026 • ECA Open Air Theatre (OAT)
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[14px] font-bold text-slate-900">Smart India Hackathon Screening</h4>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">Open</span>
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">
                          Oct 10, 2026 • ECA Innovation Cell
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('events')}
                    className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] uppercase tracking-wider py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View Events Calendar</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {/* Lower 3: Recent Community Activity */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-teal-600">forum</span>
                          Recent Community
                        </h3>
                        <p className="text-[14px] text-slate-500 font-medium">
                          Latest student discussions
                        </p>
                      </div>
                      <span className="text-[12px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                        Live
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
                          <span className="font-bold text-slate-800">Technotsav &amp; PCC Club</span>
                          <span>2h ago</span>
                        </div>
                        <p className="text-[13px] text-slate-700 font-medium mt-1 line-clamp-2">
                          React &amp; Machine Learning Workshop this Saturday at Barliya Lab 204.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
                          <span className="font-bold text-slate-800">Priya Sharma</span>
                          <span>5h ago</span>
                        </div>
                        <p className="text-[13px] text-slate-700 font-medium mt-1 line-clamp-2">
                          Study group for BTU ML midterms in Library Pod B this weekend!
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between text-[12px] text-slate-500 font-medium">
                          <span className="font-bold text-slate-800">Rohan Verma</span>
                          <span>8h ago</span>
                        </div>
                        <p className="text-[13px] text-slate-700 font-medium mt-1 line-clamp-2">
                          Found Dell laptop charger near CSE Block Room 402 handed to SAC.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('community')}
                    className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] uppercase tracking-wider py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Open Community Square</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACADEMICS */}
          {activeTab === 'academics' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-200 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h3 className="text-[24px] font-bold text-slate-900 tracking-tight">Academic Curriculum &amp; Courses</h3>
                  <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                    BTU B.Tech Semester VII • Computer Science &amp; Engineering
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-[14px] font-bold">
                    CGPA: 8.65 / 10.0
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {courses.map((c) => (
                  <div key={c.id || c.code} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-all shadow-2xs">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[12px] font-bold px-2.5 py-0.5 rounded bg-teal-100 text-teal-800">
                          {c.code}
                        </span>
                        <h4 className="text-[18px] font-bold text-slate-900 mt-1.5">{c.title}</h4>
                        <p className="text-[14px] text-slate-500 font-medium">{c.instructor} • {c.department}</p>
                      </div>
                      <span className="text-[14px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                        Grade {c.grade || 'A'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[14px] text-slate-600 font-medium mb-4">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-teal-600">schedule</span>
                        {c.nextClass}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-indigo-600">folder</span>
                        12 Lecture Notes • 4 Lab Exercises • 1 Term Paper
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[12px] text-slate-500 font-medium">Syllabus Progress</span>
                      <span className="text-[14px] font-bold text-teal-700">{c.progress || '65%'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: COMMUNITY */}
          {activeTab === 'community' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-200 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-[24px] font-bold text-slate-900 tracking-tight">ECA Community Discussions</h3>
                  <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                    Peer question board, project teams, and campus updates
                  </p>
                </div>
                <button
                  onClick={() => onActionNotification?.('Creating new student discussion thread...')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-2xs"
                >
                  New Thread
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    author: 'Technotsav & PCC Club',
                    role: 'Official Club',
                    time: '2h ago',
                    title: 'Upcoming React & Machine Learning Hands-on Workshop',
                    body: 'Join us this Saturday in Barliya Block Lab 204. Full stack AI application building from scratch with certificates.',
                    replies: 32,
                    likes: 124
                  },
                  {
                    author: 'Priya Sharma',
                    role: 'CS VII Sem',
                    time: '5h ago',
                    title: 'BTU Machine Learning Midterms Study Group in Library',
                    body: 'Looking for 2-3 classmates to practice previous BTU paper problem sets in Central Library Pod B this Friday.',
                    replies: 8,
                    likes: 18
                  },
                  {
                    author: 'Rohan Verma',
                    role: 'ECE V Sem',
                    time: '8h ago',
                    title: 'Dell Laptop 65W Charger Found in CSE Block',
                    body: 'Found near Room 402 at 2 PM. Submitted safely to the Student Activity Center (SAC) helpdesk.',
                    replies: 12,
                    likes: 24
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[14px]">{item.author}</span>
                        <span className="text-[11px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{item.role}</span>
                      </div>
                      <span className="text-[12px] text-slate-400 font-medium">{item.time}</span>
                    </div>
                    <h4 className="text-[16px] font-bold text-slate-900 mt-1">{item.title}</h4>
                    <p className="text-[14px] text-slate-600 font-medium mt-1 leading-relaxed">{item.body}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-[12px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 hover:text-teal-700 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">favorite</span> {item.likes} Likes
                      </span>
                      <span className="flex items-center gap-1 hover:text-teal-700 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">chat</span> {item.replies} Replies
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CLUBS */}
          {activeTab === 'clubs' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-200 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-[24px] font-bold text-slate-900 tracking-tight">Student Activity Center (SAC) Directory</h3>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                  Official societies, technical wings, and meeting schedule at ECA
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    name: 'Technotsav & PCC Club',
                    category: 'Technical Chapter',
                    lead: 'Dr. A. K. Sharma (Faculty Convener)',
                    members: '240+ Active Coders',
                    venue: 'Robotics Lab & CCC',
                    role: 'Core Member',
                    status: 'Active'
                  },
                  {
                    name: 'Creative Art Society (CAS)',
                    category: 'Cultural Apex',
                    lead: 'Prof. S. R. Verma',
                    members: '310+ Artists',
                    venue: 'Open Air Theatre (OAT)',
                    role: 'Volunteer',
                    status: 'Active'
                  },
                  {
                    name: 'AI & Data Science Society',
                    category: 'AI Research Wing',
                    lead: 'Dr. Neha Choudhary',
                    members: '180+ ML Enthusiasts',
                    venue: 'Barliya CSE Block 204',
                    role: 'Contributor',
                    status: 'Active'
                  }
                ].map((club, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                          {club.category}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {club.role}
                        </span>
                      </div>
                      <h4 className="text-[18px] font-bold text-slate-900">{club.name}</h4>
                      <p className="text-[14px] text-slate-600 font-medium mt-2">{club.lead}</p>
                      <p className="text-[12px] text-slate-500 mt-1">Venue: {club.venue}</p>
                    </div>
                    <button
                      onClick={() => onActionNotification?.(`Opening SAC hub for ${club.name}...`)}
                      className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[12px] uppercase tracking-wider py-2 rounded-xl transition-all shadow-2xs"
                    >
                      Club Workspace
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-200 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-[24px] font-bold text-slate-900 tracking-tight">ECA Campus Events &amp; Fests</h3>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                  Official passes, hackathons, and symposium schedule
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: 'Technotsav 2026 - Annual Technical Festival',
                    date: 'Oct 15 - 17, 2026',
                    venue: 'ECA Central Labs & Academic Blocks',
                    type: 'Technical',
                    status: 'Digital Pass Issued ✓',
                    action: 'View QR Pass'
                  },
                  {
                    title: 'Tarangini 2026 - Annual Cultural Fest',
                    date: 'Nov 05, 2026',
                    venue: 'ECA Open Air Theatre (OAT)',
                    type: 'Cultural',
                    status: 'Calendar Reminder Set',
                    action: 'Fest Schedule'
                  },
                  {
                    title: 'Smart India Hackathon (SIH 2026) College Screening',
                    date: 'Oct 10, 2026',
                    venue: 'ECA Innovation Center',
                    type: 'Hackathon',
                    status: 'Registration Active',
                    action: 'Submit Team'
                  }
                ].map((ev, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded">
                          {ev.type}
                        </span>
                        <span className="text-[12px] text-slate-500 font-medium">{ev.date}</span>
                      </div>
                      <h4 className="text-[18px] font-bold text-slate-900">{ev.title}</h4>
                      <p className="text-[14px] text-slate-600 font-medium mt-0.5">{ev.venue}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[12px] font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                        {ev.status}
                      </span>
                      <button
                        onClick={() => onActionNotification?.(`Opening pass for ${ev.title}`)}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[12px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-2xs"
                      >
                        {ev.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RESOURCES */}
          {activeTab === 'resources' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-200 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-[24px] font-bold text-slate-900 tracking-tight">Academic Documents &amp; Resource Archive</h3>
                <p className="text-[14px] text-slate-500 font-medium mt-0.5">
                  Download syllabus matrices, question papers, and official BTU guidelines
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'BTU B.Tech CSE 7th Sem Complete Syllabus', size: 'PDF • 4.2 MB', category: 'Curriculum' },
                  { title: 'BTU Academic Calendar Fall 2026 Session', size: 'PDF • 1.1 MB', category: 'Calendar' },
                  { title: 'Previous 3 Years Solved Midterm Question Bank', size: 'ZIP Archive • 18 MB', category: 'Exam Prep' },
                  { title: 'ECA Barliya Academic Block & Lab Navigation Map', size: 'High-Res PDF • 2.5 MB', category: 'Campus Guide' },
                  { title: 'B.Tech Project-1 Official Formatting Guidelines', size: 'DOCX Template • 850 KB', category: 'Project' },
                  { title: 'LEEP / Lateral Entry Academic Transfer Norms', size: 'PDF • 900 KB', category: 'Admissions' }
                ].map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-teal-700 text-2xl">description</span>
                      <div>
                        <h4 className="text-[14px] font-bold text-slate-900">{doc.title}</h4>
                        <span className="text-[12px] text-slate-500 font-medium">{doc.size}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onActionNotification?.(`Downloading ${doc.title}...`)}
                      className="p-2 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors"
                      title="Download Document"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CAMPUS AI */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm animate-in fade-in duration-200 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">smart_toy</span>
                </div>
                <div>
                  <h3 className="text-[24px] font-bold text-slate-900 tracking-tight">Campus AI Copilot Workspace</h3>
                  <p className="text-[14px] text-teal-700 font-bold">24/7 Context-Aware Assistant for ECA &amp; BTU Students</p>
                </div>
              </div>

              {/* Quick Prompt Suggestions */}
              <div>
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Recommended Questions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'What should I focus on today?',
                    'Summarize my upcoming deadlines and exams',
                    'Where is my next class and room number?',
                    'What are the syllabus topics for CS 450 midterm?'
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAiPromptClick(p)}
                      className="text-left p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-[14px] font-semibold text-slate-800 transition-all flex items-center justify-between"
                    >
                      <span>"{p}"</span>
                      <span className="material-symbols-outlined text-xs text-teal-600">arrow_forward</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Query Box */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask Campus AI anything about your ECA timetable, syllabus, or grades..."
                    className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-[14px] text-slate-900 border border-slate-200 focus:outline-none focus:border-teal-500 font-medium"
                  />
                  <button
                    onClick={() => handleAiPromptClick(aiQuery || 'Summarize my upcoming deadlines')}
                    disabled={aiLoading}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[14px] uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-2xs shrink-0"
                  >
                    {aiLoading ? 'Thinking...' : 'Ask AI'}
                  </button>
                </div>

                {/* AI Answer Card */}
                {aiResponse && (
                  <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md animate-in fade-in">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-[14px] mb-2">
                      <span className="material-symbols-outlined text-base">smart_toy</span>
                      <span>Copilot Analysis:</span>
                    </div>
                    <p className="text-[15px] text-slate-100 font-normal leading-relaxed whitespace-pre-wrap">
                      {aiResponse}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={studentProfile}
        onProfileUpdated={(updated) => setStudentProfile(updated)}
        onNotification={onActionNotification}
      />
    </div>
  );
}

// Fallback Mock Data Constants
const DEFAULT_COURSES = [
  {
    id: 1,
    code: 'PHYS 302',
    title: 'Advanced Physics Lab',
    instructor: 'Dr. Marcus Brody',
    department: 'Dept of Applied Physics',
    grade: 'A',
    nextClass: 'Today at 10:00 AM • Room 402',
    progress: '75%'
  },
  {
    id: 2,
    code: 'CS 401',
    title: 'Database Systems Phase 2',
    instructor: 'Dr. Robert Vance',
    department: 'Dept of Computer Science',
    grade: 'A+',
    nextClass: 'Wednesday at 10:00 AM • Barliya Lab 2',
    progress: '80%'
  },
  {
    id: 3,
    code: 'CS 450',
    title: 'Machine Learning Fundamentals',
    instructor: 'Prof. Elena Rostova',
    department: 'Dept of Computer Science',
    grade: 'A',
    nextClass: 'Today at 04:00 PM • Turing Hall 101',
    progress: '65%'
  },
  {
    id: 4,
    code: 'MATH 301',
    title: 'Calculus III & Numerical Analysis',
    instructor: 'Dr. S. K. Mehta',
    department: 'Dept of Mathematics',
    grade: 'B+',
    nextClass: 'Friday at 02:00 PM • Library Pod B',
    progress: '60%'
  }
];

const DEFAULT_NOTICES = [
  {
    id: 1,
    title: 'BTU Semester 7 Mid-Term Exam Time Table Released for CS/IT/AI',
    notice_type: 'Official',
    date: 'Oct 1, 2026'
  },
  {
    id: 2,
    title: 'LEEP 2026-27 Diploma Lateral Entry & 1st Year Branch Sliding Portal Live',
    notice_type: 'Department',
    date: 'Sept 28, 2026'
  },
  {
    id: 3,
    title: 'Central Library Extended Night Reading Hours for Upcoming Midterms',
    notice_type: 'Events',
    date: 'Sept 25, 2026'
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Database Systems Phase 2 Lab Report due in 2 days (Friday, 11:59 PM)',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'BTU Exam Registration Form available for Semester 3, 5, 7 students',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Technotsav 2026: Team registration pass confirmed for Robowar & Hackathon',
    created_at: new Date().toISOString()
  }
];
