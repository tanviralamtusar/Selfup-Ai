'use client';

// ═══════════════════════════════════════════════════════════
// Quick Session — ad-hoc workout from the builder's picked exercises.
// Reuses ExerciseCard + RestTimer; logging is LOCAL only (not persisted
// to a plan). For tracked/plan workouts, use the Workout tab's session.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Clock, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ExerciseCard } from '../ExerciseCard';
import { RestTimer } from '../RestTimer';
import type { WorkoutDayExerciseRow } from '@/types/fitness';
import type { BuilderExercise } from './builderTypes';

interface QuickSessionProps {
  exercises: BuilderExercise[];
  onClose: () => void;
}

const DEFAULT_SETS = 3;
const DEFAULT_REPS = '10';
const DEFAULT_REST = 60;

type LogEntry = { sets_completed: number; weights_used: number[]; reps_done: number[] };

// Adapt a builder exercise into the shape ExerciseCard expects.
function toDayExercise(ex: BuilderExercise, order: number): WorkoutDayExerciseRow {
  return {
    id: ex.id,
    workout_day_id: 'quick',
    exercise_id: ex.id,
    sets: DEFAULT_SETS,
    reps: DEFAULT_REPS,
    rest_seconds: DEFAULT_REST,
    order_index: order,
    notes: null,
    weight_note: null,
    technique_note: ex.technique_note ?? null,
    xp_per_set: 3,
    xp_full_exercise: 10,
    exercises: {
      id: ex.id,
      user_id: null,
      name: ex.name,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      instructions: null,
      technique_note: ex.technique_note ?? null,
      video_url: ex.video_url ?? null,
      video_title: null,
      video_source: null,
      created_at: '',
    },
  };
}

export function QuickSession({ exercises, onClose }: QuickSessionProps) {
  const [setsDone, setSetsDone] = useState<Record<string, LogEntry>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST);
  const [restTrigger, setRestTrigger] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const dayExercises = exercises.map(toDayExercise);

  const handleLogSet = (exId: string, setNum: number, weight: number | null, reps: number | null) => {
    setSetsDone((prev) => {
      const entry = prev[exId] ?? { sets_completed: 0, weights_used: [], reps_done: [] };
      const next: LogEntry = {
        sets_completed: setNum,
        weights_used: weight !== null ? [...entry.weights_used, weight] : entry.weights_used,
        reps_done: reps !== null ? [...entry.reps_done, reps] : entry.reps_done,
      };
      return { ...prev, [exId]: next };
    });

    const isLastSet = setNum >= DEFAULT_SETS;
    const isLastExercise = activeIdx >= dayExercises.length - 1;
    if (!(isLastSet && isLastExercise)) {
      setRestSeconds(DEFAULT_REST);
      setRestTrigger((t) => t + 1);
    }
    if (isLastSet && activeIdx < dayExercises.length - 1) setActiveIdx(activeIdx + 1);
  };

  const handleFinish = () => {
    const totalSets = Object.values(setsDone).reduce((n, e) => n + e.sets_completed, 0);
    toast.success(`Quick workout done! ${totalSets} sets in ${fmt(elapsed)}`, { icon: '💪' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      <header className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X size={22} className="text-zinc-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Quick Workout</h1>
            <p className="text-xs text-zinc-500">{dayExercises.length} exercises · not saved to a plan</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full font-mono font-medium">
            <Clock size={16} />
            {fmt(elapsed)}
          </div>
          <button
            onClick={handleFinish}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full font-medium transition-colors"
          >
            <CheckCircle size={18} /> Finish
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-4 pb-24">
          {dayExercises.map((ex, idx) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              completedSets={setsDone[ex.exercise_id]?.sets_completed || 0}
              logEntry={setsDone[ex.exercise_id]}
              isActive={activeIdx === idx}
              onLogSet={(setNum, weight, reps) => handleLogSet(ex.exercise_id, setNum, weight, reps)}
            />
          ))}
        </div>
      </div>

      <RestTimer seconds={restSeconds} triggerKey={restTrigger} />
    </div>
  );
}
