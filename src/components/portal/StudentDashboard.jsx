import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService, openOfficialLink } from '../../services/apiService';
import EditProfileModal from './EditProfileModal';
import CampusAiWorkspace from '../chat/CampusAiWorkspace';

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
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);

  // Community post creation state
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

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
        clubsRes,
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
        apiService.getClubs(),
        apiService.getEvents(),
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

      if (clubsRes.status === 'fulfilled') {
        setClubs(Array.isArray(clubsRes.value) ? clubsRes.value : []);
      } else {
        setClubs([]);
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

  const handleCreateCommunityPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsSubmittingPost(true);
    try {
      const tagsArray = newPostTags
        ? newPostTags.split(',').map(t => t.trim()).filter(Boolean)
        : ['General', 'StudentLife'];
      const created = await apiService.createCommunityPost({
        content: newPostContent.trim(),
        tags: tagsArray
      });
      setCommunityPosts(prev => [created, ...prev]);
      setNewPostContent('');
      setNewPostTags('');
      setIsNewPostModalOpen(false);
      onActionNotification?.('Discussion thread published to Community Square!');
    } catch (err) {
      onActionNotification?.(`Error publishing post: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmittingPost(false);
    }
  };

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
    { id: 'academics', label: 'Academics', icon: 'school', category: 'Academic Core', badge: `${courses.length} Courses` },
    { id: 'resources', label: 'Study Resources', icon: 'folder_open', category: 'Academic Core', badge: `${resources.length} Docs` },
    { id: 'community', label: 'Community', icon: 'forum', category: 'Campus Life', badge: 'Active' },
    { id: 'clubs', label: 'Clubs & SAC', icon: 'groups', category: 'Campus Life', badge: `${clubs.length} Joined` },
    { id: 'events', label: 'Events', icon: 'event', category: 'Campus Life', badge: `${events.length} Upcoming` },
    { id: 'ai', label: 'CampusSync AI', icon: 'smart_toy', category: 'Intelligence', badge: 'Verified RAG', badgeColor: 'bg-[#71d8c8]/20 text-[#71d8c8] border border-[#71d8c8]/40' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#04132a] text-[#d7e3ff] p-6 max-w-[1440px] mx-auto animate-pulse flex flex-col gap-6 font-sans">
        <div className="bg-[#0d1b33] border border-slate-800 h-20 rounded-2xl w-full flex items-center px-6 justify-between">
          <div className="h-8 w-48 bg-slate-800/80 rounded-xl"></div>
          <div className="h-10 w-64 bg-slate-800/80 rounded-xl"></div>
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
      {/* 1. Header Bar */}
      <header className="bg-[#071733]/90 backdrop-blur-xl border-b border-slate-800/90 sticky top-0 z-40 px-4 md:px-8 py-3.5 shadow-md">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Crest & Portal Context */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button
              onClick={onReturnHome}
              className="w-10 h-10 rounded-xl bg-[#0d1b33] border border-slate-700/70 text-[#71d8c8] hover:bg-[#71d8c8]/15 hover:border-[#71d8c8]/50 flex items-center justify-center transition-all shadow-sm group"
              title="Return to Public CampusSync Website"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>CampusSync</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#71d8c8]/15 text-[#71d8c8] border border-[#71d8c8]/30 uppercase tracking-wider hidden sm:inline">
                    Live Portal
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Govt. Engineering College Ajmer • BTU Affiliated
              </p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-lg mx-2 hidden md:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search schedule, notices, courses, study resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d1b33]/90 rounded-xl pl-10 pr-12 py-2 text-sm text-slate-100 placeholder:text-slate-500 border border-slate-700/70 focus:outline-none focus:border-[#71d8c8] focus:ring-1 focus:ring-[#71d8c8] transition-all font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right: Notifications, Student Profile & Sign Out */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl border border-slate-700/70 bg-[#0d1b33] hover:bg-[#112240] text-slate-300 hover:text-white transition-all shadow-xs"
                title="Notifications & Alerts"
              >
                <span className="material-symbols-outlined text-xl text-[#71d8c8]">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#04132a] animate-pulse"></span>
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0d1b33] rounded-2xl p-4 border border-slate-700/80 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#71d8c8] text-base">campaign</span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Campus Alerts</span>
                    </div>
                    <span className="text-[11px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                      {notificationsData.length || 2} New
                    </span>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {notificationsData.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onActionNotification?.(`Opening alert: ${n.title}`);
                          setShowNotifications(false);
                        }}
                        className="p-3 rounded-xl hover:bg-[#162744] transition-colors cursor-pointer border border-slate-800/80 hover:border-slate-700"
                      >
                        <p className="text-xs font-semibold text-white leading-snug">{n.title}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>{n.source || 'College Administration'}</span>
                          <span>{n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today'}</span>
                        </div>
                      </div>
                    ))}
                    {notificationsData.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No unread alerts.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-700/70 hover:border-[#71d8c8]/50 bg-[#0d1b33] hover:bg-[#112240] transition-all cursor-pointer shadow-xs group"
              title="Click to Edit Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#71d8c8] to-[#1c786c] text-[#04132a] font-extrabold text-xs flex items-center justify-center shadow-xs">
                {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <p className="text-xs font-bold text-white group-hover:text-[#71d8c8] transition-colors truncate max-w-[140px]">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {studentProfile?.studentId || '22ECA8941'} • Sem {studentProfile?.semester || 7}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm hidden sm:block">
                expand_more
              </span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 px-3 py-2 rounded-xl transition-all shadow-xs"
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 lg:w-full ${
                    isActive
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
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                        isActive
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
                      You have <span className="text-white font-bold">{courses.length} courses</span> active,{' '}
                      <span className="text-white font-bold">{examinations.length} scheduled examinations</span>, and{' '}
                      <span className="text-white font-bold">{notices.filter(n => n.data_origin === 'VERIFIED_OFFICIAL').length} verified notices</span> in your cohort.
                    </p>

                    <div className="flex flex-wrap gap-2.5 mt-4">
                      <button
                        onClick={() => setActiveTab('ai')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#71d8c8] text-[#04132a] hover:bg-[#8ef4e4] transition-all shadow-md"
                      >
                        <span className="material-symbols-outlined text-base">smart_toy</span>
                        <span>Ask CampusSync AI</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('academics')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#132747] text-white border border-slate-700 hover:border-[#71d8c8]/50 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">school</span>
                        <span>View Curriculum</span>
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
                        className="bg-[#71d8c8] hover:bg-[#8ef4e4] text-[#04132a] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center shrink-0"
                      >
                        <span>{examinations[0].document_url ? 'View Schedule PDF' : 'Details'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  ) : assignments.length > 0 ? (
                    <div className="w-full lg:w-auto bg-[#10223d]/90 rounded-2xl p-4 md:p-5 border border-slate-700 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                          <span className="text-[10px] font-extrabold uppercase leading-none">Task</span>
                          <span className="text-xs font-extrabold mt-0.5">Due</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Assignment
                            </span>
                            <span className="text-xs text-slate-300 font-semibold">
                              {assignments[0].due_date ? new Date(assignments[0].due_date).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {assignments[0].title}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">
                            Max Score: {assignments[0].max_score || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onActionNotification?.(`Opening submission for: ${assignments[0].title}`)}
                        className="bg-[#71d8c8] hover:bg-[#8ef4e4] text-[#04132a] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center shrink-0"
                      >
                        <span>Submit</span>
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

              {/* 2. Authenticated Academic Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-[#71d8c8]/40 transition-all shadow-md group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enrolled Courses</span>
                    <div className="w-8 h-8 rounded-lg bg-[#71d8c8]/15 text-[#71d8c8] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">menu_book</span>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {dashboardData?.enrolled_courses ?? courses.length}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    Semester {studentProfile?.semester || 7} • Registered
                  </p>
                </div>

                <div className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-[#e6c277]/40 transition-all shadow-md group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Examinations</span>
                    <div className="w-8 h-8 rounded-lg bg-[#e6c277]/15 text-[#e6c277] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">event_available</span>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {dashboardData?.upcoming_examinations ?? examinations.length}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {examinations.length > 0 ? `Next: ${examinations[0].exam_date}` : 'No upcoming exam'}
                  </p>
                </div>

                <div className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-[#bac3ff]/40 transition-all shadow-md group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Tasks</span>
                    <div className="w-8 h-8 rounded-lg bg-[#bac3ff]/15 text-[#bac3ff] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">assignment</span>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {dashboardData?.pending_assignments ?? assignments.length}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {assignments.length > 0 ? `Due: ${new Date(assignments[0].due_date).toLocaleDateString()}` : 'All caught up'}
                  </p>
                </div>

                <div className="bg-[#0d1b33]/90 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md group">
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
              </div>

              {/* 3. Core Workspace (7 cols courses/exams + 5 cols notices/resources) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Enrolled Courses & Examination Schedules (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Courses & Curriculum Panel */}
                  <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
                          Enrolled Courses & Curriculum
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {studentProfile?.department || 'Department'} • Semester {studentProfile?.semester || 7}
                        </p>
                      </div>
                      <span className="text-xs bg-[#71d8c8]/15 text-[#71d8c8] border border-[#71d8c8]/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        {courses.length} Registered
                      </span>
                    </div>

                    {courses.length === 0 ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">menu_book</span>
                        <h4 className="text-sm font-bold text-slate-300">No courses registered yet</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Official course curriculum for Semester {studentProfile?.semester || 7} will appear here once published.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {courses.map((course) => (
                          <div
                            key={course.id || course.code}
                            className="p-4 rounded-xl bg-[#081528] border border-slate-800/90 hover:border-[#71d8c8]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-start sm:items-center gap-3.5">
                              <div className="w-11 h-11 rounded-xl bg-[#71d8c8]/15 border border-[#71d8c8]/30 flex flex-col items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-[#71d8c8] leading-none">{course.code ? course.code.slice(0, 4) : 'CRS'}</span>
                                <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">{course.credits ? `${course.credits}cr` : 'B.Tech'}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-white">{course.title}</h4>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {course.code}
                                  </span>
                                  {course.data_origin === 'VERIFIED_OFFICIAL' && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      <span className="material-symbols-outlined text-[12px]">verified</span>
                                      Official
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
                                  <span>{course.instructor || 'Department Faculty'}</span>
                                  <span>•</span>
                                  <span>{course.department || studentProfile?.department}</span>
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab('academics');
                                onActionNotification?.(`Viewing course curriculum for: ${course.title}`);
                              }}
                              className="border border-slate-700 hover:border-[#71d8c8]/50 hover:bg-[#71d8c8]/10 text-slate-300 hover:text-[#71d8c8] font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto"
                            >
                              Syllabus
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Milestones (Exams & Assignments) */}
                  <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
                          Upcoming Examinations & Milestones
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Midterms, practical exams, and assignment due dates
                        </p>
                      </div>
                      <span className="text-xs bg-[#e6c277]/15 text-[#e6c277] border border-[#e6c277]/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        {examinations.length + assignments.length} Milestones
                      </span>
                    </div>

                    {examinations.length === 0 && assignments.length === 0 ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">event_available</span>
                        <h4 className="text-sm font-bold text-slate-300">No scheduled exam or assignment deadlines</h4>
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
                              className="border border-amber-500/40 hover:bg-amber-500/20 text-amber-200 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto"
                            >
                              {exam.document_url ? 'View Schedule PDF' : 'Details'}
                            </button>
                          </div>
                        ))}

                        {assignments.map((assign) => (
                          <div
                            key={`assign-${assign.id}`}
                            className="p-4 rounded-xl bg-[#081528] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold text-[#71d8c8] bg-[#71d8c8]/20 border border-[#71d8c8]/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Assignment
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  {assign.due_date ? `Due: ${new Date(assign.due_date).toLocaleDateString()}` : 'Open Deadline'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1.5">
                                {assign.title}
                              </h4>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {assign.description || 'Assignment details and submission guidelines.'}
                              </p>
                            </div>
                            <button
                              onClick={() => onActionNotification?.(`Opening submission portal for ${assign.title}`)}
                              className="bg-[#71d8c8] hover:bg-[#8ef4e4] text-[#04132a] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0 self-start sm:self-auto shadow-xs"
                            >
                              Submit
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Official Notices & Curated Resources (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Official Notices Board */}
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

                    {/* Filter Pills */}
                    <div className="flex gap-1.5 mb-4 overflow-x-auto hide-scrollbar pb-1">
                      {['All', 'Official', 'Department', 'Semester'].map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setNoticeFilter(f);
                            setNoticePage(1);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            noticeFilter === f
                              ? 'bg-[#71d8c8] text-[#04132a] shadow-xs'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
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
                                    n.action_url || n.download_url || n.document_url || n.source_url,
                                    onActionNotification,
                                    'Official notice link is currently unavailable.'
                                  )
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
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
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all"
                          >
                            Prev
                          </button>
                          <button
                            disabled={noticePage >= totalNoticePages}
                            onClick={() => setNoticePage(p => Math.min(totalNoticePages, p + 1))}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Curated BTU Academic Resources */}
                  <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#71d8c8]">bookmark</span>
                          <span>Curated Study Resources</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Syllabus matrices, previous papers & academic guides
                        </p>
                      </div>
                      <span className="text-xs bg-[#71d8c8]/15 text-[#71d8c8] border border-[#71d8c8]/30 px-2.5 py-0.5 rounded-full font-bold">
                        {savedResourceIds.length} Saved
                      </span>
                    </div>

                    {resources.length === 0 ? (
                      <div className="text-center py-6 px-3 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-3xl text-slate-600 mb-1">bookmark_border</span>
                        <p className="text-xs font-semibold text-slate-400">No study resources found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Academic materials for your cohort will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {resources.slice(0, 4).map((res) => {
                          const isSaved = savedResourceIds.includes(String(res.id));
                          return (
                            <div
                              key={res.id}
                              className="p-3 rounded-xl bg-[#081528] border border-slate-800 hover:border-[#71d8c8]/40 transition-all flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[#71d8c8]/20 text-[#71d8c8] flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-base">
                                    {res.destination_type === 'HOSTED_DOWNLOAD' ? 'file_download' :
                                     res.destination_type === 'OFFICIAL_DOCUMENT' ? 'description' : 'menu_book'}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white group-hover:text-[#71d8c8] transition-colors truncate">
                                    {res.title}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {res.category || 'Study Material'} • {res.file_size || 'PDF Document'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => toggleSaveResource(String(res.id), res.title)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isSaved ? 'text-[#71d8c8] bg-[#71d8c8]/20' : 'text-slate-400 hover:text-white'
                                  }`}
                                  title={isSaved ? 'Remove from saved' : 'Save resource'}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {isSaved ? 'bookmark_added' : 'bookmark_border'}
                                  </span>
                                </button>
                                <button
                                  onClick={() =>
                                    openOfficialLink(
                                      res.action_url || res.download_url || res.document_url || res.source_url,
                                      onActionNotification,
                                      'Official study material link is currently unavailable.'
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-[#71d8c8] rounded-lg hover:bg-white/5 transition-colors"
                                  title="Open Resource"
                                >
                                  <span className="material-symbols-outlined text-base">open_in_new</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
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
                        'Show BTU B.Tech CSE 7th Sem syllabus',
                        'What are the campus library operating hours?'
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAiPromptClick(prompt)}
                          className="w-full text-left p-2 rounded-xl bg-[#081528]/80 hover:bg-[#71d8c8]/15 border border-slate-700/60 hover:border-[#71d8c8]/40 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
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
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#71d8c8] to-[#8ef4e4] text-[#04132a] font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <span>Open Full AI Workspace</span>
                      <span className="material-symbols-outlined text-base">open_in_full</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Lower Highlights (Joined Clubs, Events, Community Discussions) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Joined Clubs */}
                <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#71d8c8]">groups</span>
                          <span>Joined Clubs</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">ECA Student Activity Center</p>
                      </div>
                      <span className="text-xs bg-[#71d8c8]/15 text-[#71d8c8] border border-[#71d8c8]/30 px-2 py-0.5 rounded-full font-bold">
                        {clubs.length} Active
                      </span>
                    </div>

                    {clubs.length === 0 ? (
                      <div className="text-center py-6 px-3 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-3xl text-slate-600 mb-1">groups</span>
                        <p className="text-xs font-semibold text-slate-400">No active club memberships</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Explore the SAC directory to join campus clubs.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {clubs.slice(0, 3).map((club, idx) => (
                          <div key={club.id || idx} className="p-3 rounded-xl bg-[#081528] border border-slate-800">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white">{club.name}</h4>
                              <span className="text-[10px] font-bold text-[#71d8c8] bg-[#71d8c8]/20 px-2 py-0.5 rounded">
                                {club.role || club.category || 'Member'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              {club.lead ? `${club.lead} • ` : ''}{club.location || club.venue || 'ECA Campus'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('clubs')}
                    className="mt-4 w-full bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View SAC Directory</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {/* Upcoming Events */}
                <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#e6c277]">event</span>
                          <span>Upcoming Events</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">Campus fests & registrations</p>
                      </div>
                      <span className="text-xs bg-[#e6c277]/15 text-[#e6c277] border border-[#e6c277]/30 px-2 py-0.5 rounded-full font-bold">
                        {events.length} Scheduled
                      </span>
                    </div>

                    {events.length === 0 ? (
                      <div className="text-center py-6 px-3 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-3xl text-slate-600 mb-1">event_busy</span>
                        <p className="text-xs font-semibold text-slate-400">No scheduled events</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Upcoming campus hackathons will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {events.slice(0, 3).map((ev, idx) => (
                          <div key={ev.id || idx} className="p-3 rounded-xl bg-[#081528] border border-slate-800">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white">{ev.title}</h4>
                              <span className="text-[10px] font-bold text-[#e6c277] bg-[#e6c277]/20 px-2 py-0.5 rounded">
                                {ev.event_type || 'Event'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              {ev.start_time ? new Date(ev.start_time).toLocaleDateString() : 'Upcoming'} • {ev.location || 'Campus'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('events')}
                    className="mt-4 w-full bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View Events Calendar</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                {/* Recent Community Activity */}
                <div className="bg-[#0d1b33]/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#bac3ff]">forum</span>
                          <span>Peer Community</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">Student discussion square</p>
                      </div>
                      <span className="text-xs bg-[#bac3ff]/15 text-[#bac3ff] border border-[#bac3ff]/30 px-2 py-0.5 rounded-full font-bold">
                        {communityPosts.length} Threads
                      </span>
                    </div>

                    {communityPosts.length === 0 ? (
                      <div className="text-center py-6 px-3 rounded-xl border border-dashed border-slate-800">
                        <span className="material-symbols-outlined text-3xl text-slate-600 mb-1">forum</span>
                        <p className="text-xs font-semibold text-slate-400">No discussions posted yet</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Start a new thread in the Community Square.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {communityPosts.slice(0, 3).map((post, idx) => (
                          <div key={post.id || idx} className="p-3 rounded-xl bg-[#081528] border border-slate-800">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                              <span className="font-bold text-white">{post.author_name || 'ECA Student'}</span>
                              <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}</span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mt-1 line-clamp-2">
                              {post.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('community')}
                    className="mt-4 w-full bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Open Community Square</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: ACADEMICS                                                 */}
          {/* ============================================================== */}
          {activeTab === 'academics' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Academic Curriculum & Courses</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    BTU B.Tech Semester {studentProfile?.semester || 7} • {studentProfile?.department || 'Engineering'}
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#71d8c8]/15 border border-[#71d8c8]/30 text-[#71d8c8] text-xs font-bold">
                  {courses.length} Registered Courses
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">menu_book</span>
                  <h4 className="text-base font-bold text-slate-300">No courses listed for Semester {studentProfile?.semester || 7}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Course curriculum and syllabus matrices for your department ({studentProfile?.department}) are currently synchronized.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {courses.map((c) => (
                    <div key={c.id || c.code} className="p-5 rounded-2xl bg-[#081528] border border-slate-800 hover:border-[#71d8c8]/40 transition-all shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-800 text-[#71d8c8] border border-slate-700">
                              {c.code}
                            </span>
                            {c.data_origin === 'VERIFIED_OFFICIAL' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <span className="material-symbols-outlined text-[12px]">verified</span>
                                Official
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-white mt-1.5">{c.title}</h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{c.instructor || 'Department Faculty'} • {c.department || studentProfile?.department}</p>
                        </div>
                        {c.credits && (
                          <span className="text-xs font-bold text-[#71d8c8] bg-[#71d8c8]/20 px-2.5 py-1 rounded-lg border border-[#71d8c8]/30">
                            {c.credits} Credits
                          </span>
                        )}
                      </div>

                      {c.description && (
                        <p className="text-xs text-slate-300 font-medium mb-4 line-clamp-3 leading-relaxed">
                          {c.description}
                        </p>
                      )}

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Semester {c.semester || studentProfile?.semester}</span>
                        <span className="text-[#71d8c8] font-bold">Verified Curriculum</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: COMMUNITY                                                 */}
          {/* ============================================================== */}
          {activeTab === 'community' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">ECA Community Discussions</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Peer question board, project collaborations, and student life
                  </p>
                </div>
                <button
                  onClick={() => setIsNewPostModalOpen(true)}
                  className="bg-[#71d8c8] hover:bg-[#8ef4e4] text-[#04132a] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>New Thread</span>
                </button>
              </div>

              {communityPosts.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">forum</span>
                  <h4 className="text-base font-bold text-slate-300">No community discussions posted yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
                    Be the first to ask a peer question, share academic materials, or start a study group.
                  </p>
                  <button
                    onClick={() => setIsNewPostModalOpen(true)}
                    className="bg-[#71d8c8] hover:bg-[#8ef4e4] text-[#04132a] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all"
                  >
                    Start a Thread
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityPosts.map((item, idx) => (
                    <div key={item.id || idx} className="p-5 rounded-2xl bg-[#081528] border border-slate-800 hover:border-[#71d8c8]/40 transition-all shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.author_name || 'ECA Student'}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.author_role || 'Student'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 font-medium mb-3 leading-relaxed">
                        {item.content}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {item.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-[#71d8c8] border border-slate-700">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CLUBS & SAC                                               */}
          {/* ============================================================== */}
          {activeTab === 'clubs' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Student Activity Center (SAC) & Clubs</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Technical societies, cultural clubs, and student chapters
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-[#71d8c8]/15 border border-[#71d8c8]/30 text-[#71d8c8] text-xs font-bold">
                  {clubs.length} Registered Clubs
                </div>
              </div>

              {clubs.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">groups</span>
                  <p className="text-sm font-semibold text-slate-400">No campus clubs available at this time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {clubs.map((club, idx) => (
                    <div key={club.id || idx} className="p-5 rounded-2xl bg-[#081528] border border-slate-800 hover:border-[#71d8c8]/40 transition-all flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-[#71d8c8] bg-[#71d8c8]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {club.category || 'Technical'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {club.role || 'Active'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{club.name}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Lead: {club.lead || 'Faculty Coordinator'}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Venue: {club.location || club.venue || 'ECA Barliya Campus'}
                        </p>
                        {club.description && (
                          <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                            {club.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onActionNotification?.(`Opened club portal: ${club.name}`)}
                        className="mt-4 w-full bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-colors"
                      >
                        Club Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: EVENTS                                                    */}
          {/* ============================================================== */}
          {activeTab === 'events' && (
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
          )}

          {/* ============================================================== */}
          {/* TAB: STUDY RESOURCES                                           */}
          {/* ============================================================== */}
          {activeTab === 'resources' && (
            <div className="bg-[#0d1b33]/90 rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl animate-in fade-in duration-200 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Verified Academic Resources</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Official BTU syllabus matrices, lecture notes & previous question banks
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#71d8c8]/15 border border-[#71d8c8]/30 text-[#71d8c8] text-xs font-bold">
                  {resources.length} Official Resources
                </div>
              </div>

              {/* Resource Category Filter */}
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {['All', 'Study Material', 'Curriculum', 'Calendar', 'Exam Prep'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setResourceCategoryFilter(cat)}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                      resourceCategoryFilter === cat
                        ? 'bg-[#71d8c8] text-[#04132a] shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {resources.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">folder_off</span>
                  <p className="text-sm font-semibold text-slate-400">No resources available for this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources
                    .filter(r => resourceCategoryFilter === 'All' || r.category === resourceCategoryFilter)
                    .map((r) => {
                      const isSaved = savedResourceIds.includes(String(r.id));
                      return (
                        <div
                          key={r.id}
                          className="p-4 rounded-xl bg-[#081528] border border-slate-800 hover:border-[#71d8c8]/40 transition-all flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#71d8c8]/20 text-[#71d8c8] flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-lg">
                                {r.destination_type === 'HOSTED_DOWNLOAD' ? 'file_download' :
                                 r.destination_type === 'OFFICIAL_DOCUMENT' ? 'description' : 'menu_book'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white group-hover:text-[#71d8c8] transition-colors truncate">
                                {r.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {r.category || 'Study Material'} • {r.file_size || 'PDF'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleSaveResource(String(r.id), r.title)}
                              className={`p-2 rounded-xl transition-colors ${
                                isSaved ? 'text-[#71d8c8] bg-[#71d8c8]/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                              title={isSaved ? 'Saved to library' : 'Save resource'}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isSaved ? 'bookmark_added' : 'bookmark_border'}
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                openOfficialLink(
                                  r.action_url || r.download_url || r.document_url || r.source_url,
                                  onActionNotification,
                                  'Official study material link is currently unavailable.'
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#71d8c8]/20 hover:bg-[#71d8c8] text-[#71d8c8] hover:text-[#04132a] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1"
                              title="Open verified academic resource"
                            >
                              <span>{r.destination_type === 'HOSTED_DOWNLOAD' ? 'Download' : 'Open'}</span>
                              <span className="material-symbols-outlined text-sm">
                                {r.destination_type === 'HOSTED_DOWNLOAD' ? 'download' : 'open_in_new'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

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

      {/* Community New Thread Modal */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1b33] rounded-2xl p-6 border border-slate-700 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#71d8c8]">forum</span>
                <span>Create Community Thread</span>
              </h3>
              <button
                onClick={() => setIsNewPostModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateCommunityPost} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Discussion Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your peer question, project idea, or campus discussion..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full bg-[#081528] rounded-xl p-3 text-xs text-white placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-[#71d8c8] focus:ring-1 focus:ring-[#71d8c8] transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE, Project, Midterm"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  className="w-full bg-[#081528] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-[#71d8c8] focus:ring-1 focus:ring-[#71d8c8] transition-all"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost || !newPostContent.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#71d8c8] hover:bg-[#8ef4e4] text-[#04132a] transition-all disabled:opacity-50"
                >
                  {isSubmittingPost ? 'Posting...' : 'Publish Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
