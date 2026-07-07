'use client';

// Exercise list grouped by muscle with shuffle / remove / video preview
// (workout-cool step 3, dark themed). Drag-reorder omitted (no @dnd-kit).
import React from 'react';
import { Shuffle, Trash2, PlayCircle, Dumbbell, Loader2, Plus } from 'lucide-react';
import { MuscleValue, MUSCLE_LABELS } from '../muscle-map/muscleTypes';
import type { BuilderExercise } from './builderTypes';

export interface MuscleGroupSelection {
  muscle: MuscleValue;
  exercises: BuilderExercise[];
  poolSize: number;
}

interface ExercisesSelectionProps {
  loading: boolean;
  groups: MuscleGroupSelection[];
  onShuffle: (muscle: MuscleValue, exerciseId: string) => void;
  onRemove: (muscle: MuscleValue, exerciseId: string) => void;
  onAdd: (muscle: MuscleValue) => void;
  onPreview: (url: string) => void;
}

export function ExercisesSelection({
  loading,
  groups,
  onShuffle,
  onRemove,
  onAdd,
  onPreview,
}: ExercisesSelectionProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Building your workout…
      </div>
    );
  }

  const total = groups.reduce((n, g) => n + g.exercises.length, 0);

  if (total === 0) {
    return (
      <div className="py-16 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
        No exercises match those muscles + equipment. Try adding equipment or muscles.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-center text-[11px] uppercase tracking-wide text-zinc-500">
        {total} exercises · {groups.length} muscle groups
      </p>

      {groups.map((group) => (
        <div key={group.muscle}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-blue-400">
              {MUSCLE_LABELS[group.muscle]}
            </h3>
            {group.exercises.length < group.poolSize && (
              <button
                onClick={() => onAdd(group.muscle)}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase text-zinc-400 hover:text-blue-400 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          <div className="space-y-2">
            {group.exercises.map((ex) => {
              const thumb = ex.image_urls?.[0];
              return (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={ex.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dumbbell size={16} className="text-zinc-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white truncate">{ex.name}</h4>
                    <p className="text-[11px] text-zinc-500 flex gap-1.5">
                      <span className="uppercase">{ex.primary_muscle || ex.muscle_group}</span>
                      {ex.equipment && ex.equipment !== 'none' && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{ex.equipment}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {ex.video_url && (
                    <button
                      onClick={() => onPreview(ex.video_url!)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-all"
                      title="Preview"
                    >
                      <PlayCircle size={17} />
                    </button>
                  )}
                  <button
                    onClick={() => onShuffle(group.muscle, ex.id)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-all"
                    title="Swap for another"
                  >
                    <Shuffle size={16} />
                  </button>
                  <button
                    onClick={() => onRemove(group.muscle, ex.id)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-all"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
