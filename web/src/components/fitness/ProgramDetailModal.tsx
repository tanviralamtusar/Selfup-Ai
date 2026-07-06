'use client';

// ═══════════════════════════════════════════════════════════
// Program detail modal (workout-cool port, phase 4)
// Weeks → sessions → exercises, with enroll / leave and
// per-session completion + progress.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ChevronDown, Dumbbell, Loader2, CalendarDays, Layers, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import type { ProgramRow, ProgramWeekRow, ProgramSessionRow } from '@/types/fitness';

interface ProgramDetailModalProps {
  programId: string;
  onClose: () => void;
  onChanged?: () => void; // refresh the catalog after enroll/leave/progress
}

export default function ProgramDetailModal({ programId, onClose, onChanged }: ProgramDetailModalProps) {
  const { session } = useAuthStore();
  const [program, setProgram] = useState<ProgramRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openWeek, setOpenWeek] = useState<number | null>(1);

  const authHeaders = useCallback(
    (): HeadersInit => ({
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }),
    [session?.access_token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fitness/programs/${programId}`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProgram(json.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load program');
    } finally {
      setLoading(false);
    }
  }, [programId, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const enrollment = program?.enrollment ?? null;
  const isEnrolled = !!enrollment?.is_active;
  const completedIds = new Set(
    (enrollment?.user_session_progress ?? []).filter((p) => p.completed_at).map((p) => p.session_id)
  );
  const totalSessions =
    program?.program_weeks?.reduce((n, w) => n + (w.program_sessions?.length ?? 0), 0) ?? 0;

  const handleEnroll = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/fitness/programs/${programId}/enroll`, {
        method: isEnrolled ? 'DELETE' : 'POST',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(isEnrolled ? 'Left program' : 'Enrolled! Let\'s go 💪');
      await load();
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/fitness/programs/${programId}/progress`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data.xpAwarded) toast.success(`Session complete! +${json.data.xpAwarded} XP`, { icon: '🔥' });
      if (json.data.programCompleted) toast.success('Program finished! 🏆');
      await load();
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark complete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !program ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400"
              >
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-white pr-8">{program.title}</h2>
              {program.description && (
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{program.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-semibold uppercase tracking-wide">
                <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full px-2.5 py-1">
                  <Layers size={12} /> {program.level}
                </span>
                <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full px-2.5 py-1">
                  <CalendarDays size={12} /> {program.duration_weeks} weeks
                </span>
                <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full px-2.5 py-1">
                  {program.sessions_per_week}×/week
                </span>
                {program.participant_count > 0 && (
                  <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full px-2.5 py-1">
                    <Trophy size={12} /> {program.participant_count}
                  </span>
                )}
              </div>

              {/* Progress bar when enrolled */}
              {isEnrolled && totalSessions > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Progress</span>
                    <span>{completedIds.size} / {totalSessions} sessions</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(completedIds.size / totalSessions) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleEnroll}
                disabled={busy}
                className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  isEnrolled
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {busy ? '…' : isEnrolled ? 'Leave Program' : 'Enroll'}
              </button>
            </div>

            {/* Weeks / sessions */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {(program.program_weeks ?? []).map((week: ProgramWeekRow) => (
                <div key={week.id} className="border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenWeek(openWeek === week.week_number ? null : week.week_number)}
                    className="w-full flex items-center justify-between p-3.5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">
                      Week {week.week_number}
                      {week.title ? <span className="text-zinc-400 font-normal"> — {week.title}</span> : null}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-zinc-500 transition-transform ${openWeek === week.week_number ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openWeek === week.week_number && (
                    <div className="p-2 space-y-2">
                      {(week.program_sessions ?? []).map((s: ProgramSessionRow) => {
                        const done = completedIds.has(s.id);
                        return (
                          <div key={s.id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  {s.title || `Session ${s.session_number}`}
                                </h4>
                                <p className="text-[11px] text-zinc-500">
                                  {s.program_session_exercises?.length ?? 0} exercises · ~{s.estimated_minutes} min
                                </p>
                              </div>
                              {isEnrolled &&
                                (done ? (
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                    <Check size={14} /> Done
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCompleteSession(s.id)}
                                    disabled={busy}
                                    className="text-[11px] font-semibold bg-blue-600 text-white rounded-md px-2.5 py-1.5 hover:bg-blue-500 disabled:opacity-50 transition-colors"
                                  >
                                    Mark done
                                  </button>
                                ))}
                            </div>

                            {(s.program_session_exercises?.length ?? 0) > 0 && (
                              <div className="mt-2 pt-2 border-t border-zinc-800/60 space-y-1">
                                {s.program_session_exercises!.map((ex) => (
                                  <div key={ex.id} className="flex items-center gap-2 text-[12px] text-zinc-400">
                                    <Dumbbell size={12} className="text-zinc-600 shrink-0" />
                                    <span className="truncate">{ex.exercises?.name || 'Exercise'}</span>
                                    {ex.suggested_sets?.length ? (
                                      <span className="text-zinc-600 ml-auto shrink-0">
                                        {ex.suggested_sets.length} sets
                                      </span>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
