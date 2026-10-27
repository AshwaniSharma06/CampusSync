import React, { useState } from 'react';
import CommunitySphereCanvas from '../three/CommunitySphereCanvas';

const INITIAL_POSTS = [
  {
    id: 1,
    author: 'Technotsav & PCC Club',
    initials: 'PCC',
    avatarBg: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
    tag: 'Official Club',
    time: '2h ago',
    content:
      "Excited to announce our upcoming Advanced React & Machine Learning Workshop! 🚀 Join us this Saturday at Barliya Block Lab 204. We'll be building a full-stack AI application from scratch. Don't forget your laptops!",
    likes: 124,
    comments: 32,
    icon: 'code',
    isLiked: false,
  },
  {
    id: 2,
    author: 'Priya Sharma',
    initials: 'PS',
    avatarBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    tag: 'CS Sem VII',
    time: '5h ago',
    content:
      'Anyone want to form a study group for the upcoming BTU Machine Learning midterms? Looking for 2-3 people to review past papers in the central library this weekend. 📚🧠',
    likes: 18,
    comments: 8,
    icon: null,
    isLiked: false,
  },
  {
    id: 3,
    author: 'Rohan Verma',
    initials: 'RV',
    avatarBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
    tag: 'ECE Sem V',
    time: '8h ago',
    content:
      'Lost a black Dell laptop charger near Barliya CSE Block Room 402 around 2 PM today. If anyone found it, please hand it over to the SAC office or drop a message here!',
    likes: 24,
    comments: 12,
    icon: null,
    isLiked: false,
  },
];

