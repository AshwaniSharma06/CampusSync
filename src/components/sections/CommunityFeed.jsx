import React, { useState } from 'react';
import CommunitySphereCanvas from '../three/CommunitySphereCanvas';

const INITIAL_POSTS = [
  {
    id: 1,
    author: 'Coding Club',
    initials: 'CC',
    avatarBg: 'bg-primary/20 text-primary',
    tag: 'Official',
    time: '2h ago',
    content:
      "Excited to announce our upcoming Advanced React Workshop! 🚀 Join us this Saturday at the Main Lab. We'll be building a full-stack application from scratch. Don't forget your laptops!",
    likes: 124,
    comments: 32,
    icon: 'code',
    isLiked: false,
  },
  {
    id: 2,
    author: 'Jane Doe',
    initials: 'JD',
    avatarBg: 'bg-tertiary/20 text-tertiary',
    tag: 'CS Year 3',
    time: '5h ago',
    content:
      'Anyone want to form a study group for the upcoming Machine Learning midterms? Looking for 2-3 people to review past papers in the library this weekend. 📚🧠',
    likes: 15,
    comments: 8,
    icon: null,
    isLiked: false,
  },
];

export default function CommunityFeed({ onActionNotification }) {
  const [activeFilter, setActiveFilter] = useState('All Campus');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState('');

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newEntry = {
      id: Date.now(),
      author: 'Alex Morgan',
      initials: 'AM',
      avatarBg: 'bg-secondary/20 text-secondary',
      tag: 'CS Year 2',
      time: 'Just now',
      content: newPostText,
      likes: 0,
      comments: 0,
      icon: null,
      isLiked: false,
    };

    setPosts([newEntry, ...posts]);
    setNewPostText('');
    onActionNotification('Post published to Campus Feed!');
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
    <section className="py-section-gap bg-surface relative overflow-hidden" id="community">
      <div className="absolute top-0 right-0 w-full h-[600px] z-0 opacity-40 pointer-events-none">
        <CommunitySphereCanvas />
      </div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight">
            Campus conversations, <span className="font-serif-italic text-gradient">all in one place</span>
          </h2>
          <p className="font-sans text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
            Connect with your peers, join discussions, and stay updated with the pulse of the campus.
          </p>
        </div>

        {/* Mobile Filters */}
        <div className="lg:hidden flex gap-3 overflow-x-auto hide-scrollbar mb-6 pb-2">
          {['All Campus', 'Comp Sci', 'Clubs', 'Official'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-sans font-bold uppercase tracking-[0.08em] flex items-center gap-2 transition-colors ${
                activeFilter.includes(filter)
                  ? 'bg-surface-bright/80 text-white border border-primary/40'
                  : 'bg-surface/50 text-on-surface-variant border border-outline/10'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {filter === 'All Campus'
                  ? 'public'
                  : filter.includes('Sci')
                  ? 'science'
                  : filter === 'Clubs'
                  ? 'groups'
                  : 'campaign'}
              </span>
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h3 className="font-sans text-xs font-bold text-primary uppercase tracking-[0.12em] mb-6">
                Explore Feeds
              </h3>
              <ul className="space-y-3">
                {[
                  { name: 'All Campus', icon: 'public' },
                  { name: 'Computer Science', icon: 'science' },
                  { name: 'My Clubs', icon: 'groups' },
                  { name: 'Official', icon: 'campaign' },
                ].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => setActiveFilter(item.name)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left font-sans text-sm transition-all ${
                        activeFilter === item.name
                          ? 'text-white bg-surface-bright/50 border border-primary/30 font-bold'
                          : 'text-on-surface-variant hover:text-white hover:bg-surface-bright/20 font-medium'
                      }`}
                    >
                      <span className="material-symbols-outlined">{item.icon}</span>
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Feed */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            {/* Post Creator */}
            <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-surface-bright/20">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold font-sans">
                  AM
                </div>
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Share something with the campus..."
                    className="w-full bg-surface/50 rounded-xl px-4 py-3 text-white text-sm font-sans border border-outline/10 placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors resize-none mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onActionNotification('Image upload feature ready')}
                        className="p-2 text-primary hover:bg-surface-bright rounded-lg transition-colors"
                        title="Add Image"
                      >
                        <span className="material-symbols-outlined text-lg">image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionNotification('Document attachment feature ready')}
                        className="p-2 text-secondary hover:bg-surface-bright rounded-lg transition-colors"
                        title="Add Document"
                      >
                        <span className="material-symbols-outlined text-lg">description</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onActionNotification('Poll generator ready')}
                        className="p-2 text-tertiary hover:bg-surface-bright rounded-lg transition-colors"
                        title="Create Poll"
                      >
                        <span className="material-symbols-outlined text-lg">poll</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-on-surface-variant hidden sm:inline-flex items-center gap-1 font-sans">
                        <span className="material-symbols-outlined text-[14px]">verified</span> Verified Student
                      </span>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostText.trim()}
                        className={`px-5 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-[0.1em] transition-all ${
                          newPostText.trim()
                            ? 'bg-primary text-on-primary hover:bg-primary-fixed shadow-md cursor-pointer'
                            : 'bg-primary/20 text-primary opacity-50 cursor-not-allowed'
                        }`}
                      >
                        Post
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
                className="glass-card rounded-2xl p-6 transition-all hover:border-primary/30 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full ${post.avatarBg} flex items-center justify-center font-bold font-sans`}
                    >
                      {post.initials}
                    </div>
                    <div>
                      <h4 className="font-sans text-white font-semibold">{post.author}</h4>
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-0.5 font-sans">
                        <span className="bg-surface-bright px-2 py-0.5 rounded text-xs font-medium">{post.tag}</span>
                        <span>•</span>
                        <span>{post.time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onActionNotification('Options menu opened')}
                    className="text-on-surface-variant hover:text-white"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
                <p className="font-sans text-on-surface mb-4 leading-relaxed">{post.content}</p>
                {post.icon && (
                  <div className="rounded-xl overflow-hidden mb-4 border border-outline/10 h-48 bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary/50">{post.icon}</span>
                  </div>
                )}
                <div className="flex items-center gap-6 border-t border-outline/10 pt-4 font-sans text-sm">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      post.isLiked ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {post.isLiked ? 'favorite' : 'favorite_border'}
                    </span>{' '}
                    {post.likes}
                  </button>
                  <button
                    onClick={() => onActionNotification(`Opening comments for ${post.author}'s post`)}
                    className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chat_bubble</span> {post.comments}
                  </button>
                  <button
                    onClick={() => onActionNotification('Post link copied to clipboard')}
                    className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors ml-auto"
                  >
                    <span className="material-symbols-outlined text-sm">share</span> Share
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Trending Topics Column */}
          <div className="hidden lg:flex flex-col gap-6 col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h3 className="font-sans text-xs font-bold text-primary uppercase tracking-[0.12em] mb-6">
                Trending Topics
              </h3>
              <div className="space-y-4 font-sans">
                <div
                  onClick={() => onActionNotification('Viewing #TechSymposium26 trend')}
                  className="group cursor-pointer p-2 hover:bg-surface-bright/30 rounded-lg transition-colors"
                >
                  <p className="text-xs text-on-surface-variant font-medium">1. Event</p>
                  <p className="font-semibold text-white group-hover:text-primary transition-colors mt-0.5">
                    #TechSymposium26
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">450 posts</p>
                </div>
                <div
                  onClick={() => onActionNotification('Viewing Midterms Prep trend')}
                  className="group cursor-pointer p-2 hover:bg-surface-bright/30 rounded-lg transition-colors"
                >
                  <p className="text-xs text-on-surface-variant font-medium">2. Academics</p>
                  <p className="font-semibold text-white group-hover:text-primary transition-colors mt-0.5">
                    Midterms Prep
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">320 posts</p>
                </div>
                <div
                  onClick={() => onActionNotification('Viewing New Cafe Menu trend')}
                  className="group cursor-pointer p-2 hover:bg-surface-bright/30 rounded-lg transition-colors"
                >
                  <p className="text-xs text-on-surface-variant font-medium">3. Student Activities</p>
                  <p className="font-semibold text-white group-hover:text-primary transition-colors mt-0.5">
                    New Cafe Menu
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">185 posts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
