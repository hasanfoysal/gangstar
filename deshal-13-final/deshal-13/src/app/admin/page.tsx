import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AdminTabs from '@/components/AdminTabs';
import AdminPasswordGate from '@/components/AdminPasswordGate';
import type {
  Profile,
  HeroSlide,
  EventAlbum,
  AlbumPhoto,
  SiteSettings,
  BatchCover,
} from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (myProfile?.role !== 'admin') {
    return <AdminPasswordGate />;
  }

  const [profilesRes, slidesRes, albumsRes, photosRes, settingsRes, batchCoversRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('hero_slides').select('*').order('display_order', { ascending: true }),
    supabase
      .from('event_albums')
      .select('*')
      .order('event_date', { ascending: false, nullsFirst: false }),
    supabase.from('album_photos').select('*').order('uploaded_at', { ascending: false }),
    supabase.from('site_settings').select('*').eq('id', 1).single(),
    supabase.from('batch_covers').select('*'),
  ]);

  const profiles: Profile[] = profilesRes.data ?? [];
  const slides: HeroSlide[] = slidesRes.data ?? [];
  const albums: EventAlbum[] = albumsRes.data ?? [];
  const batchCovers: BatchCover[] = batchCoversRes.data ?? [];
  const photos: AlbumPhoto[] = photosRes.data ?? [];
  const settings: SiteSettings = settingsRes.data ?? {
    id: 1,
    room_name: 'Deshal 13 (দেশাল ১৩)',
    motto: 'Brotherhood Beyond Graduation — Room 13 Legacy',
    about_text: '',
    notice_title: 'Room Notice Board',
    notice_body: '',
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Super Admin CMS
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Deshal 13 Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage members, promote batches to Alumni, manage hero slides, event albums, and
          live site notices.
        </p>
      </div>

      <AdminTabs
        initialProfiles={profiles}
        initialSlides={slides}
        initialAlbums={albums}
        initialPhotos={photos}
        initialSettings={settings}
        initialBatchCovers={batchCovers}
      />
    </div>
  );
}