export default function CommunityFeed({ currentUser, onActionNotification }) {
  const [activeFilter, setActiveFilter] = useState('All Campus');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState('');

  const postAuthorName = currentUser && currentUser.name ? currentUser.name : 'Ashwani Sharma';
  const postAuthorInitials = currentUser && currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AS';
  const postAuthorTag = currentUser
    ? currentUser.department
      ? `${currentUser.department} Student`
      : 'CSE VII Sem'
    : 'CSE VII Sem';

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newEntry = {
      id: Date.now(),
      author: postAuthorName,
      initials: postAuthorInitials,
      avatarBg: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
      tag: postAuthorTag,
      time: 'Just now',
      content: newPostText,
      likes: 0,
      comments: 0,
      icon: null,
      isLiked: false,
    };

    setPosts([newEntry, ...posts]);
    setNewPostText('');
    onActionNotification?.(`Post published as ${postAuthorName}!`);
  };

  const handleLike = (id) => {
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            isLiked: !p.isLiked,
          };
        }
        return p;
      })
    );
  };

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden" id="community">
      <div className="absolute top-0 right-0 w-full h-[500px] z-0 opacity-25 pointer-events-none">
        <CommunitySphereCanvas />
      </div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        {/* Compact, clean sans-serif heading that does not push feed down */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full text-xs font-bold text-teal-400 mb-2 uppercase tracking-wider">
              Student Square
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Campus community
            </h2>
            <p className="text-sm md:text-base text-on-surface-variant mt-1 max-w-2xl">
              Live discussions, peer study groups, and updates from students and ECA societies.
            </p>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {['All Campus', 'Comp Sci', 'Clubs', 'Official'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeFilter.includes(filter)
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Layout: Main Feed takes most of the width (3 of 4 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Feed Container (75% width on desktop) */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
            {/* Post Composer right at the top */}
            <div className="bg-[#0d213b]/90 rounded-2xl p-5 border border-slate-700/80 shadow-md">
              <div className="flex gap-3.5 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {postAuthorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    rows={2}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`Share an update, ask a question, or organize a study group, ${postAuthorName.split(' ')[0]}...`}
                    className="w-full bg-slate-900/90 rounded-xl px-4 py-3 text-white text-sm border border-slate-700/80 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60 transition-colors resize-none mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 text-slate-400">
                      <button
                        type="button"
                        onClick={() => onActionNotification?.('Image upload ready')}
                        className="p-1.5 hover:text-teal-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                        title="Add Image"
                      >
                        <span className="material-symbols-outlined text-lg">image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionNotification?.('Document attachment ready')}
                        className="p-1.5 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                        title="Add Document"
                      >
                        <span className="material-symbols-outlined text-lg">description</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionNotification?.('Poll generator ready')}
                        className="p-1.5 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                        title="Create Poll"
                      >
                        <span className="material-symbols-outlined text-lg">poll</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-sm text-teal-400">account_circle</span>
                        Posting as {postAuthorName}
                      </span>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostText.trim()}
                        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                          newPostText.trim()
                            ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <span>Publish</span>
                        <span className="material-symbols-outlined text-xs">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts List */}
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#0d213b]/90 rounded-2xl p-5 md:p-6 border border-slate-700/70 hover:border-teal-400/40 transition-all shadow-md group"
              >
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl ${post.avatarBg} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                    >
                      {post.initials}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight group-hover:text-teal-300 transition-colors">
                        {post.author}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/50">
                          {post.tag}
                        </span>
                        <span>•</span>
                        <span>{post.time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onActionNotification?.('Options menu opened')}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </div>

                <p className="text-sm text-slate-200 mb-4 leading-relaxed font-sans">{post.content}</p>

                {post.icon && (
                  <div className="rounded-xl overflow-hidden mb-4 border border-slate-700/60 h-32 bg-slate-900/60 flex items-center justify-center gap-3 text-teal-400">
                    <span className="material-symbols-outlined text-3xl">terminal</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      npm run start:ai-workshop --host=0.0.0.0
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-5 border-t border-slate-700/60 pt-3 text-xs text-slate-400">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      post.isLiked ? 'text-teal-400 font-bold' : 'hover:text-teal-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {post.isLiked ? 'favorite' : 'favorite_border'}
                    </span>
                    <span>{post.likes}</span>
                  </button>
                  <button
                    onClick={() => onActionNotification?.(`Opening comments for ${post.author}'s post`)}
                    className="flex items-center gap-1.5 hover:text-teal-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chat_bubble</span>
                    <span>{post.comments} comments</span>
                  </button>
                  <button
                    onClick={() => onActionNotification?.('Post link copied to clipboard')}
                    className="flex items-center gap-1.5 hover:text-teal-300 transition-colors ml-auto"
                  >
                    <span className="material-symbols-outlined text-base">share</span>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Slim Sidebar: Channels & Trending (25% width on desktop) */}
          <div className="col-span-1 flex flex-col gap-5 sticky top-24">
            {/* Trending Topics Card */}
            <div className="bg-[#0d213b]/90 rounded-2xl p-5 border border-slate-700/70 shadow-md">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">trending_up</span> Trending Topics
              </h3>
              <div className="space-y-3">
                {[
                  { tag: '#Technotsav26', count: '450 posts', category: 'Fest' },
                  { tag: '#BTUMidterms', count: '320 posts', category: 'Academics' },
                  { tag: '#SIH2026', count: '185 posts', category: 'Hackathon' },
                  { tag: '#RobowarECA', count: '112 posts', category: 'Robotics' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onActionNotification?.(`Viewing trend: ${item.tag}`)}
                    className="group cursor-pointer p-2 rounded-xl hover:bg-slate-800/70 transition-all border border-transparent hover:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{item.category}</span>
                      <span className="text-teal-400/80 font-medium">{item.count}</span>
                    </div>
                    <p className="font-bold text-white text-xs group-hover:text-teal-300 transition-colors mt-0.5">
                      {item.tag}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick SAC Notice Card */}
            <div className="bg-[#0d213b]/90 rounded-2xl p-5 border border-slate-700/70 shadow-md">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">campaign</span> SAC Guidelines
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Posts representing student clubs must adhere to the ECA Student Activity Center code of conduct.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
