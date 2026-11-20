import { Images } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import MemoriesGallery from '@/components/MemoriesGallery';
import type { EventAlbum, AlbumPhoto } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function MemoriesPage() {
  const supabase = await createClient();

  const [albumsRes, photosRes] = await Promise.all([
    supabase
      .from('event_albums')
      .select('*')
      .order('event_date', { ascending: false, nullsFirst: false }),
    supabase
      .from('album_photos')
      .select('*')
      .order('uploaded_at', { ascending: false }),
  ]);

  const albums: EventAlbum[] = albumsRes.data ?? [];
  const photos: AlbumPhoto[] = photosRes.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Images className="h-3.5 w-3.5" />
          Photo Albums
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Room Memories &amp; Programs
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Relive our Iftar Mahfils, Annual Tours, Farewells, and late-night Room 13 hangouts.
        </p>
      </div>

      <MemoriesGallery albums={albums} photos={photos} />
    </div>
  );
}
