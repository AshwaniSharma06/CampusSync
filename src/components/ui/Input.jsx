import React from 'react';

export default function Input({ icon, className = '', ...props }) {
  return (
    <div className="relative w-full">
      {icon && (
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {icon}
        </span>
      )}
      <input
        className={`w-full ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
