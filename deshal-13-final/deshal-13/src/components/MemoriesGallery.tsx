'use client';

import { useState } from 'react';
import { Calendar, Images, Play } from 'lucide-react';
import type { EventAlbum, AlbumPhoto } from '@/types/database';
import Lightbox from './Lightbox';

interface MemoriesGalleryProps {
  albums: EventAlbum[];
  photos: AlbumPhoto[];
}

export default function MemoriesGallery({ albums, photos }: MemoriesGalleryProps) {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visiblePhotos =
    selectedAlbumId === 'all'
      ? photos
      : photos.filter((p) => p.album_id === selectedAlbumId);

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  return (
    <div className="space-y-8">
      {/* Album Filter Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setSelectedAlbumId('all')}
          className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
            selectedAlbumId === 'all'
              ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-600/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Images className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {photos.length} photos
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900">All Memories</h3>
            <p className="mt-0.5 text-xs text-slate-500">Every event &amp; hangout album</p>
          </div>
        </button>

        {albums.map((album) => {
          const count = photos.filter((p) => p.album_id === album.id).length;
          const active = selectedAlbumId === album.id;
          return (
            <button
              key={album.id}
              type="button"
              onClick={() => setSelectedAlbumId(album.id)}
              className={`group flex flex-col justify-between overflow-hidden rounded-2xl border text-left transition-all ${
                active
                  ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {album.cover_url && (
                <div className="h-24 w-full overflow-hidden bg-slate-100">
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4 w-full">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 truncate">{album.title}</h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {count}
                  </span>
                </div>
                {album.event_date && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(album.event_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Album Description */}
      {selectedAlbum && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">{selectedAlbum.title}</h2>
          {selectedAlbum.description && (
            <p className="mt-1 text-sm text-slate-600">{selectedAlbum.description}</p>
          )}
        </div>
      )}

      {/* Photo Grid */}
      {visiblePhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Images className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">No photos in this album yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Admins can upload event photos from the Admin CMS Dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {visiblePhotos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {photo.media_type === 'video' ? (
                <div className="relative h-full w-full bg-slate-900">
                  <video
                    src={photo.image_url}
                    muted
                    playsInline
                    className="h-full w-full object-cover opacity-85"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-lg transition-transform group-hover:scale-110">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </span>
                  </span>
                </div>
              ) : (
                <img
                  src={photo.image_url}
                  alt={photo.caption || 'Deshal 13 memory'}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white">{photo.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Lightbox
        items={visiblePhotos}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
}
