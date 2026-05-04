'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, X, CheckCircle } from 'lucide-react';
import { ExerciseCard } from './ExerciseCard';
import type { WorkoutDayRow, WorkoutDayExerciseRow } from '@/types/fitness';
import { toast } from 'react-hot-toast';

interface SessionViewProps {
  sessionId: string;
  workoutDay: WorkoutDayRow & { workout_day_exercises: (WorkoutDayExerciseRow & { exercises: any })[] };
  initialSetsDone: Record<string, { sets_completed: number; weights_used: number[] }>;
  onClose: () => void;
  onComplete: () => void;
}

export function SessionView({ sessionId, workoutDay, initialSetsDone, onClose, onComplete }: SessionViewProps) {
  const [setsDone, setSetsDone] = useState(initialSetsDone || {});
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogSet = async (exerciseId: string, setNum: number, weight: number | null) => {
    try {
      const res = await fetch(`/api/fitness/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'log_set', exercise_id: exerciseId, set_number: setNum, weight_used: weight })
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error);

      const newSetsDone = { ...setsDone };
      if (!newSetsDone[exerciseId]) newSetsDone[exerciseId] = { sets_completed: 0, weights_used: [] };
      newSetsDone[exerciseId].sets_completed = setNum;
      if (weight !== null) newSetsDone[exerciseId].weights_used.push(weight);
      
      setSetsDone(newSetsDone);
      toast.success(`Set ${setNum} logged! +3 XP`, { icon: '🔥' });

      // Auto-advance if exercise is fully complete
      const exercise = workoutDay.workout_day_exercises.find(e => e.exercise_id === exerciseId);
      if (exercise && setNum >= exercise.sets) {
        if (activeExerciseIdx < workoutDay.workout_day_exercises.length - 1) {
          setActiveExerciseIdx(activeExerciseIdx + 1);
        }
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to log set');
    }
  };

  const handleFinishSession = async () => {
    setIsFinishing(true);
    try {
      const res = await fetch(`/api/fitness/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_session' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`Workout Complete! +${json.data.totalXp} XP`);
      if (json.data.badgesAwarded?.length > 0) {
        toast.success(`Unlocked ${json.data.badgesAwarded.length} badges!`, { icon: '🏆' });
      }
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to finish session');
      setIsFinishing(false);
    }
  };

  // Sort exercises by order_index
  const exercises = [...workoutDay.workout_day_exercises].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex items-center justify-between bg-dark-surface">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{workoutDay.name}</h1>
            <p className="text-sm text-gray-400">{workoutDay.muscle_groups.join(', ')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-full font-mono font-medium">
            <Clock size={16} />
            {formatTime(elapsedSeconds)}
          </div>
          
          <button 
            onClick={handleFinishSession}
            disabled={isFinishing}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-50"
          >
            {isFinishing ? 'Finishing...' : <><CheckCircle size={18} /> Finish Workout</>}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-4 pb-24">
          {exercises.map((ex, idx) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              completedSets={setsDone[ex.exercise_id]?.sets_completed || 0}
              isActive={activeExerciseIdx === idx}
              onLogSet={(setNum, weight) => handleLogSet(ex.exercise_id, setNum, weight)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
