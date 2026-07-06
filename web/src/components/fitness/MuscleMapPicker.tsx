'use client';

// ═══════════════════════════════════════════════════════════
// Muscle-map exercise picker (workout-cool port, phase 2)
// Interactive body diagram → live-filtered exercise list.
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Check, PlayCircle, X, Dumbbell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import MuscleMap from './muscle-map/MuscleMap';
import {
  MuscleValue,
  MUSCLE_LABELS,
  primaryMusclesFor,
  groupsFor,
} from './muscle-map/muscleTypes';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  difficulty: string | null;
  primary_muscle?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
}

interface MuscleMapPickerProps {
  onSelect?: (exercise: Exercise) => void;
  selectedIds?: string[];
}

export default function MuscleMapPicker({ onSelect, selectedIds = [] }: MuscleMapPickerProps) {
  const { session } = useAuthStore();
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleValue[]>([]);
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const toggleMuscle = (muscle: MuscleValue) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  // Build the querystring from selected muscles + free-text search.
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedMuscles.length) {
      params.set('primary_muscle', primaryMusclesFor(selectedMuscles).join(','));
      params.set('muscle_group', groupsFor(selectedMuscles).join(','));
    }
    return params.toString();
  }, [query, selectedMuscles]);

  useEffect(() => {
    // Nothing selected and no search → show nothing (avoid dumping 800 rows).
    if (!queryString) {
      setExercises([]);
      return;
    }
    let cancelled = false;
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/fitness/exercises?${queryString}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        });
        const data = await res.json();
        if (!cancelled) setExercises(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch exercises', err);
        if (!cancelled) setExercises([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = setTimeout(fetchExercises, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [queryString, session?.access_token]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Body diagram */}
      <div className="lg:w-[38%] flex flex-col items-center bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <MuscleMap
          selectedMuscles={selectedMuscles}
          onToggleMuscle={toggleMuscle}
          className="w-full max-w-[320px] mx-auto"
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
          <p className="text-[11px] text-zinc-500 mt-3 text-center">
            Tap a muscle to find exercises
          </p>
        )}
      </div>

      {/* Exercise list */}
      <div className="flex-1 flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden min-h-[400px]">
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search exercises…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading && exercises.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-zinc-600 italic animate-pulse">
              Searching…
            </div>
          ) : exercises.length > 0 ? (
            exercises.map((ex) => {
              const isSelected = selectedIds.includes(ex.id);
              const thumb = ex.image_urls?.[0];
              return (
                <div
                  key={ex.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'border-transparent hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="w-11 h-11 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={ex.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dumbbell size={16} className="text-zinc-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white truncate">{ex.name}</h4>
                    <p className="text-[11px] text-zinc-500 flex gap-1.5 mt-0.5">
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
                      onClick={() => setVideoUrl(ex.video_url!)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-all"
                      title="Preview"
                    >
                      <PlayCircle size={17} />
                    </button>
                  )}

                  {onSelect && (
                    <button
                      onClick={() => !isSelected && onSelect(ex)}
                      disabled={isSelected}
                      className={`p-1.5 rounded-md transition-all shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {isSelected ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-zinc-600 text-sm">
              {selectedMuscles.length || query ? 'No exercises found.' : 'Select a muscle or search to begin.'}
            </div>
          )}
        </div>
      </div>

      {/* Video preview modal */}
      {videoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setVideoUrl(null)}
        >
          <div className="relative w-full max-w-2xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setVideoUrl(null)}
              className="absolute -top-9 right-0 text-zinc-400 hover:text-white"
            >
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

// Convert a YouTube watch URL to an embeddable one; pass others through.
function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return yt ? `https://www.youtube.com/embed/${yt[1]}` : url;
}
