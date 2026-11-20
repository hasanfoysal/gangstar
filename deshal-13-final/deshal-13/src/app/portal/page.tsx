import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import PortalDirectory from '@/components/PortalDirectory';
import type { Profile, BatchCover } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const supabase = await createClient();

  const [membersRes, coversRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('status', 'approved')
      .order('batch', { ascending: true })
      .order('full_name', { ascending: true }),
    supabase.from('batch_covers').select('*'),
  ]);

  const members: Profile[] = membersRes.data ?? [];
  const batchCovers: BatchCover[] = coversRes.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Users className="h-3.5 w-3.5" />
            Batch-Wise Directory
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Deshal 13 Student &amp; Alumni Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse verified Alumni (5th–11th Batch) and Running Residents (12th–14th Batch).
          </p>
        </div>
      </div>

      <PortalDirectory members={members} batchCovers={batchCovers} />
    </div>
  );
}
