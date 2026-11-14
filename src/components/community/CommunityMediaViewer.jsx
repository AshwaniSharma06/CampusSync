import React, { useEffect, useState } from 'react';

export default function CommunityMediaViewer({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose]);

  if (!images || images.length === 0) return null;
  const currentImg = images[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full mx-4 flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between py-3 px-4 bg-slate-900/80 rounded-t-xl border-b border-slate-800 text-slate-300">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="material-symbols-outlined text-sm text-[#71d8c8]">image</span>
            <span className="truncate max-w-xs">{currentImg?.file_name || 'Campus Media'}</span>
            {images.length > 1 && (
              <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full text-[11px]">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={currentImg?.file_url}
              download={currentImg?.file_name || 'campus-media'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Download original"
            >
              <span className="material-symbols-outlined text-base">download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div className="relative w-full flex items-center justify-center bg-[#030b18] rounded-b-xl overflow-hidden p-2 min-h-[300px] max-h-[80vh]">
          <img
            src={currentImg?.file_url}
            alt={currentImg?.file_name || 'Post attachment'}
            className="max-h-[75vh] max-w-full object-contain rounded-md shadow-2xl select-none"
          />

          {/* Left Navigation Arrow */}
          {images.length > 1 && currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-[#71d8c8] hover:text-[#04132a] text-white transition-all shadow-lg"
              title="Previous image (Left arrow)"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
          )}

          {/* Right Navigation Arrow */}
          {images.length > 1 && currentIndex < images.length - 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-[#71d8c8] hover:text-[#04132a] text-white transition-all shadow-lg"
              title="Next image (Right arrow)"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

