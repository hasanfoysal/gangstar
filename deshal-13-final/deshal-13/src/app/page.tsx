import Link from 'next/link';
import {
  Users,
  GraduationCap,
  Sparkles,
  Layers,
  Bell,
  ArrowRight,
  Images,
  BookOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import HeroSlider from '@/components/HeroSlider';
import type { HeroSlide, SiteSettings, AlbumPhoto } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const [slidesRes, settingsRes, profilesRes, photosRes] = await Promise.all([
    supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase.from('site_settings').select('*').eq('id', 1).single(),
    supabase.from('profiles').select('id, is_alumni').eq('status', 'approved'),
    supabase
      .from('album_photos')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(5),
  ]);

  const slides: HeroSlide[] = slidesRes.data ?? [];
  const settings: SiteSettings = settingsRes.data ?? {
    id: 1,
    room_name: 'Deshal 13 (দেশাল ১৩)',
    motto: 'Brotherhood Beyond Graduation — Room 13 Legacy',
    about_text:
      'Deshal 13 (দেশাল ১৩) is our university boys’ hostel room uniting Alumni (5th–11th Batch) and Running Students (12th–14th Batch).',
    notice_title: 'Room Notice Board',
    notice_body:
      'Welcome to the official Deshal 13 Portal. Register on the Join page to be listed in the Batch Directory.',
    updated_at: new Date().toISOString(),
  };

  const approvedProfiles = profilesRes.data ?? [];
  const totalMembers = approvedProfiles.length;
  const alumniCount = approvedProfiles.filter((p) => p.is_alumni).length;
  const runningCount = approvedProfiles.filter((p) => !p.is_alumni).length;
  const recentPhotos: AlbumPhoto[] = photosRes.data ?? [];

  const stats = [
    {
      label: 'Total Approved Members',
      value: totalMembers,
      icon: Users,
      accent: 'bg-brand-50 text-brand-700',
    },
    {
      label: 'Alumni (5th–11th+)',
      value: alumniCount,
      icon: GraduationCap,
      accent: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Running Students (12th–14th)',
      value: runningCount,
      icon: Sparkles,
      accent: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Active Batches',
      value: '5th – 14th',
      icon: Layers,
      accent: 'bg-indigo-50 text-indigo-700',
    },
  ];

  return (
    <div className="space-y-14 pb-16">
      {/* 1. Batch-Wise Cover Photo Hero Slider */}
      <HeroSlider slides={slides} />

      {/* 2. Live Room Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-30">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. About Deshal 13 & Notice Board */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* About */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 text-brand-700">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">About Our Room</span>
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              {settings.room_name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-amber-600">{settings.motto}</p>
            <p className="mt-4 whitespace-pre-line text-sm sm:text-base leading-relaxed text-slate-600">
              {settings.about_text}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
              >
                Browse Batch Directory
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/memories"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                View Room Memories
              </Link>
            </div>
          </div>

          {/* Notice Board */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <Bell className="h-3.5 w-3.5" />
                {settings.notice_title}
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {settings.notice_body}
              </p>
            </div>
            <div className="mt-6 border-t border-amber-200/70 pt-3 text-xs text-amber-800/80 font-medium">
              Updated by Room Admin
            </div>
          </div>
        </div>
      </section>

      {/* 4. Recent Memories Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-700">
              <Images className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Photo Archive</span>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              Room Memories
            </h2>
          </div>
          <Link
            href="/memories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Open Full Gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {recentPhotos.map((photo) => (
              <Link
                key={photo.id}
                href="/memories"
                className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || 'Deshal 13 memory'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs font-medium text-white">{photo.caption}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Images className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Event albums are ready for photos!
            </p>
            <Link
              href="/memories"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            >
              Explore Event Albums
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
