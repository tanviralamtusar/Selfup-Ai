'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Info } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
}

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
}

const ExercisePicker: React.FC<ExercisePickerProps> = ({ onSelect, selectedIds = [] }) => {
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/fitness/exercises?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setExercises(data);
      } catch (err) {
        console.error('Failed to fetch exercises', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-zinc-950 border border-border rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search exercises (e.g. Bench Press, Squat)..."
            className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading && exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground  animate-pulse">
            Searching Library...
          </div>
        ) : exercises.length > 0 ? (
          exercises.map((ex) => {
            const isSelected = selectedIds.includes(ex.id);
            return (
              <div
                key={ex.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                  isSelected 
                    ? 'bg-primary/10 border border-border' 
                    : 'hover:bg-muted/80 border border-transparent'
                }`}
              >
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-primary">
                    {ex.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 flex gap-2 mt-0.5">
                    <span className="uppercase">{ex.muscle_group}</span>
                    <span>•</span>
                    <span className="capitalize">{ex.equipment}</span>
                  </p>
                </div>
                
                <button
                  onClick={() => !isSelected && onSelect(ex)}
                  disabled={isSelected}
                  className={`p-1.5 rounded-md transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-background text-zinc-400 hover:bg-primary hover:text-white'
                  }`}
                >
                  {isSelected ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No exercises found.
          </div>
        )}
      </div>

      <div className="p-3 bg-muted/30 border-t border-border text-[10px] text-zinc-500 flex items-center gap-2">
        <Info size={12} />
        <span>Select exercises to add them to your current workout day.</span>
      </div>
    </div>
  );
};

export default ExercisePicker;
