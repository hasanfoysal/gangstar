'use client';

import { useState, useMemo } from 'react';
import { Search, GraduationCap, Users, Sparkles } from 'lucide-react';
import { ALL_BATCHES, type Profile, type BatchCover } from '@/types/database';
import MemberCard from './MemberCard';

interface PortalDirectoryProps {
  members: Profile[];
  batchCovers?: BatchCover[];
}

export default function PortalDirectory({ members, batchCovers = [] }: PortalDirectoryProps) {
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (selectedBatch !== 'All' && m.batch !== selectedBatch) return false;
      if (!q) return true;
      return (
        m.full_name.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.blood_group.toLowerCase().includes(q) ||
        (m.profession || '').toLowerCase().includes(q) ||
        (m.company || '').toLowerCase().includes(q) ||
        (m.current_city || '').toLowerCase().includes(q)
      );
    });
  }, [members, selectedBatch, search]);

  const alumniMembers = filtered.filter((m) => m.is_alumni);
  const runningMembers = filtered.filter((m) => !m.is_alumni);

  const groupByBatch = (list: Profile[]) => {
    const map = new Map<string, Profile[]>();
    for (const batch of ALL_BATCHES) {
      const items = list.filter((m) => m.batch === batch);
      if (items.length > 0) {
        map.set(batch, items);
      }
    }
    return Array.from(map.entries());
  };

  const alumniGroups = groupByBatch(alumniMembers);
  const runningGroups = groupByBatch(runningMembers);
  const activeBatchCover = selectedBatch !== 'All' ? batchCovers.find((c) => c.batch === selectedBatch) : null;

  return (
    <div className="space-y-8">
      {/* Search & Batch Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Department, Blood Group (e.g. O+), Profession, or City..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Batch Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedBatch('All')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedBatch === 'All'
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({members.length})
          </button>
          {ALL_BATCHES.map((batch) => {
            const count = members.filter((m) => m.batch === batch).length;
            return (
              <button
                key={batch}
                type="button"
                onClick={() => setSelectedBatch(batch)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedBatch === batch
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {batch} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch-Wise Cover Photo Banner when a specific batch is selected */}
      {selectedBatch !== 'All' && (
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-md">
          <img
            src={activeBatchCover?.cover_url || '/covers/deshal-cover.svg'}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-45"
          />
          <div className="relative z-10 mx-auto max-w-4xl">
            <img
              src={activeBatchCover?.cover_url || '/covers/deshal-cover.svg'}
              alt={`${selectedBatch} Batch Cover`}
              className="block w-full h-auto max-h-[640px] object-contain mx-auto"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-30 p-5 sm:p-7 text-white">
            <span className="inline-flex rounded-full bg-amber-500/25 px-3 py-0.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/40">
              {selectedBatch} Batch • Deshal 13
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeBatchCover?.title || `${selectedBatch} Batch`}
            </h2>
            {activeBatchCover?.subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-200">{activeBatchCover.subtitle}</p>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">No members found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing your search or selecting another batch tab.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Alumni Portal Section (5th – 11th + Promoted) */}
          {alumniGroups.length > 0 && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Alumni Portal</h2>
                    <p className="text-xs text-slate-500">5th Batch – 11th Batch &amp; Promoted Seniors</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {alumniMembers.length} Alumni
                </span>
              </div>

              <div className="space-y-8">
                {alumniGroups.map(([batch, list]) => (
                  <div key={batch} className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-brand-700">
                      {batch} Batch ({list.length})
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {list.map((member) => (
                        <MemberCard key={member.id} member={member} variant="alumni" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Running Batch Portal Section (12th – 14th) */}
          {runningGroups.length > 0 && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Running Batch Portal</h2>
                    <p className="text-xs text-slate-500">12th Batch – 14th Batch Current Residents</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {runningMembers.length} Residents
                </span>
              </div>

              <div className="space-y-8">
                {runningGroups.map(([batch, list]) => (
                  <div key={batch} className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                      {batch} Batch ({list.length})
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {list.map((member) => (
                        <MemberCard key={member.id} member={member} variant="running" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
