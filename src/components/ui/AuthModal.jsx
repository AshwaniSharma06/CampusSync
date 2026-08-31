import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    email: 'alex.morgan@campussync.edu',
    password: 'password123',
    fullName: 'Alex Morgan',
    studentId: 'CS2026-8941',
    department: 'Computer Science',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuthSuccess({
      name: formData.fullName || 'Alex Morgan',
      email: formData.email,
      studentId: formData.studentId,
      department: formData.department,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface-container-high border border-primary/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden font-sans">
        {/* Top Decorative Rim Light */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-on-surface-variant hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <a href="#" className="font-serif text-3xl text-primary font-brand inline-block mb-1">
            CampusSync
          </a>
          <h3 className="font-serif text-2xl text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Student Account'}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {mode === 'login'
              ? 'Access your unified student dashboard & courses'
              : 'Join over 5,000+ students on CampusSync'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-container p-1 rounded-xl mb-6 border border-outline/10">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                placeholder="Alex Morgan"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
              Student Institutional Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
              placeholder="student@campussync.edu"
            />
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                  placeholder="CS2026-8941"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
                  placeholder="Computer Science"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm text-white border border-outline/20 focus:outline-none focus:border-primary/60 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-xs uppercase tracking-[0.12em] hover:bg-primary-fixed transition-colors glow-hover shadow-lg mt-2"
          >
            {mode === 'login' ? 'Sign In to Portal' : 'Create Account'}
          </button>
        </form>

        {/* Demo Hint */}
        <div className="mt-5 p-3 rounded-xl bg-surface/50 border border-outline/10 text-center text-xs text-on-surface-variant">
          💡 <span className="text-white font-medium">Demo Mode Active:</span> Click "{mode === 'login' ? 'Sign In to Portal' : 'Create Account'}" to explore the student dashboard!
        </div>
      </div>
    </div>
  );
}
