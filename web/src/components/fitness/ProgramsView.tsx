'use client';

// ═══════════════════════════════════════════════════════════
// Programs catalog (workout-cool port, phase 4)
// Grid of structured multi-week programs the user can enroll in.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, CalendarDays, Layers, Trophy, Dumbbell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { ProgramRow } from '@/types/fitness';
import ProgramDetailModal from './ProgramDetailModal';

export default function ProgramsView() {
  const { session } = useAuthStore();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/fitness/programs', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const json = await res.json();
      if (res.ok) setPrograms(json.data ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    load();
  }, [load]);

  const enrolled = programs.filter((p) => p.enrollment?.is_active);
  const catalog = programs.filter((p) => !p.enrollment?.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-blue-500" size={28} />
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-zinc-800 rounded-xl">
        <Dumbbell size={28} className="mx-auto text-zinc-600 mb-3" />
        <p className="text-sm text-zinc-400">No programs available yet.</p>
        <p className="text-[12px] text-zinc-600 mt-1">
          Run the programs migration + seed to populate the catalog.
        </p>
      </div>
    );
  }

  const Card = ({ p }: { p: ProgramRow }) => {
    const enr = p.enrollment;
    return (
      <button
        onClick={() => setSelectedId(p.id)}
        className="text-left bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-blue-500/40 transition-colors group"
      >
        <div className="h-24 bg-gradient-to-br from-blue-600/20 to-zinc-900 relative flex items-center justify-center">
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
          ) : (
            <Dumbbell size={28} className="text-blue-500/40 group-hover:text-blue-500/70 transition-colors" />
          )}
          {p.is_premium && (
            <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5">
              Premium
            </span>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="text-sm font-semibold text-white truncate">{p.title}</h3>
          {p.category && <p className="text-[11px] text-zinc-500 mt-0.5">{p.category}</p>}

          <div className="flex flex-wrap gap-1.5 mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5">
              <Layers size={10} /> {p.level}
            </span>
            <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5">
              <CalendarDays size={10} /> {p.duration_weeks}w
            </span>
            {p.participant_count > 0 && (
              <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5">
                <Trophy size={10} /> {p.participant_count}
              </span>
            )}
          </div>

          {enr?.is_active && (
            <p className="text-[11px] text-blue-400 mt-2 font-medium">
              Week {enr.current_week} · {enr.completed_sessions} sessions done
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {enrolled.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-wide text-zinc-500 mb-3">My Programs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((p) => (
              <Card key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[11px] uppercase tracking-wide text-zinc-500 mb-3">
          {enrolled.length > 0 ? 'Browse Programs' : 'Programs'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((p) => (
            <Card key={p.id} p={p} />
          ))}
        </div>
      </section>

      {selectedId && (
        <ProgramDetailModal
          programId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
