'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxItem {
  id: string;
  image_url: string;
  media_type?: 'image' | 'video';
  caption?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  items,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  useEffect(() => {
    if (currentIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % items.length);
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + items.length) % items.length);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, items.length, onClose, onNavigate]);

  if (currentIndex === null || !items[currentIndex]) return null;

  const current = items[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((currentIndex - 1 + items.length) % items.length);
            }}
            aria-label="Previous photo"
            className="absolute left-3 sm:left-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((currentIndex + 1) % items.length);
            }}
            aria-label="Next photo"
            className="absolute right-3 sm:right-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative max-h-[88vh] max-w-5xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {current.media_type === 'video' ? (
          <video
            src={current.image_url}
            controls
            autoPlay
            className="max-h-[78vh] w-full max-w-4xl rounded-xl bg-black shadow-2xl"
          />
        ) : (
          <img
            src={current.image_url}
            alt={current.caption || 'Deshal 13 memory'}
            className="max-h-[78vh] w-auto rounded-xl object-contain shadow-2xl"
          />
        )}
        <div className="mt-3 flex items-center justify-between gap-4 text-center text-sm text-slate-200">
          <span>{current.caption || 'Deshal 13 Memory'}</span>
          <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-slate-300">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
}
