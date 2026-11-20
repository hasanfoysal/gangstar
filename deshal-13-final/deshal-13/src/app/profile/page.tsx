'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Save,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ALL_BATCHES, BLOOD_GROUPS, type Profile } from '@/types/database';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError || !data) {
        setError('Could not load your profile.');
      } else {
        setProfile(data);
        setAvatarPreview(data.avatar_url || '');
      }
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const supabase = createClient();
      let newAvatarUrl = profile.avatar_url;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const fileName = `${profile.id}-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { cacheControl: '3600', upsert: true });

        if (uploadErr) throw new Error(uploadErr.message);

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = urlData.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          batch: profile.batch,
          department: profile.department.trim(),
          blood_group: profile.blood_group,
          phone: profile.phone.trim(),
          profession: profile.profession.trim(),
          company: profile.company.trim(),
          current_city: profile.current_city.trim(),
          social_link: profile.social_link.trim(),
          avatar_url: newAvatarUrl,
        })
        .eq('id', profile.id);

      if (updateErr) throw new Error(updateErr.message);

      setProfile({ ...profile, avatar_url: newAvatarUrl });
      setAvatarFile(null);
      setMessage('Your profile has been updated.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-rose-600">{error || 'Profile not found.'}</p>
      </div>
    );
  }

  // Pending Approval Gate
  if (profile.status === 'pending') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Pending Admin Approval
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Your registration is pending Admin approval.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Once the Room 13 Admin verifies and approves your account, your profile card will
            automatically appear under the <strong>{profile.batch} Batch</strong> in the public
            directory and you will be able to edit your details here.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Home
            </Link>
            <Link
              href="/memories"
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              View Memories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-500">
              Update your personal details and profile photo anytime.
            </p>
          </div>
          {profile.role === 'admin' && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-200"
            >
              <ShieldCheck className="h-4 w-4" />
              Open Admin CMS
            </Link>
          )}
        </div>

        {message && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                Change Profile Photo
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-800 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Batch
              </label>
              <select
                value={profile.batch}
                onChange={(e) =>
                  setProfile({ ...profile, batch: e.target.value as Profile['batch'] })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                {ALL_BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b} Batch
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Blood Group
              </label>
              <select
                value={profile.blood_group}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    blood_group: e.target.value as Profile['blood_group'],
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Department
              </label>
              <input
                type="text"
                required
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Profession / Designation
              </label>
              <input
                type="text"
                value={profile.profession || ''}
                onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Current City
              </label>
              <input
                type="text"
                value={profile.current_city || ''}
                onChange={(e) => setProfile({ ...profile, current_city: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Facebook / LinkedIn URL
              </label>
              <input
                type="url"
                value={profile.social_link || ''}
                onChange={(e) => setProfile({ ...profile, social_link: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
