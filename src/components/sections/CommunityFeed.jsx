import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import CommunityPostComposer from '../community/CommunityPostComposer';
import CommunityPostCard from '../community/CommunityPostCard';

const TOPIC_FILTERS = [
  'All',
  'DSA',
  'Placements',
  'BTUExams',
  'WebDev',
  'AI_ML',
  'ProjectCollab',
  'LostAndFound',
];

export default function CommunityFeed({ currentUser, onActionNotification, onRequireAuth }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getCommunityPosts({
        tag: activeFilter !== 'All' ? activeFilter : null,
        search: searchQuery.trim() || null,
      });
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch community posts:', err);
      setError('Unable to load live community discussions. Displaying cached records.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handleTagClick = (tag) => {
    setActiveFilter(tag);
    // Smooth scroll to top of feed
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <section id="community" className="py-16 md:py-24 bg-[#04132a] text-slate-100 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#71d8c8]/10 via-[#bac3ff]/5 to-transparent blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#71d8c8]/10 border border-[#71d8c8]/30 text-[#71d8c8] text-xs font-bold tracking-wider uppercase mb-4 shadow-sm">
            <span className="material-symbols-outlined text-sm">forum</span>
            <span>Campus Community Square</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Connect, Collaborate & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#71d8c8] via-[#bac3ff] to-[#e6c277]">Grow Together</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The verified peer discussion hub for Govt. Engineering College Ajmer students. Share research notes, collaborate on hackathons, ask questions, and cast your votes.
          </p>
        </div>

        {/* Main 2-Column Community Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Post Composer & Main Feed (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Rich Post Composer */}
            <CommunityPostComposer
              currentUser={currentUser}
              onPostCreated={handlePostCreated}
              onRequireAuth={onRequireAuth}
              onActionNotification={onActionNotification}
            />

            {/* Filter Pills and Search Bar */}
            <div className="bg-[#081528] rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts, topics, or study questions..."
                    className="w-full bg-[#04132a] border border-slate-800 focus:border-[#71d8c8] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Total posts count */}
                <div className="text-[11px] text-slate-400 font-semibold px-2">
                  {posts.length} {posts.length === 1 ? 'Discussion' : 'Discussions'}
                </div>
              </div>

              {/* Tag filters */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">filter_alt</span>
                  <span>Filter:</span>
                </span>
                {TOPIC_FILTERS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveFilter(tag)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeFilter === tag
                        ? 'bg-[#71d8c8] text-[#04132a] shadow-xs'
                        : 'bg-[#04132a] text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tag === 'All' ? 'All Posts' : `#${tag}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span>{error}</span>
                <button onClick={fetchPosts} className="underline font-bold hover:text-white">
                  Retry
                </button>
              </div>
            )}

            {/* Post Feed List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-6 rounded-2xl bg-[#081528] border border-slate-800 animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-slate-800 rounded-md w-32" />
                        <div className="h-2.5 bg-slate-800/60 rounded-md w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-800 rounded-md w-full" />
                      <div className="h-3 bg-slate-800 rounded-md w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-[#081528] border border-dashed border-slate-800 space-y-3">
                <span className="material-symbols-outlined text-5xl text-slate-600">forum</span>
                <h4 className="text-base font-bold text-slate-300">No discussions match your filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Be the first in your department to share updates, ask questions, or publish a poll!
                </p>
                {activeFilter !== 'All' && (
                  <button
                    onClick={() => setActiveFilter('All')}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-[#71d8c8]"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onTagClick={handleTagClick}
                    onPostDeleted={handlePostDeleted}
                    onRequireAuth={onRequireAuth}
                    onActionNotification={onActionNotification}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Trending Discussions, Guidelines & Stats (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Trending Tags Widget */}
            <div className="bg-[#081528] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold text-sm">
                <span className="material-symbols-outlined text-base text-[#e6c277]">trending_up</span>
                <span>Trending Cohorts & Topics</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { tag: 'DSA', desc: 'BTU Midterm Data Structures & Algorithms', posts: 14 },
                  { tag: 'Placements', desc: 'Campus Placement Prep & Company Drives', posts: 28 },
                  { tag: 'AI_ML', desc: 'Deep Learning & NLP Project Collabs', posts: 19 },
                  { tag: 'BTUExams', desc: 'Semester 7 & 5 Final Exam Schedules', posts: 11 },
                  { tag: 'LostAndFound', desc: 'Found Campus Items & SAC Inquiries', posts: 7 },
                ].map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => handleTagClick(item.tag)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#04132a] hover:bg-[#04132a]/80 border border-slate-800/80 hover:border-[#71d8c8]/40 transition-all text-left cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#71d8c8] group-hover:underline">
                        #{item.tag}
                      </span>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                      {item.posts}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Community Standards & Guidelines */}
            <div className="bg-[#081528] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-white font-bold text-sm">
                <span className="material-symbols-outlined text-base text-[#71d8c8]">verified_user</span>
                <span>Community Guidelines</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-[#71d8c8] shrink-0 mt-0.5">check_circle</span>
                  <span><strong>Respect Peer Discussions:</strong> Constructive academic inquiries and project feedback only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-[#71d8c8] shrink-0 mt-0.5">check_circle</span>
                  <span><strong>Verified Authenticity:</strong> All comments and polls are securely recorded with student verification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-[#71d8c8] shrink-0 mt-0.5">check_circle</span>
                  <span><strong>Accredited Attachments:</strong> Attach only valid study materials, syllabus docs, or campus event photos.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
