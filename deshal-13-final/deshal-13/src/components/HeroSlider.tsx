'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Users, UserPlus } from 'lucide-react';
import type { HeroSlide } from '@/types/database';

interface HeroSliderProps {
  slides: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const activeSlides = slides.filter((s) => s.is_active);
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    if (activeSlides.length === 0) return;
    setCurrent((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const prev = () => {
    if (activeSlides.length === 0) return;
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length, next]);

  if (activeSlides.length === 0) {
    return (
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
            Deshal 13 • দেশাল ১৩
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Brotherhood Beyond Graduation
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-200 sm:text-lg">
            Connecting Alumni (5th–11th Batch) and Running Residents (12th–14th Batch) of Room 13.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-brand-900 text-white">
      <div className="relative h-[420px] sm:h-[500px] lg:h-[540px] w-full">
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image_url}
              alt={slide.title}
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/20" />

            <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                {slide.batch_label && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/40 backdrop-blur-sm">
                    {slide.batch_label}
                  </span>
                )}
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="mt-3 text-base text-slate-200 sm:text-lg leading-relaxed">
                    {slide.subtitle}
                  </p>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/portal"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg hover:bg-amber-400 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Explore Directory
                  </Link>
                  <Link
                    href="/join"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm hover:bg-white/25 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Join Deshal 13
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-6 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 sm:right-6 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
              {activeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === current ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
