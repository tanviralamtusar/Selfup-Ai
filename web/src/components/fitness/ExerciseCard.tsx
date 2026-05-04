'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Check, ChevronDown, ChevronUp, Video } from 'lucide-react';
import type { WorkoutDayExerciseRow } from '@/types/fitness';

interface ExerciseCardProps {
  exercise: WorkoutDayExerciseRow;
  completedSets: number;
  onLogSet: (setNum: number, weight: number | null) => void;
  isActive: boolean;
}

export function ExerciseCard({ exercise, completedSets, onLogSet, isActive }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [weightInput, setWeightInput] = useState<string>('');

  const targetSets = exercise.sets;
  const isFullyComplete = completedSets >= targetSets;

  return (
    <motion.div 
      layout
      className={`bg-dark-surface/50 backdrop-blur-md rounded-xl border transition-all duration-300 ${
        isActive ? 'border-primary-500/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]' : 'border-white/5'
      } ${isFullyComplete ? 'opacity-60' : 'opacity-100'}`}
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isFullyComplete ? 'bg-green-500/20 text-green-400' : 'bg-primary-500/20 text-primary-400'
          }`}>
            {isFullyComplete ? <Check size={20} /> : <Play size={20} className="ml-1" />}
          </div>
          <div>
            <h3 className="text-white font-medium">{exercise.exercises?.name || 'Exercise'}</h3>
            <p className="text-sm text-gray-400">
              {targetSets} Sets × {exercise.reps} • {exercise.rest_seconds}s Rest
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm font-medium text-white">{completedSets} / {targetSets}</span>
            <span className="text-xs text-gray-500 block">Sets Done</span>
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/5">
              {exercise.exercises?.video_url && (
                <div className="mb-4 aspect-video rounded-lg overflow-hidden bg-black/50 relative group cursor-pointer">
                   {/* Simplified video placeholder for now, would use an iframe or video tag */}
                   <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/40 transition-colors">
                     <Video size={32} className="text-white/70" />
                   </div>
                </div>
              )}
              
              {exercise.notes && (
                <div className="mb-4 text-sm text-gray-400 bg-white/5 p-3 rounded-lg">
                  💡 {exercise.notes}
                </div>
              )}

              <div className="space-y-2">
                {Array.from({ length: targetSets }).map((_, idx) => {
                  const setNum = idx + 1;
                  const isSetDone = completedSets >= setNum;
                  const isCurrentSet = completedSets === idx;

                  return (
                    <div key={setNum} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isCurrentSet ? 'border-primary-500/30 bg-primary-500/5' : 'border-white/5 bg-white/5'
                    }`}>
                      <span className="text-sm font-medium text-gray-300">Set {setNum}</span>
                      
                      {isSetDone ? (
                        <div className="flex items-center text-green-400 text-sm gap-2">
                          <Check size={16} /> Completed
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <input 
                            type="number"
                            placeholder="kg/lbs (opt)"
                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm w-24 text-white focus:outline-none focus:border-primary-500"
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            disabled={!isCurrentSet}
                          />
                          <button
                            onClick={() => {
                              onLogSet(setNum, weightInput ? parseFloat(weightInput) : null);
                              setWeightInput('');
                            }}
                            disabled={!isCurrentSet}
                            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                              isCurrentSet 
                                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                                : 'bg-white/5 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Log
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
