import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
