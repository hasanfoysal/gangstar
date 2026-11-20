import {
  Briefcase,
  Building2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Droplets,
} from 'lucide-react';
import type { Profile } from '@/types/database';

interface MemberCardProps {
  member: Profile;
  variant: 'alumni' | 'running';
}

export default function MemberCard({ member, variant }: MemberCardProps) {
  const initials = member.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  const formatSocialUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  const designationText =
    member.profession ||
    (variant === 'alumni' ? 'Alumni Member' : `Running Student (${member.batch} Batch)`);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
      {/* Top Square/Portrait Photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.full_name}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold tracking-wider text-white/90">
            {initials || 'D13'}
          </div>
        )}

        {/* Batch & Blood Group Overlay Badges */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur-sm ${
              variant === 'alumni'
                ? 'bg-slate-900/75 text-white'
                : 'bg-emerald-700/90 text-white'
            }`}
          >
            {member.batch}
          </span>
        </div>
        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold text-rose-700 shadow-sm">
          <Droplets className="h-3 w-3 fill-rose-500 text-rose-600" />
          {member.blood_group}
        </span>
      </div>

      {/* Card Body (Screenshot Style: Name -> Dept Pill -> Designation) */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="truncate text-base font-bold text-slate-900">
            {member.full_name}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
              {member.department}
            </span>
          </div>

          <p className="mt-1.5 truncate text-xs font-medium text-slate-500 flex items-center gap-1">
            <Briefcase className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate">{designationText}</span>
          </p>

          {(member.company || member.current_city) && (
            <p className="mt-1 truncate text-[11px] text-slate-400 flex items-center gap-1">
              {member.company ? (
                <>
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{member.company}</span>
                </>
              ) : (
                <>
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{member.current_city}</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Contact & Social Row */}
        <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3">
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors truncate"
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{member.phone}</span>
            </a>
          )}
          {member.email && variant === 'alumni' && (
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              title={member.email}
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          {member.social_link && (
            <a
              href={formatSocialUrl(member.social_link)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
            >
              Profile
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
