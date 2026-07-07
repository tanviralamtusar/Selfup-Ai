'use client';

// ═══════════════════════════════════════════════════════════
// Workout Builder — 3-step stepper ported from workout-cool
// (muscles → equipment → exercises → quick session), restyled
// to the app's dark theme. Replaces the flat exercises browser.
// ═══════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import MuscleMap from '../muscle-map/MuscleMap';
import {
  MuscleValue,
  MUSCLE_LABELS,
  MUSCLE_TO_PRIMARY,
  MUSCLE_TO_GROUP,
  primaryMusclesFor,
  groupsFor,
} from '../muscle-map/muscleTypes';
import { StepperHeader, StepDef } from './StepperHeader';
import { EquipmentSelection } from './EquipmentSelection';
import { ExercisesSelection, MuscleGroupSelection } from './ExercisesSelection';
import { equipmentDbValues, type BuilderExercise } from './builderTypes';
import { QuickSession } from './QuickSession';

const STEPS: StepDef[] = [
  { number: 1, title: 'Muscles', description: 'Pick what to train' },
  { number: 2, title: 'Equipment', description: 'What you have' },
  { number: 3, title: 'Exercises', description: 'Your workout' },
];

const DEFAULT_PER_MUSCLE = 2;

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return yt ? `https://www.youtube.com/embed/${yt[1]}` : url;
}

// Does an exercise belong to a given diagram muscle?
function matchesMuscle(ex: BuilderExercise, muscle: MuscleValue): boolean {
  const primary = ex.primary_muscle?.toLowerCase();
  if (primary && MUSCLE_TO_PRIMARY[muscle].includes(primary)) return true;
  if (!primary && ex.muscle_group === MUSCLE_TO_GROUP[muscle]) return true;
  return false;
}

export default function WorkoutBuilder() {
  const { session } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleValue[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [pool, setPool] = useState<Record<string, BuilderExercise[]>>({}); // muscle → all matches
  const [selection, setSelection] = useState<Record<string, string[]>>({}); // muscle → chosen ids
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const toggleMuscle = (m: MuscleValue) =>
    setSelectedMuscles((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  const toggleEquipment = (v: string) =>
    setSelectedEquipment((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  // Fetch exercises for the chosen muscles + equipment, then build the pool + default picks.
  const buildWorkout = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('primary_muscle', primaryMusclesFor(selectedMuscles).join(','));
      params.set('muscle_group', groupsFor(selectedMuscles).join(','));
      const eq = equipmentDbValues(selectedEquipment);
      if (eq.length) params.set('equipment', eq.join(','));

      const res = await fetch(`/api/fitness/exercises?${params.toString()}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      const data: BuilderExercise[] = await res.json();
      const list = Array.isArray(data) ? data : [];

      const nextPool: Record<string, BuilderExercise[]> = {};
      const nextSel: Record<string, string[]> = {};
      for (const m of selectedMuscles) {
        const matches = list.filter((ex) => matchesMuscle(ex, m));
        // shuffle a copy for variety
        const shuffled = [...matches].sort(() => Math.random() - 0.5);
        nextPool[m] = shuffled;
        nextSel[m] = shuffled.slice(0, DEFAULT_PER_MUSCLE).map((e) => e.id);
      }
      setPool(nextPool);
      setSelection(nextSel);
    } catch {
      setPool({});
      setSelection({});
    } finally {
      setLoading(false);
    }
  }, [selectedMuscles, selectedEquipment, session?.access_token]);

  const goNext = () => {
    if (step === 2) buildWorkout();
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // ── exercise list handlers ──
  const shuffleOne = (muscle: MuscleValue, exId: string) => {
    setSelection((prev) => {
      const chosen = prev[muscle] ?? [];
      const unused = (pool[muscle] ?? []).find((e) => !chosen.includes(e.id));
      if (!unused) return prev;
      return { ...prev, [muscle]: chosen.map((id) => (id === exId ? unused.id : id)) };
    });
  };
  const removeOne = (muscle: MuscleValue, exId: string) =>
    setSelection((prev) => ({ ...prev, [muscle]: (prev[muscle] ?? []).filter((id) => id !== exId) }));
  const addOne = (muscle: MuscleValue) =>
    setSelection((prev) => {
      const chosen = prev[muscle] ?? [];
      const unused = (pool[muscle] ?? []).find((e) => !chosen.includes(e.id));
      return unused ? { ...prev, [muscle]: [...chosen, unused.id] } : prev;
    });

  // Build the grouped selection for rendering.
  const byId = new Map<string, BuilderExercise>();
  Object.values(pool).forEach((arr) => arr.forEach((e) => byId.set(e.id, e)));
  const groups: MuscleGroupSelection[] = selectedMuscles
    .map((m) => ({
      muscle: m,
      exercises: (selection[m] ?? []).map((id) => byId.get(id)).filter(Boolean) as BuilderExercise[],
      poolSize: (pool[m] ?? []).length,
    }))
    .filter((g) => g.poolSize > 0);

  const flatSelected = groups.flatMap((g) => g.exercises);
  const canContinue = step === 1 ? selectedMuscles.length > 0 : true;

  // Quick session mode (terminal step) reuses the selected exercises locally.
  if (started) {
    return <QuickSession exercises={flatSelected} onClose={() => setStarted(false)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <StepperHeader steps={STEPS} currentStep={step} onStepClick={(n) => setStep(n)} />

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 min-h-[380px]">
        {/* Step 1 — muscles */}
        {step === 1 && (
          <div className="flex flex-col items-center">
            <MuscleMap
              selectedMuscles={selectedMuscles}
              onToggleMuscle={toggleMuscle}
              className="w-full max-w-[300px]"
            />
            {selectedMuscles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {selectedMuscles.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleMuscle(m)}
                    className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full px-2.5 py-1 hover:bg-blue-500/25 transition-colors"
                  >
                    {MUSCLE_LABELS[m]}
                    <X size={11} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 mt-3">Tap muscles on the body to train them</p>
            )}
          </div>
        )}

        {/* Step 2 — equipment */}
        {step === 2 && <EquipmentSelection selected={selectedEquipment} onToggle={toggleEquipment} />}

        {/* Step 3 — exercises */}
        {step === 3 && (
          <ExercisesSelection
            loading={loading}
            groups={groups}
            onShuffle={shuffleOne}
            onRemove={removeOne}
            onAdd={addOne}
            onPreview={setVideoUrl}
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3 mt-4">
        <button
          onClick={goBack}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {step < 3 ? (
          <button
            onClick={goNext}
            disabled={!canContinue}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={buildWorkout}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
              title="Regenerate"
            >
              <RotateCcw size={15} /> Reshuffle
            </button>
            <button
              onClick={() => setStarted(true)}
              disabled={flatSelected.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={16} /> Start Workout
            </button>
          </div>
        )}
      </div>

      {/* Video preview modal */}
      {videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoUrl(null)}>
          <div className="relative w-full max-w-2xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setVideoUrl(null)} className="absolute -top-9 right-0 text-zinc-400 hover:text-white">
              <X size={22} />
            </button>
            <iframe
              src={toEmbedUrl(videoUrl)}
              className="w-full h-full rounded-lg border border-zinc-700"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
