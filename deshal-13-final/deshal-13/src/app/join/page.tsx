'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ALL_BATCHES, BLOOD_GROUPS } from '@/types/database';

export default function JoinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [batch, setBatch] = useState<string>('12th');
  const [department, setDepartment] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const isAlumniBatch = ['5th', '6th', '7th', '8th', '9th', '10th', '11th'].includes(batch);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be under 5 MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      let uploadedAvatarUrl = '';

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        uploadedAvatarUrl = urlData.publicUrl;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            batch,
            department: department.trim(),
            blood_group: bloodGroup,
            phone: phone.trim(),
            profession: profession.trim(),
            company: company.trim(),
            current_city: currentCity.trim(),
            social_link: socialLink.trim(),
            avatar_url: uploadedAvatarUrl,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.session) {
        router.push('/profile');
        router.refresh();
      } else {
        setSuccessMsg(
          'Registration submitted! Please check your email if confirmation is enabled, or log in to view your approval status.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Registration Received!</h1>
          <p className="mt-2 text-sm text-slate-600">{successMsg}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <UserPlus className="h-3.5 w-3.5" />
            Member Registration
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            Join Deshal 13 (দেশাল ১৩)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Fill in your details to appear in the Batch Directory once approved by the Room Admin.
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                Profile Picture (Max 5 MB)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-800 cursor-pointer"
              />
            </div>
          </div>

          {/* Account Credentials */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password * (min 6 chars)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Core Identity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Batch *
              </label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {ALL_BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b} Batch {['5th','6th','7th','8th','9th','10th','11th'].includes(b) ? '(Alumni)' : '(Running)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Blood Group *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Department *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CSE, EEE, BBA, Economics"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Career & Location (Highlighted for Alumni) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isAlumniBatch ? 'Alumni Career & Location Details' : 'Career & Location (Optional for Running Students)'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Profession / Designation
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Grameenphone / BUET"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Current City
                </label>
                <input
                  type="text"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  placeholder="e.g. Dhaka, Toronto, Berlin"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Facebook / LinkedIn Link
                </label>
                <input
                  type="url"
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  placeholder="https://facebook.com/username"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Submit Registration
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
