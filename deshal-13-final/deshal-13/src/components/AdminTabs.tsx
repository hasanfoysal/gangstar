'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  Users,
  SlidersHorizontal,
  Images,
  FileText,
  Check,
  Trash2,
  Edit3,
  ArrowUpRight,
  Plus,
  Upload,
  Save,
  Loader2,
  X,
  Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  ALL_BATCHES,
  BLOOD_GROUPS,
  type Profile,
  type HeroSlide,
  type EventAlbum,
  type AlbumPhoto,
  type SiteSettings,
  type BatchCover,
} from '@/types/database';

interface AdminTabsProps {
  initialProfiles: Profile[];
  initialSlides: HeroSlide[];
  initialAlbums: EventAlbum[];
  initialPhotos: AlbumPhoto[];
  initialSettings: SiteSettings;
  initialBatchCovers?: BatchCover[];
}

type TabKey = 'pending' | 'members' | 'slides' | 'memories' | 'settings';

export default function AdminTabs({
  initialProfiles,
  initialSlides,
  initialAlbums,
  initialPhotos,
  initialSettings,
  initialBatchCovers = [],
}: AdminTabsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [albums, setAlbums] = useState<EventAlbum[]>(initialAlbums);
  const [photos, setPhotos] = useState<AlbumPhoto[]>(initialPhotos);
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [batchCovers, setBatchCovers] = useState<BatchCover[]>(initialBatchCovers);
  const [bcBatch, setBcBatch] = useState<string>('13th');
  const [bcTitle, setBcTitle] = useState('');
  const [bcSubtitle, setBcSubtitle] = useState('');
  const [bcFile, setBcFile] = useState<File | null>(null);

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Members Manager state
  const [memberSearch, setMemberSearch] = useState('');
  const [promoteBatch, setPromoteBatch] = useState<string>('12th');
  const [editingMember, setEditingMember] = useState<Profile | null>(null);

  // Slides Manager state
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideBatchLabel, setSlideBatchLabel] = useState('');
  const [slideOrder, setSlideOrder] = useState(slides.length + 1);
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Memories Manager state
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumDate, setAlbumDate] = useState('');
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [targetAlbumId, setTargetAlbumId] = useState<string>(initialAlbums[0]?.id || '');
  const [bulkFiles, setBulkFiles] = useState<FileList | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [editingAlbum, setEditingAlbum] = useState<EventAlbum | null>(null);

  const notify = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const pendingProfiles = profiles.filter((p) => p.status === 'pending');

  // 1. Approve / Reject Pending
  const handleApprove = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      notify('err', error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
      );
      notify('ok', 'Member approved and published to the Batch Directory.');
      router.refresh();
    }
    setBusyId(null);
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Delete this member profile permanently?')) return;
    setBusyId(id);
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      notify('err', error.message);
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      notify('ok', 'Member profile deleted.');
      router.refresh();
    }
    setBusyId(null);
  };

  // 2. All Members: Edit & Promote Batch
  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setBusyId(editingMember.id);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editingMember.full_name,
        batch: editingMember.batch,
        department: editingMember.department,
        blood_group: editingMember.blood_group,
        phone: editingMember.phone,
        profession: editingMember.profession,
        company: editingMember.company,
        current_city: editingMember.current_city,
        social_link: editingMember.social_link,
        is_alumni: editingMember.is_alumni,
        role: editingMember.role,
        status: editingMember.status,
      })
      .eq('id', editingMember.id);

    if (error) {
      notify('err', error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === editingMember.id ? editingMember : p))
      );
      setEditingMember(null);
      notify('ok', 'Member updated.');
      router.refresh();
    }
    setBusyId(null);
  };

  const handlePromoteBatch = async () => {
    setBusyId('promote');
    const { data, error } = await supabase.rpc('promote_batch_to_alumni', {
      target_batch: promoteBatch,
    });

    if (error) {
      notify('err', error.message);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.batch === promoteBatch ? { ...p, is_alumni: true } : p))
      );
      notify('ok', `Promoted ${data ?? 0} member(s) in ${promoteBatch} Batch to Alumni.`);
      router.refresh();
    }
    setBusyId(null);
  };

  // 3. Hero Slides CRUD
  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideFile) {
      notify('err', 'Please select a cover image to upload.');
      return;
    }
    setBusyId('add-slide');
    try {
      const ext = slideFile.name.split('.').pop() || 'jpg';
      const path = `slide-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('covers')
        .upload(path, slideFile, { cacheControl: '3600', upsert: false });
      if (upErr) throw new Error(upErr.message);

      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path);

      const { data: inserted, error: insErr } = await supabase
        .from('hero_slides')
        .insert({
          title: slideTitle.trim(),
          subtitle: slideSubtitle.trim(),
          batch_label: slideBatchLabel.trim(),
          image_url: urlData.publicUrl,
          display_order: slideOrder,
          is_active: true,
        })
        .select()
        .single();

      if (insErr) throw new Error(insErr.message);

      setSlides((prev) => [...prev, inserted].sort((a, b) => a.display_order - b.display_order));
      setSlideTitle('');
      setSlideSubtitle('');
      setSlideBatchLabel('');
      setSlideOrder((o) => o + 1);
      setSlideFile(null);
      notify('ok', 'Hero slide added.');
      router.refresh();
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to add slide.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    setBusyId(editingSlide.id);
    const { error } = await supabase
      .from('hero_slides')
      .update({
        title: editingSlide.title,
        subtitle: editingSlide.subtitle,
        batch_label: editingSlide.batch_label,
        display_order: editingSlide.display_order,
        is_active: editingSlide.is_active,
      })
      .eq('id', editingSlide.id);

    if (error) {
      notify('err', error.message);
    } else {
      setSlides((prev) =>
        prev
          .map((s) => (s.id === editingSlide.id ? editingSlide : s))
          .sort((a, b) => a.display_order - b.display_order)
      );
      setEditingSlide(null);
      notify('ok', 'Slide updated.');
      router.refresh();
    }
    setBusyId(null);
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Delete this hero slide?')) return;
    setBusyId(id);
    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (error) {
      notify('err', error.message);
    } else {
      setSlides((prev) => prev.filter((s) => s.id !== id));
      notify('ok', 'Slide deleted.');
      router.refresh();
    }
    setBusyId(null);
  };


  const handleSaveBatchCover = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('save-bc');
    try {
      const existing = batchCovers.find((c) => c.batch === bcBatch);
      let coverUrl = existing?.cover_url || '/covers/deshal-cover.svg';
      if (bcFile) {
        const ext = bcFile.name.split('.').pop() || 'jpg';
        const path = `batch-${bcBatch}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('covers')
          .upload(path, bcFile, { cacheControl: '3600', upsert: true });
        if (upErr) throw new Error(upErr.message);
        coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
      }

      const payload = {
        batch: bcBatch,
        cover_url: coverUrl,
        title: bcTitle.trim() || existing?.title || `${bcBatch} Batch`,
        subtitle: bcSubtitle.trim() || existing?.subtitle || 'Deshal 13 • Room 13',
      };

      const { data: savedRow, error: upErr } = await supabase
        .from('batch_covers')
        .upsert(payload, { onConflict: 'batch' })
        .select()
        .single();

      if (upErr) throw new Error(upErr.message);

      setBatchCovers((prev) => {
        const rest = prev.filter((c) => c.batch !== bcBatch);
        return [...rest, savedRow];
      });
      setBcTitle('');
      setBcSubtitle('');
      setBcFile(null);
      notify('ok', `${bcBatch} Batch cover saved.`);
      router.refresh();
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to save batch cover.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteBatchCover = async (batchName: string) => {
    if (!confirm(`Delete cover photo for ${batchName} Batch?`)) return;
    setBusyId(`del-bc-${batchName}`);
    const { error } = await supabase.from('batch_covers').delete().eq('batch', batchName);
    if (error) {
      notify('err', error.message);
    } else {
      setBatchCovers((prev) => prev.filter((c) => c.batch !== batchName));
      notify('ok', `${batchName} Batch cover deleted.`);
      router.refresh();
    }
    setBusyId(null);
  };

  // 4. Memories & Albums CRUD
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('create-album');
    try {
      let coverUrl = '/covers/deshal-cover.svg';
      if (albumCoverFile) {
        const ext = albumCoverFile.name.split('.').pop() || 'jpg';
        const path = `album-cover-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('memories')
          .upload(path, albumCoverFile, { cacheControl: '3600', upsert: false });
        if (upErr) throw new Error(upErr.message);
        coverUrl = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
      }

      const { data: inserted, error: insErr } = await supabase
        .from('event_albums')
        .insert({
          title: albumTitle.trim(),
          description: albumDesc.trim(),
          event_date: albumDate || null,
          cover_url: coverUrl,
        })
        .select()
        .single();

      if (insErr) throw new Error(insErr.message);

      setAlbums((prev) => [inserted, ...prev]);
      setTargetAlbumId(inserted.id);
      setAlbumTitle('');
      setAlbumDesc('');
      setAlbumDate('');
      setAlbumCoverFile(null);
      notify('ok', 'Event album created.');
      router.refresh();
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to create album.');
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkUploadPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAlbumId || !bulkFiles || bulkFiles.length === 0) {
      notify('err', 'Select an album and at least one photo.');
      return;
    }
    setBusyId('bulk-upload');
    try {
      const uploadedRows: AlbumPhoto[] = [];
      for (let i = 0; i < bulkFiles.length; i++) {
        const file = bulkFiles[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${targetAlbumId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('memories')
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw new Error(upErr.message);

        const publicUrl = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const { data: photoRow, error: insErr } = await supabase
          .from('album_photos')
          .insert({
            album_id: targetAlbumId,
            image_url: publicUrl,
            media_type: mediaType,
            caption: photoCaption.trim(),
          })
          .select()
          .single();

        if (insErr) throw new Error(insErr.message);
        uploadedRows.push(photoRow);
      }

      setPhotos((prev) => [...uploadedRows, ...prev]);
      setBulkFiles(null);
      setPhotoCaption('');
      notify('ok', `Uploaded ${uploadedRows.length} photo(s) to album.`);
      router.refresh();
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Bulk upload failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from('album_photos').delete().eq('id', id);
    if (error) {
      notify('err', error.message);
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      notify('ok', 'Photo deleted.');
      router.refresh();
    }
    setBusyId(null);
  };


  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum) return;
    setBusyId(editingAlbum.id);
    const { error } = await supabase
      .from('event_albums')
      .update({
        title: editingAlbum.title.trim(),
        description: editingAlbum.description.trim(),
        event_date: editingAlbum.event_date || null,
      })
      .eq('id', editingAlbum.id);

    if (error) {
      notify('err', error.message);
    } else {
      setAlbums((prev) => prev.map((a) => (a.id === editingAlbum.id ? editingAlbum : a)));
      setEditingAlbum(null);
      notify('ok', 'Album updated.');
      router.refresh();
    }
    setBusyId(null);
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Delete this album and all its photos?')) return;
    setBusyId(id);
    const { error } = await supabase.from('event_albums').delete().eq('id', id);
    if (error) {
      notify('err', error.message);
    } else {
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      setPhotos((prev) => prev.filter((p) => p.album_id !== id));
      notify('ok', 'Album deleted.');
      router.refresh();
    }
    setBusyId(null);
  };

  // 5. Site Content & Notice Board
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('settings');
    const { error } = await supabase
      .from('site_settings')
      .update({
        room_name: settings.room_name,
        motto: settings.motto,
        about_text: settings.about_text,
        notice_title: settings.notice_title,
        notice_body: settings.notice_body,
      })
      .eq('id', 1);

    if (error) {
      notify('err', error.message);
    } else {
      notify('ok', 'Site content & Notice Board updated live.');
      router.refresh();
    }
    setBusyId(null);
  };

  const filteredMembers = profiles.filter((p) => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.batch.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q)
    );
  });

  const tabs: { key: TabKey; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'pending', label: 'Pending Approvals', icon: UserCheck, badge: pendingProfiles.length },
    { key: 'members', label: 'All Members', icon: Users },
    { key: 'slides', label: 'Hero Slider', icon: SlidersHorizontal },
    { key: 'memories', label: 'Memories & Albums', icon: Images },
    { key: 'settings', label: 'Site & Notice Board', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${
            toast.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {typeof tab.badge === 'number' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    active
                      ? 'bg-white/20 text-white'
                      : tab.badge > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingProfiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <UserCheck className="mx-auto h-10 w-10 text-emerald-500" />
              <h3 className="mt-3 text-base font-bold text-slate-900">All caught up!</h3>
              <p className="mt-1 text-sm text-slate-500">
                There are no pending member registrations waiting for approval.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingProfiles.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        m.full_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{m.full_name}</h3>
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                          {m.batch} Batch
                        </span>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {m.blood_group}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {m.department} • {m.email}
                      </p>
                      {m.phone && <p className="text-xs text-slate-500">Phone: {m.phone}</p>}
                      {(m.profession || m.company || m.current_city) && (
                        <p className="text-xs text-slate-500">
                          {[m.profession, m.company, m.current_city].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => handleApprove(m.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve &amp; Publish
                    </button>
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => handleDeleteMember(m.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL MEMBERS MANAGER */}
      {activeTab === 'members' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members by name, email, batch, or department..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={promoteBatch}
                onChange={(e) => setPromoteBatch(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
              >
                {ALL_BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b} Batch
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busyId === 'promote'}
                onClick={handlePromoteBatch}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                <ArrowUpRight className="h-4 w-4" />
                Promote Batch to Alumni
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{m.full_name}</div>
                      <div className="text-xs text-slate-500">
                        {m.department} • {m.blood_group} • {m.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{m.batch}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          m.is_alumni
                            ? 'bg-brand-50 text-brand-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {m.is_alumni ? 'Alumni' : 'Running'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          m.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingMember({ ...m })}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HERO SLIDER MANAGER */}
      {activeTab === 'slides' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleAddSlide}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 h-fit"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-600" />
              Add Hero Cover Slide
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Slide Title *
              </label>
              <input
                type="text"
                required
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                placeholder="e.g. 13th Batch — Room 13 Cover"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Batch Badge Label
              </label>
              <input
                type="text"
                value={slideBatchLabel}
                onChange={(e) => setSlideBatchLabel(e.target.value)}
                placeholder="e.g. 13th Batch"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Subtitle / Caption
              </label>
              <textarea
                rows={2}
                value={slideSubtitle}
                onChange={(e) => setSlideSubtitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={slideOrder}
                onChange={(e) => setSlideOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cover Image *
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setSlideFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={busyId === 'add-slide'}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {busyId === 'add-slide' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload &amp; Add Slide
            </button>
          </form>

          <div className="lg:col-span-2 space-y-4">
            {slides.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <img
                  src={s.image_url}
                  alt={s.title}
                  className="h-28 w-full sm:w-44 shrink-0 rounded-xl object-cover bg-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      #{s.display_order}
                    </span>
                    {s.batch_label && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        {s.batch_label}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        s.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{s.subtitle}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSlide({ ...s })}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(s.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Batch-Wise Cover Photos (Add / Change / Delete)</h2>
            <form onSubmit={handleSaveBatchCover} className="grid gap-3 sm:grid-cols-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Batch</label>
                <select value={bcBatch} onChange={(e) => setBcBatch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  {ALL_BATCHES.map((b) => (
                    <option key={b} value={b}>{b} Batch</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input type="text" value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} placeholder="e.g. 13th Batch" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Upload Cover Image</label>
                <input type="file" accept="image/*" onChange={(e) => setBcFile(e.target.files?.[0] || null)} className="block w-full text-xs text-slate-600" />
              </div>
              <button type="submit" disabled={busyId === 'save-bc'} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400">
                Save Batch Cover
              </button>
            </form>
            {batchCovers.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 pt-2">
                {batchCovers.map((bc) => (
                  <div key={bc.batch} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <img src={bc.cover_url} alt={bc.batch} className="h-20 w-full object-cover" />
                    <div className="p-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">{bc.batch} Batch</span>
                      <button type="button" onClick={() => handleDeleteBatchCover(bc.batch)} className="text-[11px] font-semibold text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MEMORIES & ALBUMS MANAGER */}
      {activeTab === 'memories' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Create Album */}
            <form
              onSubmit={handleCreateAlbum}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">Create Event Album</h2>
              <input
                type="text"
                required
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                placeholder="Album Title (e.g. Iftar Mahfil 2026)"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
              />
              <textarea
                rows={2}
                value={albumDesc}
                onChange={(e) => setAlbumDesc(e.target.value)}
                placeholder="Short description..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={albumDate}
                    onChange={(e) => setAlbumDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Album Cover (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAlbumCoverFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busyId === 'create-album'}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Create Album
              </button>
            </form>

            {/* Bulk Upload Photos */}
            <form
              onSubmit={handleBulkUploadPhotos}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">Bulk Upload Event Photos</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Album
                </label>
                <select
                  value={targetAlbumId}
                  onChange={(e) => setTargetAlbumId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm"
                >
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Caption (Optional, applied to batch)
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="e.g. Room 13 Iftar gathering"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Photos or Videos (Multiple allowed)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  required
                  onChange={(e) => setBulkFiles(e.target.files)}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={busyId === 'bulk-upload'}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busyId === 'bulk-upload' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Photos
              </button>
            </form>
          </div>

          {/* Albums List & Photos */}
          <div className="space-y-4">
            {albums.map((album) => {
              const albumPhotos = photos.filter((p) => p.album_id === album.id);
              return (
                <div
                  key={album.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {album.title} ({albumPhotos.length} photos)
                      </h3>
                      <p className="text-xs text-slate-500">{album.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAlbum({ ...album })}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Album
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAlbum(album.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Album
                      </button>
                    </div>
                  </div>

                  {albumPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {albumPhotos.map((p) => (
                        <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                          <img
                            src={p.image_url}
                            alt={p.caption || 'Memory'}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(p.id)}
                            aria-label="Delete photo"
                            className="absolute right-1.5 top-1.5 rounded-full bg-black/65 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SITE CONTENT & NOTICE BOARD */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 max-w-3xl"
        >
          <h2 className="text-lg font-bold text-slate-900">
            Site Content &amp; Notice Board Editor
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Room Name
              </label>
              <input
                type="text"
                required
                value={settings.room_name}
                onChange={(e) => setSettings({ ...settings, room_name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Room Motto
              </label>
              <input
                type="text"
                required
                value={settings.motto}
                onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              About Deshal 13 Description
            </label>
            <textarea
              rows={4}
              required
              value={settings.about_text}
              onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Notice Board Title
              </label>
              <input
                type="text"
                required
                value={settings.notice_title}
                onChange={(e) => setSettings({ ...settings, notice_title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Notice Board Announcement
              </label>
              <textarea
                rows={4}
                required
                value={settings.notice_body}
                onChange={(e) => setSettings({ ...settings, notice_body: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busyId === 'settings'}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {busyId === 'settings' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Publish Live Changes
          </button>
        </form>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveMemberEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Member</h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingMember.full_name}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, full_name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Batch</label>
                <select
                  value={editingMember.batch}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      batch: e.target.value as Profile['batch'],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {ALL_BATCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Blood Group
                </label>
                <select
                  value={editingMember.blood_group}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      blood_group: e.target.value as Profile['blood_group'],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editingMember.department}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, department: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingMember.phone || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Profession
                </label>
                <input
                  type="text"
                  value={editingMember.profession || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, profession: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company</label>
                <input
                  type="text"
                  value={editingMember.company || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, company: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Current City
                </label>
                <input
                  type="text"
                  value={editingMember.current_city || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, current_city: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Portal Section
                </label>
                <select
                  value={editingMember.is_alumni ? 'alumni' : 'running'}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      is_alumni: e.target.value === 'alumni',
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="running">Running Batch</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT SLIDE MODAL */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUpdateSlide}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Hero Slide</h3>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
              <input
                type="text"
                required
                value={editingSlide.title}
                onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Batch Label</label>
              <input
                type="text"
                value={editingSlide.batch_label}
                onChange={(e) =>
                  setEditingSlide({ ...editingSlide, batch_label: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subtitle</label>
              <textarea
                rows={2}
                value={editingSlide.subtitle}
                onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Order</label>
                <input
                  type="number"
                  value={editingSlide.display_order}
                  onChange={(e) =>
                    setEditingSlide({
                      ...editingSlide,
                      display_order: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingSlide.is_active}
                    onChange={(e) =>
                      setEditingSlide({ ...editingSlide, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Save Slide
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT ALBUM MODAL */}
      {editingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUpdateAlbum}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Album</h3>
              <button
                type="button"
                onClick={() => setEditingAlbum(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Album Title</label>
              <input
                type="text"
                required
                value={editingAlbum.title}
                onChange={(e) => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea
                rows={2}
                value={editingAlbum.description}
                onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Event Date</label>
              <input
                type="date"
                value={editingAlbum.event_date || ''}
                onChange={(e) => setEditingAlbum({ ...editingAlbum, event_date: e.target.value || null })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAlbum(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Save Album
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
