import React, { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-container-high border border-primary/40 text-white px-5 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-bounce">
      <span className="material-symbols-outlined text-primary">info</span>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-on-surface-variant hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
