import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService, openOfficialLink } from '../../services/apiService';
import EditProfileModal from './EditProfileModal';
import CampusAiWorkspace from '../chat/CampusAiWorkspace';
import CampusSyncLogo from '../ui/CampusSyncLogo';
import CommunityPostComposer from '../community/CommunityPostComposer';
import CommunityPostCard from '../community/CommunityPostCard';

export default function StudentDashboard({ user, onSignOut, onActionNotification, onReturnHome }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [studentProfile, setStudentProfile] = useState(user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI interactive quick copilot state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Notices filter & pagination
  const [noticeFilter, setNoticeFilter] = useState('All');
  const [noticePage, setNoticePage] = useState(1);
  const NOTICES_PER_PAGE = 6;

  // Resources state
  const [savedResourceIds, setSavedResourceIds] = useState(['res-1', 'res-3']);
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('All');

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = studentProfile?.full_name || studentProfile?.name || user?.full_name || user?.name || 'Student';
  const firstName = displayName.split(' ')[0] || 'Student';

  // State for all API records
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  const [resources, setResources] = useState([]);
  // Clubs state preserved for Semester 8 (Project Phase 2)
  const [events, setEvents] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // 1. Ensure active backend session token exists
      let token = localStorage.getItem('campussync_token');
      if (!token) {
        try {
          const authRes = await apiService.loginUser('student@ecajmer.ac.in', 'password123');
          if (authRes?.access_token) {
            token = authRes.access_token;
            localStorage.setItem('campussync_token', token);
          }
        } catch (authErr) {
          console.warn('Initial session sync notice:', authErr);
        }
      }

      let [
        summaryRes,
        coursesRes,
        noticesRes,
        examsRes,
        assignsRes,
        notifsRes,
        resourcesRes,
        // eventsRes preserved for Semester 8 (Major Project Phase 2)
        eventsRes,
        communityRes,
        profileRes,
      ] = await Promise.allSettled([
        apiService.getDashboardSummary(),
        apiService.getEnrolledCourses(),
        apiService.getNotices(),
        apiService.getExaminations(),
        apiService.getAssignments(),
        apiService.getNotifications(),
        apiService.getResources(),
        // apiService.getClubs() temporarily disabled for Semester 7 (Reintroduced in Sem 8)
        // apiService.getEvents() temporarily disabled for Semester 7 (Reintroduced in Sem 8 - Major Project Phase 2)
        Promise.resolve([]),
        apiService.getCommunityPosts(),
        apiService.getStudentProfile(),
      ]);

      // 2. If any core endpoint had an auth failure (401/403), re-authenticate and retry once
      const isAuthIssue = [summaryRes, coursesRes, noticesRes, examsRes].some(
        r => r.status === 'rejected' && (r.reason?.status === 401 || r.reason?.status === 403)
      );

      if (isAuthIssue) {
        try {
          const refreshRes = await apiService.loginUser('student@ecajmer.ac.in', 'password123');
          if (refreshRes?.access_token) {
            localStorage.setItem('campussync_token', refreshRes.access_token);
            const [s2, c2, n2, e2] = await Promise.allSettled([
              apiService.getDashboardSummary(),
              apiService.getEnrolledCourses(),
              apiService.getNotices(),
              apiService.getExaminations(),
            ]);
            summaryRes = s2;
            coursesRes = c2;
            noticesRes = n2;
            examsRes = e2;
          }
        } catch (retryErr) {
          console.warn('Session refresh failed:', retryErr);
        }
      }

      let hadError = false;

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setDashboardData(summaryRes.value);
      } else if (summaryRes.status === 'rejected') {
        hadError = true;
        console.error('summaryRes rejected:', summaryRes.reason);
      }

      if (coursesRes.status === 'fulfilled') {
        setCourses(Array.isArray(coursesRes.value) ? coursesRes.value : []);
      } else {
        setCourses([]);
        hadError = true;
        console.error('coursesRes rejected:', coursesRes.reason);
      }

      if (noticesRes.status === 'fulfilled') {
        setNotices(Array.isArray(noticesRes.value) ? noticesRes.value : []);
      } else {
        setNotices([]);
        hadError = true;
        console.error('noticesRes rejected:', noticesRes.reason);
      }

      if (examsRes.status === 'fulfilled') {
        setExaminations(Array.isArray(examsRes.value) ? examsRes.value : []);
      } else {
        setExaminations([]);
        hadError = true;
        console.error('examsRes rejected:', examsRes.reason);
      }

      if (assignsRes.status === 'fulfilled') {
        setAssignments(Array.isArray(assignsRes.value) ? assignsRes.value : []);
      } else {
        setAssignments([]);
      }

      if (notifsRes.status === 'fulfilled') {
        setNotificationsData(Array.isArray(notifsRes.value) ? notifsRes.value : []);
      } else {
        setNotificationsData([]);
      }

      if (resourcesRes.status === 'fulfilled') {
        setResources(Array.isArray(resourcesRes.value) ? resourcesRes.value : []);
      } else {
        setResources([]);
      }

      if (eventsRes.status === 'fulfilled') {
        setEvents(Array.isArray(eventsRes.value) ? eventsRes.value : []);
      } else {
        setEvents([]);
      }

      if (communityRes.status === 'fulfilled') {
        setCommunityPosts(Array.isArray(communityRes.value) ? communityRes.value : []);
      } else {
        setCommunityPosts([]);
      }

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setStudentProfile(prev => ({
          ...prev,
          ...profileRes.value,
          name: prev?.name || profileRes.value.full_name,
          studentId: prev?.studentId || profileRes.value.student_id,
          department: prev?.department || profileRes.value.department,
          semester: prev?.semester !== undefined ? prev?.semester : profileRes.value.semester,
        }));
      }

      if (hadError) {
        const hasAuthError = [summaryRes, coursesRes, noticesRes, examsRes].some(
          r => r.status === 'rejected' && (r.reason?.status === 401 || r.reason?.status === 403)
        );
        if (hasAuthError) {
          setApiError('Session authorization expired. Please Sign Out and Sign In to refresh your verified session.');
        } else {
          setApiError('Unable to synchronize latest records from college server. Displaying verified local session.');
        }
      } else {
        setApiError(null);
      }
    } catch (err) {
      console.error('General loadData error:', err);
      setApiError('Network connection error. Please verify backend availability.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setStudentProfile(user);
    loadData();
  }, [user, loadData]);

  const handleAiPromptClick = async (promptText) => {
    if (!promptText || !promptText.trim()) return;
    const query = promptText.trim();
    setAiQuery(query);
    setAiLoading(true);
    setAiResponse('');
    onActionNotification?.(`Campus AI: Querying verified college records for "${query}"...`);

    try {
      const response = await apiService.chatWithAI(query, [], studentProfile);
      if (response && response.answer) {
        setAiResponse(response.answer);
        return;
      }
      throw new Error('No answer received from CampusSync AI service');
    } catch (err) {
      console.error('CampusSync AI communication error:', err);
      setAiResponse(`⚠️ **AI Service Notice**: Unable to reach CampusSync AI service (${err.message || 'Network failure'}). Please check your connection and ensure the backend is running.`);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleSaveResource = (id, title) => {
    if (savedResourceIds.includes(id)) {
      setSavedResourceIds(prev => prev.filter(item => item !== id));
      onActionNotification?.(`Removed "${title}" from saved offline library`);
    } else {
      setSavedResourceIds(prev => [...prev, id]);
      onActionNotification?.(`Saved "${title}" to your offline library`);
    }
  };

  // Filtered notices based on active category pill and search
  const filteredNotices = useMemo(() => {
    let result = notices;
    if (noticeFilter === 'Official') {
      result = result.filter(n => n.data_origin === 'VERIFIED_OFFICIAL' || n.notice_type === 'Official');
    } else if (noticeFilter === 'Department') {
      result = result.filter(n => n.scope === 'DEPARTMENT_SPECIFIC' || n.classification_scope === 'DEPARTMENT_SPECIFIC' || n.notice_type === 'Department');
    } else if (noticeFilter === 'Semester') {
      result = result.filter(n => n.scope === 'SEMESTER_SPECIFIC' || n.classification_scope === 'SEMESTER_SPECIFIC' || n.target_semester != null || n.semester != null);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notices, noticeFilter, searchQuery]);

  const paginatedNotices = useMemo(() => {
    const start = (noticePage - 1) * NOTICES_PER_PAGE;
    return filteredNotices.slice(start, start + NOTICES_PER_PAGE);
  }, [filteredNotices, noticePage]);

  const totalNoticePages = Math.max(1, Math.ceil(filteredNotices.length / NOTICES_PER_PAGE));

  // Navigation sidebar configuration
  const sidebarNavItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', category: 'Academic Core', badge: null },
    { id: 'notices', label: 'Official Notices', icon: 'campaign', category: 'Academic Core', badge: `${notices.filter(n => n.data_origin === 'VERIFIED_OFFICIAL').length} Verified` },
    { id: 'examinations', label: 'Examinations', icon: 'event_available', category: 'Academic Core', badge: `${examinations.length} Active` },
    { id: 'community', label: 'Community', icon: 'forum', category: 'Campus Life', badge: 'Active' },
    { id: 'ai', label: 'CampusSync AI', icon: 'smart_toy', category: 'Intelligence', badge: 'Verified RAG', badgeColor: 'bg-[#71d8c8]/20 text-[#71d8c8] border border-[#71d8c8]/40' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#04132a] text-[#d7e3ff] p-6 max-w-[1440px] mx-auto animate-pulse flex flex-col gap-6 font-sans">
        <div className="bg-[#0d1b33] border border-slate-800 h-20 rounded-2xl w-full flex items-center px-6 justify-between">
          <div className="h-8 w-48 bg-slate-800/80 rounded-xl"></div>
          <div className="h-10 w-48 bg-slate-800/80 rounded-xl"></div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 h-[500px] bg-[#0d1b33] border border-slate-800 rounded-2xl shrink-0 hidden lg:block"></div>
          <div className="flex-1 space-y-6">
            <div className="h-56 bg-[#0d1b33] border border-slate-800 rounded-2xl w-full"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-[#0d1b33] border border-slate-800 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 h-96 bg-[#0d1b33] border border-slate-800 rounded-2xl"></div>
              <div className="lg:col-span-5 h-96 bg-[#0d1b33] border border-slate-800 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04132a] text-[#d7e3ff] font-sans antialiased flex flex-col selection:bg-[#71d8c8]/30 selection:text-white">
      {/* 1. Header Bar - Cleaned: search bar and notifications removed per requirements */}
      <header className="bg-[#071733]/90 backdrop-blur-xl border-b border-slate-800/90 sticky top-0 z-40 px-4 md:px-8 py-3.5 shadow-md">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Crest & Portal Context */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onReturnHome}
              className="w-10 h-10 rounded-xl bg-[#0d1b33] border border-slate-700/70 text-[#71d8c8] hover:bg-[#71d8c8]/15 hover:border-[#71d8c8]/50 flex items-center justify-center transition-all shadow-sm group shrink-0 cursor-pointer"
              title="Return to Public CampusSync Website"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
            </button>
            <div className="flex items-center gap-2.5">
              <CampusSyncLogo
                variant="horizontal"
                theme="dark"
                size={38}
                className="h-9 md:h-10 w-auto"
              />
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#71d8c8]/15 text-[#71d8c8] border border-[#71d8c8]/30 uppercase tracking-wider hidden lg:inline">
                Live Portal
              </span>
            </div>
          </div>

          {/* Right: Student Profile & Sign Out */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Profile Pill */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-xl border border-slate-700/70 hover:border-[#71d8c8]/50 bg-[#0d1b33] hover:bg-[#112240] transition-all cursor-pointer shadow-xs group"
              title="Click to View Official Record"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#71d8c8] to-[#1c786c] text-[#04132a] font-extrabold text-xs flex items-center justify-center shadow-xs">
                {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-xs font-bold text-white group-hover:text-[#71d8c8] transition-colors truncate max-w-[150px]">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {studentProfile?.studentId || '22ECA081'} • Sem {studentProfile?.semester || 7}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm hidden sm:block">
                expand_more
              </span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Sign Out of Portal"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Tab Views */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* 2. Modern Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-[#0d1b33]/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-800/90 shadow-lg lg:sticky lg:top-24 z-20">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3 hidden lg:block">
            Command Center
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
            {sidebarNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onActionNotification?.(`Navigated to ${item.label}`);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full ${isActive
                      ? 'bg-gradient-to-r from-[#71d8c8]/20 to-[#71d8c8]/5 border-l-4 border-[#71d8c8] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border-l-4 border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-[#71d8c8]' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${isActive
                          ? 'bg-[#71d8c8]/30 text-[#71d8c8]'
                          : item.badgeColor || 'bg-slate-800 text-slate-400 border border-slate-700/60'
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Student Profile Card in Sidebar */}
          <div className="hidden lg:block mt-6 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-[#09152a] border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#71d8c8]/20 border border-[#71d8c8]/30 flex items-center justify-center text-[#71d8c8] text-xs font-bold">
                  {studentProfile?.semester ? `S${studentProfile.semester}` : 'BT'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{studentProfile?.department || 'CSE Department'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span>ID: {studentProfile?.studentId || '22ECA8941'}</span>
                <span className="text-[#71d8c8] font-bold">VERIFIED</span>
              </div>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">manage_accounts</span>
              <span>Edit Profile Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          {apiError && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-lg">warning</span>
                <span>{apiError}</span>
              </div>
              <button
                onClick={() => loadData()}
                className="bg-amber-600/40 hover:bg-amber-600 text-amber-100 text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider transition-colors shrink-0"
              >
                Retry Sync
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: OVERVIEW (ACADEMIC COMMAND CENTER)                          */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* 1. Academic Command Center Hero Banner */}
              <div className="bg-gradient-to-br from-[#0d1b33] via-[#09152a] to-[#050f20] rounded-2xl p-6 md:p-7 border border-slate-700/80 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#71d8c8] via-[#bac3ff] to-[#e6c277]"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-[#71d8c8]/10 border border-[#71d8c8]/30 px-3 py-1 rounded-full text-[11px] font-bold text-[#71d8c8] uppercase tracking-wider mb-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#71d8c8] animate-ping"></span>
                      Academic Command Center • Semester {studentProfile?.semester || 7} • {studentProfile?.department || 'CSE'}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#71d8c8] to-[#bac3ff]">{firstName}</span>!
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 font-medium leading-relaxed max-w-xl">
                      You have <span className="text-white font-bold">{examinations.length} scheduled examinations</span> and{' '}
                      <span className="text-white font-bold">{notices.filter(n => n.data_origin === 'VERIFIED_OFFICIAL').length} verified notices</span> in your cohort.
                    </p>

                    <div className="flex flex-wrap gap-2.5 mt-4">
                      <button
                        onClick={() => setActiveTab('notices')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#71d8c8] text-[#04132a] hover:bg-[#8ef4e4] transition-all shadow-md cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">campaign</span>
                        <span>Official Notices</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('examinations')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132747] text-white border border-slate-700 hover:border-[#71d8c8]/50 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">event_available</span>
                        <span>Exam Schedule</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('ai')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132747] text-white border border-slate-700 hover:border-[#71d8c8]/50 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">smart_toy</span>
                        <span>Ask CampusSync AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Highlight: Next Important Action / Exam Milestone Card */}
                  {examinations.length > 0 ? (
                    <div className="w-full lg:w-auto bg-[#10223d]/90 rounded-2xl p-4 md:p-5 border border-[#71d8c8]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#71d8c8] to-[#1a6e63] text-[#04132a] flex flex-col items-center justify-center shrink-0 shadow-md">
                          <span className="text-[10px] font-extrabold uppercase leading-none">Exam</span>
                          <span className="text-xs font-extrabold mt-0.5">{examinations[0].start_time ? examinations[0].start_time.slice(0, 5) : 'Active'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#71d8c8]/20 text-[#71d8c8] border border-[#71d8c8]/30">
                              {examinations[0].exam_type || 'Examination'}
                            </span>
                            <span className="text-xs text-slate-300 font-semibold">{examinations[0].exam_date}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {examinations[0].course_code ? `${examinations[0].course_code}: ` : ''}{examinations[0].course_name}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">
                            Hall {examinations[0].hall_number || 'TBA'} • Max Marks: {examinations[0].max_marks || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (examinations[0].document_url) {
                            window.open(examinations[0].document_url, '_blank', 'noopener,noreferrer');
                          } else {
                            onActionNotification?.(`Exam details: ${examinations[0].course_name} on ${examinations[0].exam_date}`);
                          }
                        }}
                        className="bg-[#71d8c8] hover:bg-[#8ef4e4] text-[#04132a] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center shrink-0 cursor-pointer"
                      >
                        <span>{examinations[0].document_url ? 'View Schedule PDF' : 'Details'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full lg:w-auto bg-[#10223d]/90 rounded-2xl p-4 md:p-5 border border-slate-700 shadow-xl flex items-center gap-3.5 shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[#71d8c8]/20 text-[#71d8c8] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">event_available</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#71d8c8]/20 text-[#71d8c8] border border-[#71d8c8]/30">
                          Schedule Clear
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">
                          No Immediate Deadlines
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Semester {studentProfile?.semester || 7} • {studentProfile?.department || 'Engineering'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Authenticated Academic Metrics Grid - Cleaned: Enrolled Courses & Pending Tasks removed */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab('examinations')}
                  className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-[#e6c277]/50 transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Examinations</span>
                    <div className="w-8 h-8 rounded-lg bg-[#e6c277]/15 text-[#e6c277] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">event_available</span>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {examinations.length}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {examinations.length > 0 ? `Next: ${examinations[0].exam_date}` : 'Schedule Synchronized'}
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('notices')}
                  className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verified Notices</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">verified</span>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {notices.filter(n => n.data_origin === 'VERIFIED_OFFICIAL').length}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Official BTU & ECA Circulars
                  </p>
                </div>

                <div className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-[#71d8c8]/40 transition-all shadow-md group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Academic Term</span>
                    <div className="w-8 h-8 rounded-lg bg-[#71d8c8]/15 text-[#71d8c8] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">school</span>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    Semester {studentProfile?.semester || 7}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Batch 2023–2027 • Final Year
                  </p>
                </div>

                <div className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-[#bac3ff]/40 transition-all shadow-md group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                    <div className="w-8 h-8 rounded-lg bg-[#bac3ff]/15 text-[#bac3ff] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">verified_user</span>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 leading-tight">
                    Enrolled
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {studentProfile?.department || 'Computer Engineering'}
                  </p>
                </div>
              </div>

              {/* 3. Core Workspace Grid - Reorganized naturally without empty spaces */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Official Notice Board (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#71d8c8]">campaign</span>
                          <span>Official Notice Board</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Verified administrative and BTU notifications
                        </p>
                      </div>
                      <span className="text-xs bg-[#71d8c8]/15 text-[#71d8c8] border border-[#71d8c8]/30 px-2.5 py-1 rounded-full font-bold">
                        {filteredNotices.length} Active
                      </span>
                    </div>

                    {/* Notice Board Search & Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      {/* Filter Pills */}
                      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                        {['All', 'Official', 'Department', 'Semester'].map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setNoticeFilter(f);
                              setNoticePage(1);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              noticeFilter === f
                                ? 'bg-[#71d8c8] text-[#04132a] shadow-xs'
                                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {/* Notice Keyword Filter */}
                      <div className="relative w-full sm:w-56">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">search</span>
                        <input
                          type="text"
                          placeholder="Filter circulars..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setNoticePage(1);
                          }}
                          className="w-full bg-[#081528] rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 border border-slate-700/70 focus:outline-hidden focus:border-[#71d8c8] focus:ring-1 focus:ring-[#71d8c8] transition-all font-medium"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {paginatedNotices.length === 0 ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">notifications_off</span>
                        <h4 className="text-sm font-bold text-slate-300">No notices found</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                          No active notices matching the filter "{noticeFilter}".
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paginatedNotices.map((n) => (
                          <div
                            key={n.id}
                            className="p-3.5 rounded-xl bg-[#081528] border border-slate-800/90 hover:border-[#71d8c8]/40 transition-all flex items-start justify-between gap-3 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#71d8c8]/20 text-[#71d8c8] uppercase">
                                  {n.scope ? n.scope.replace('_SPECIFIC', '') : (n.classification_scope ? n.classification_scope.replace('_SPECIFIC', '') : (n.notice_type || 'Official'))}
                                </span>
                                {n.data_origin === 'VERIFIED_OFFICIAL' && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <span className="material-symbols-outlined text-[12px]">verified</span>
                                    Official
                                  </span>
                                )}
                                {(n.data_origin === 'DEMO_SEED' || n.verification_status === 'PENDING_VERIFICATION') && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Pending Review
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {n.date || (n.published_date ? new Date(n.published_date).toLocaleDateString() : 'Active')}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white group-hover:text-[#71d8c8] transition-colors leading-snug">
                                {n.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  openOfficialLink(
                                    n.action_url || n.target_url || n.download_url || n.document_url || n.source_url || 'https://www.ecajmer.ac.in',
                                    onActionNotification,
                                    'Official notice link is currently unavailable.'
                                  )
                                }
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  n.destination_type === 'HOSTED_DOWNLOAD'
                                    ? 'text-emerald-400 hover:bg-emerald-500/20'
                                    : n.destination_type === 'OFFICIAL_DOCUMENT'
                                      ? 'text-[#71d8c8] hover:bg-[#71d8c8]/20'
                                      : n.destination_type === 'OFFICIAL_PAGE'
                                        ? 'text-blue-400 hover:bg-blue-500/20'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }`}
                                title={
                                  n.destination_type === 'HOSTED_DOWNLOAD'
                                    ? 'Download CampusSync-Hosted Document'
                                    : n.destination_type === 'OFFICIAL_DOCUMENT'
                                      ? 'Open Verified Official Notice Document'
                                      : n.destination_type === 'OFFICIAL_PAGE'
                                        ? 'Open Official Notice Webpage'
                                        : 'Official notice link is currently unavailable'
                                }
                              >
                                <span className="material-symbols-outlined text-base">
                                  {n.destination_type === 'HOSTED_DOWNLOAD'
                                    ? 'download'
                                    : n.destination_type === 'OFFICIAL_DOCUMENT'
                                      ? 'description'
                                      : n.destination_type === 'OFFICIAL_PAGE'
                                        ? 'open_in_new'
                                        : 'link_off'}
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notice Pagination Controls */}
                    {totalNoticePages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                        <span>Page {noticePage} of {totalNoticePages}</span>
                        <div className="flex gap-1.5">
                          <button
                            disabled={noticePage <= 1}
                            onClick={() => setNoticePage(p => Math.max(1, p - 1))}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all cursor-pointer"
                          >
                            Prev
                          </button>
                          <button
                            disabled={noticePage >= totalNoticePages}
                            onClick={() => setNoticePage(p => Math.min(totalNoticePages, p + 1))}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Upcoming Examinations & Campus AI (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Upcoming Examinations Card */}
                  <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#e6c277]">event_available</span>
                          <span>Upcoming Examinations</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Midterms, end-semester and practical exams
                        </p>
                      </div>
                      <span className="text-xs bg-[#e6c277]/15 text-[#e6c277] border border-[#e6c277]/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        {examinations.length} Active
                      </span>
                    </div>

                    {examinations.length === 0 ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">event_available</span>
                        <h4 className="text-sm font-bold text-slate-300">No scheduled exam deadlines</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Official examination notices and practical schedules will appear here once published.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {examinations.map((exam) => (
                          <div
                            key={`exam-${exam.id}`}
                            className="p-4 rounded-xl bg-[#081528] border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  {exam.exam_type || 'Examination'}
                                </span>
                                <span className="text-xs text-slate-300 font-bold">
                                  {exam.exam_date} {exam.start_time ? `• ${exam.start_time}` : ''}
                                </span>
                                {exam.data_origin === 'VERIFIED_OFFICIAL' && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <span className="material-symbols-outlined text-[12px]">verified</span>
                                    Official
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1.5">
                                {exam.course_code ? `${exam.course_code}: ` : ''}{exam.course_name}
                              </h4>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Hall: {exam.hall_number || 'TBA'} • Max Marks: {exam.max_marks || 'N/A'} • {exam.department}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (exam.document_url) {
                                  window.open(exam.document_url, '_blank', 'noopener,noreferrer');
                                } else {
                                  onActionNotification?.(`Exam details: ${exam.course_name} on ${exam.exam_date}`);
                                }
                              }}
                              className="border border-amber-500/40 hover:bg-amber-500/20 text-amber-200 font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                            >
                              {exam.document_url ? 'Schedule PDF' : 'Details'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CampusSync AI Copilot Box */}
                  <div className="bg-gradient-to-br from-[#0e2448] to-[#071733] rounded-2xl p-5 border border-[#71d8c8]/40 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#71d8c8] to-[#146e62] flex items-center justify-center text-[#04132a] shadow-md shrink-0">
                        <span className="material-symbols-outlined text-xl">smart_toy</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>CampusSync AI Copilot</span>
                          <span className="text-[9px] bg-[#71d8c8]/20 text-[#71d8c8] border border-[#71d8c8]/30 px-1.5 py-0.2 rounded font-mono">
                            RAG ONLINE
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Instant verified answers grounded on official ECA circulars
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {[
                        'When is the 7th semester practical examination?',
                        'Show BTU examination and grading rules',
                        'What are the campus library operating hours?'
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAiPromptClick(prompt)}
                          className="w-full text-left p-2 rounded-xl bg-[#081528]/80 hover:bg-[#71d8c8]/15 border border-slate-700/60 hover:border-[#71d8c8]/40 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate">{prompt}</span>
                          <span className="material-symbols-outlined text-sm text-slate-500 group-hover:text-[#71d8c8] shrink-0 ml-1">
                            arrow_forward
                          </span>
                        </button>
                      ))}
                    </div>

                    {aiLoading && (
                      <div className="p-3 rounded-xl bg-[#081528] border border-slate-700 text-xs text-[#71d8c8] flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        <span>Retrieving verified official records...</span>
                      </div>
                    )}

                    {aiResponse && (
                      <div className="p-3.5 rounded-xl bg-[#081528] border border-[#71d8c8]/40 text-xs text-slate-200 mb-3 max-h-48 overflow-y-auto leading-relaxed">
                        <p className="font-bold text-[#71d8c8] mb-1">CampusSync AI Answer:</p>
                        <div className="whitespace-pre-wrap">{aiResponse}</div>
                      </div>
                    )}

                    <button
                      onClick={() => setActiveTab('ai')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#71d8c8] to-[#8ef4e4] text-[#04132a] font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Full AI Workspace</span>
                      <span className="material-symbols-outlined text-base">open_in_full</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Lower Highlights (Campus Community Discussions) */}
              <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-800 gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#71d8c8]">forum</span>
                        <span>Campus Community Discussions</span>
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">Recent peer questions, notes, and cohort polls</p>
                    </div>
                    <span className="text-xs bg-[#71d8c8]/15 text-[#71d8c8] border border-[#71d8c8]/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                      {communityPosts.length} Active
                    </span>
                  </div>

                  {communityPosts.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800">
                      <span className="material-symbols-outlined text-4xl text-slate-600 mb-1">forum</span>
                      <p className="text-xs font-semibold text-slate-400">No discussions posted yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Start a new thread or ask a question in Campus Community.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {communityPosts.slice(0, 3).map((post, idx) => (
                        <div key={post.id || idx} className="p-4 rounded-xl bg-[#081528] border border-slate-800 flex flex-col justify-between hover:border-[#71d8c8]/40 transition-colors">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                              <span className="font-bold text-white truncate max-w-[140px]">{post.author_name || 'ECA Student'}</span>
                              <span className="shrink-0">{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}</span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium line-clamp-3 leading-relaxed">
                              {post.content}
                            </p>
                          </div>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-3 pt-2 border-t border-slate-800/60">
                              {post.tags.slice(0, 2).map((t) => (
                                <span key={t} className="text-[10px] text-[#71d8c8] font-mono">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setActiveTab('community')}
                    className="w-full sm:w-auto px-6 bg-slate-800/80 hover:bg-[#71d8c8] hover:text-[#04132a] text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Open Campus Community</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: NOTICES                                                   */}
          {/* ============================================================== */}
          {activeTab === 'notices' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#71d8c8]">campaign</span>
                    <span>Official BTU & ECA Notice Board</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Verified administrative orders, academic circulars, and departmental updates
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#71d8c8]/15 border border-[#71d8c8]/30 text-[#71d8c8] text-xs font-bold">
                  {filteredNotices.length} Notices Available
                </div>
              </div>

              {/* Notice Controls: Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                  {['All', 'Official', 'Department', 'Semester'].map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setNoticeFilter(f);
                        setNoticePage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        noticeFilter === f
                          ? 'bg-[#71d8c8] text-[#04132a] shadow-xs'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input
                    type="text"
                    placeholder="Search circulars by keyword..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setNoticePage(1);
                    }}
                    className="w-full bg-[#081528] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 border border-slate-700/70 focus:outline-hidden focus:border-[#71d8c8] focus:ring-1 focus:ring-[#71d8c8] transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Notices List */}
              {paginatedNotices.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">notifications_off</span>
                  <h4 className="text-base font-bold text-slate-300">No notices found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    No verified notices matching "{noticeFilter}" {searchQuery ? `and query "${searchQuery}"` : ''}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedNotices.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-xl bg-[#081528] border border-slate-800 hover:border-[#71d8c8]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#71d8c8]/20 text-[#71d8c8] uppercase">
                            {n.scope ? n.scope.replace('_SPECIFIC', '') : (n.classification_scope ? n.classification_scope.replace('_SPECIFIC', '') : (n.notice_type || 'Official'))}
                          </span>
                          {n.data_origin === 'VERIFIED_OFFICIAL' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Official
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">
                            {n.date || (n.published_date ? new Date(n.published_date).toLocaleDateString() : 'Active')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#71d8c8] transition-colors leading-snug">
                          {n.title}
                        </h4>
                        {n.content && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {n.content}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 self-start sm:self-auto">
                        <button
                          onClick={() =>
                            openOfficialLink(
                              n.action_url || n.target_url || n.download_url || n.document_url || n.source_url || 'https://www.ecajmer.ac.in',
                              onActionNotification,
                              'Official notice link is currently unavailable.'
                            )
                          }
                          className="px-3.5 py-2 rounded-xl bg-[#71d8c8]/15 hover:bg-[#71d8c8] text-[#71d8c8] hover:text-[#04132a] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>{n.destination_type === 'HOSTED_DOWNLOAD' ? 'Download PDF' : 'View Circular'}</span>
                          <span className="material-symbols-outlined text-sm">
                            {n.destination_type === 'HOSTED_DOWNLOAD' ? 'download' : 'open_in_new'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalNoticePages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <span>Page {noticePage} of {totalNoticePages}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={noticePage <= 1}
                      onClick={() => setNoticePage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      disabled={noticePage >= totalNoticePages}
                      onClick={() => setNoticePage(p => Math.min(totalNoticePages, p + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: EXAMINATIONS                                              */}
          {/* ============================================================== */}
          {activeTab === 'examinations' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e6c277]">event_available</span>
                    <span>Academic Examination Schedule</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Official BTU midterms, end-semester examinations, and practical assessments
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#e6c277]/15 border border-[#e6c277]/30 text-[#e6c277] text-xs font-bold">
                  {examinations.length} Scheduled
                </div>
              </div>

              {examinations.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">event_available</span>
                  <h4 className="text-base font-bold text-slate-300">No scheduled examinations at this moment</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Official BTU examination dates and practical schedules for Semester {studentProfile?.semester || 7} will appear here once published by the examination branch.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examinations.map((exam) => (
                    <div
                      key={`exam-tab-${exam.id}`}
                      className="p-5 rounded-2xl bg-[#081528] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {exam.exam_type || 'Examination'}
                          </span>
                          <span className="text-xs text-slate-300 font-bold">
                            {exam.exam_date} {exam.start_time ? `• ${exam.start_time}` : ''}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white leading-snug">
                          {exam.course_code ? `${exam.course_code}: ` : ''}{exam.course_name}
                        </h4>
                        <div className="mt-3 space-y-1 text-xs text-slate-400 font-medium">
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-500">meeting_room</span>
                            <span>Venue / Hall: <strong className="text-slate-300">{exam.hall_number || 'TBA'}</strong></span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-500">grade</span>
                            <span>Max Marks: <strong className="text-slate-300">{exam.max_marks || 'N/A'}</strong></span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-slate-500">domain</span>
                            <span>Department: <strong className="text-slate-300">{exam.department || studentProfile?.department}</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400 font-medium">Official Assessment</span>
                        <button
                          onClick={() => {
                            if (exam.document_url) {
                              window.open(exam.document_url, '_blank', 'noopener,noreferrer');
                            } else {
                              onActionNotification?.(`Official schedule details: ${exam.course_name} on ${exam.exam_date}`);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-[#04132a] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>{exam.document_url ? 'Schedule PDF' : 'Details'}</span>
                          <span className="material-symbols-outlined text-sm">
                            {exam.document_url ? 'download' : 'info'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fallback alias: If a user ever navigates to legacy tabs, route cleanly */}
          {(activeTab === 'academics' || activeTab === 'resources') && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-4 text-center">
              <span className="material-symbols-outlined text-4xl text-[#71d8c8]">event_available</span>
              <h3 className="text-lg font-bold text-white">Academic Schedule & Examinations</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Academic schedules and syllabus circulars are unified under Examinations and Official Notices for Semester {studentProfile?.semester || 7}.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 rounded-xl bg-[#71d8c8] text-[#04132a] text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Return to Command Center
                </button>
                <button
                  onClick={() => setActiveTab('examinations')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  View Examinations
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: COMMUNITY                                                 */}
          {/* ============================================================== */}
          {activeTab === 'community' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#71d8c8]">forum</span>
                    <span>Campus Community</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Peer discussions, academic notes, live polls, and college project collaborations
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-300 bg-[#081528] px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-xs self-start sm:self-auto">
                  <span className="text-[#71d8c8] font-bold">{communityPosts.length}</span> Discussions Active
                </div>
              </div>

              {/* Rich Community Post Composer */}
              <CommunityPostComposer
                currentUser={studentProfile || user}
                onPostCreated={(newPost) => setCommunityPosts((prev) => [newPost, ...prev])}
                onRequireAuth={() => onActionNotification?.('Please sign in to participate in the community.')}
                onActionNotification={onActionNotification}
              />

              {/* Discussions Feed */}
              {communityPosts.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-2">forum</span>
                  <h4 className="text-base font-bold text-slate-300">No community discussions posted yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Be the first in your cohort to ask a question, share research notes, or start a live poll above!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <CommunityPostCard
                      key={post.id}
                      post={post}
                      currentUser={studentProfile || user}
                      onPostDeleted={(deletedId) =>
                        setCommunityPosts((prev) => prev.filter((p) => p.id !== deletedId))
                      }
                      onActionNotification={onActionNotification}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CLUBS & SAC temporarily disabled for Semester 7 (Preserved for Semester 8 - Project Phase 2) */}

          {/* TAB: EVENTS temporarily disabled for Semester 7 (Preserved for Semester 8 - Major Project Phase 2) */}
          {/*
          activeTab === 'events' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Campus Events & Technical Fests</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Tarangini, Technorion hackathons, and departmental workshops
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-[#e6c277]/15 border border-[#e6c277]/30 text-[#e6c277] text-xs font-bold">
                  {events.length} Scheduled
                </div>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">event_busy</span>
                  <p className="text-sm font-semibold text-slate-400">No scheduled events at this moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {events.map((ev, idx) => (
                    <div key={ev.id || idx} className="p-5 rounded-2xl bg-[#081528] border border-slate-800 hover:border-[#e6c277]/40 transition-all flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {ev.event_type || 'Event'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {ev.start_time ? new Date(ev.start_time).toLocaleDateString() : 'Upcoming'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{ev.title}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Location: {ev.location || 'College Auditorium'}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onActionNotification?.(`Registered for event pass: ${ev.title}`)}
                        className="mt-4 w-full bg-[#e6c277] hover:bg-[#ffdf9f] text-[#04132a] font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all shadow-xs"
                      >
                        Register for Pass
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
          */}



          {/* ============================================================== */}
          {/* TAB: CAMPUSSYNC AI WORKSPACE                                   */}
          {/* ============================================================== */}
          {activeTab === 'ai' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in duration-200 overflow-hidden">
              <CampusAiWorkspace
                studentProfile={studentProfile}
                onActionNotification={onActionNotification}
              />
            </div>
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={studentProfile}
        onProfileUpdated={(updated) => {
          setStudentProfile(prev => ({ ...prev, ...updated }));
          onActionNotification?.('Academic profile updated successfully!');
        }}
        onNotification={onActionNotification}
      />
    </div>
  );
}
