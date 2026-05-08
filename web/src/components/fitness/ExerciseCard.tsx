'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Check, ChevronDown, ChevronUp, Video, ExternalLink, Loader2 } from 'lucide-react';
import type { WorkoutDayExerciseRow } from '@/types/fitness';
import { useYoutubeSearch } from '@/lib/hooks/useYoutubeSearch';

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

interface ExerciseCardProps {
  exercise: WorkoutDayExerciseRow;
  completedSets: number;
  onLogSet: (setNum: number, weight: number | null) => void;
  isActive: boolean;
}

export function ExerciseCard({ exercise, completedSets, onLogSet, isActive }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [weightInput, setWeightInput] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const exerciseName = exercise.exercises?.name || 'Exercise';
  const { data: suggestions, isLoading: isLoadingVideos } = useYoutubeSearch(showSuggestions ? exerciseName : undefined);

  const targetSets = exercise.sets;
  const isFullyComplete = completedSets >= targetSets;

  return (
    <motion.div 
      layout
      className={`bg-slate-900/40 backdrop-blur-md rounded-2xl border transition-all duration-300 ${
        isActive ? 'border-primary-500/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]' : 'border-white/5'
      } ${isFullyComplete ? 'opacity-60' : 'opacity-100'}`}
    >
      <div 
        className="p-5 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            isFullyComplete ? 'bg-green-500/20 text-green-400' : 'bg-primary-500/20 text-primary-400 group-hover:bg-primary-500/30'
          }`}>
            {isFullyComplete ? <Check size={24} /> : <Play size={24} className="ml-1" />}
          </div>
          <div>
            <h3 className="text-blue-50 font-black uppercase tracking-wider text-base">{exerciseName}</h3>
            <p className="text-sm text-gray-400 font-medium">
              {targetSets} Sets × {exercise.reps} • {exercise.rest_seconds}s Rest
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-base font-black text-blue-50">{completedSets} / {targetSets}</span>
            <span className="text-[10px] text-blue-500/40 uppercase font-black tracking-widest block">Sets Done</span>
          </div>
          {isExpanded ? <ChevronUp size={24} className="text-gray-500" /> : <ChevronDown size={24} className="text-gray-500" />}
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
            <div className="p-5 pt-0 border-t border-white/5 space-y-6">
              {/* Video Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/40 italic">Form Reference</h4>
                  {!exercise.exercises?.video_url && !showSuggestions && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSuggestions(true); }}
                      className="text-[10px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-300 flex items-center gap-2 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20 transition-all"
                    >
                      <Video size={12} /> Suggest Videos
                    </button>
                  )}
                </div>

                {exercise.exercises?.video_url ? (
                  (() => {
                    const ytId = getYoutubeId(exercise.exercises.video_url);
                    if (ytId) {
                      return (
                        <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg border border-white/10">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title="YouTube video player"
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      );
                    }
                    return (
                      <a href={exercise.exercises.video_url} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="aspect-video rounded-xl overflow-hidden bg-black/50 relative group cursor-pointer border border-white/5 hover:border-primary-500/30 transition-all shadow-lg">
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 group-hover:bg-black/40 transition-colors">
                            <ExternalLink size={48} className="text-white/70 group-hover:scale-110 transition-transform mb-4" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50">Open External Video</span>
                          </div>
                        </div>
                      </a>
                    );
                  })()
                ) : showSuggestions ? (
                  <div className="space-y-3">
                    {isLoadingVideos ? (
                      <div className="h-24 flex items-center justify-center bg-white/5 rounded-xl border border-dashed border-white/10">
                        <Loader2 size={24} className="text-primary-500 animate-spin" />
                      </div>
                    ) : suggestions && suggestions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {suggestions.map((video) => (
                          <a 
                            key={video.id}
                            href={video.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 rounded-lg overflow-hidden border border-white/5 hover:border-primary-500/30 transition-all group/video"
                          >
                            <div className="aspect-video relative overflow-hidden">
                              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover/video:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-black/40 group-hover/video:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/video:opacity-100">
                                <ExternalLink size={16} className="text-white" />
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-[10px] font-bold text-blue-50 line-clamp-1 leading-tight mb-1">{video.title}</p>
                              <p className="text-[8px] font-black uppercase tracking-tighter text-blue-500/40 italic">{video.channelTitle}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/20 italic">No suggestions found</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-blue-500/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/20 italic">No internal protocol footage available</p>
                  </div>
                )}
              </div>
              
              {(exercise.technique_note || exercise.weight_note) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/40 italic">Protocol Instructions</h4>
                  <div className="text-[13px] text-blue-300/80 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 italic font-medium leading-relaxed space-y-2">
                    {exercise.technique_note && (
                      <p>
                        <span className="text-primary-400 font-black not-italic mr-2">TECHNIQUE:</span>
                        {exercise.technique_note}
                      </p>
                    )}
                    {exercise.weight_note && (
                      <p>
                        <span className="text-blue-400 font-black not-italic mr-2">WEIGHT RECOMMENDATION:</span>
                        {exercise.weight_note}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/40 italic mb-1">Set Log</h4>
                {Array.from({ length: targetSets }).map((_, idx) => {
                  const setNum = idx + 1;
                  const isSetDone = completedSets >= setNum;
                  const isCurrentSet = completedSets === idx;

                  return (
                    <div key={setNum} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isCurrentSet 
                        ? 'border-primary-500/40 bg-primary-500/10 shadow-[inset_0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                        : 'border-white/5 bg-white/[0.02]'
                    }`}>
                      <span className="text-sm font-black text-blue-50/60 uppercase tracking-widest italic">Set {setNum}</span>
                      
                      {isSetDone ? (
                        <div className="flex items-center text-green-400 text-xs font-black uppercase tracking-widest gap-2">
                          <Check size={18} /> Recorded
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input 
                              type="number"
                              placeholder="WEIGHT"
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs w-24 text-white focus:outline-none focus:border-primary-500/50 transition-all font-black uppercase tracking-tighter"
                              value={weightInput}
                              onChange={(e) => setWeightInput(e.target.value)}
                              disabled={!isCurrentSet}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-blue-500/20">KG</span>
                          </div>
                          <button
                            onClick={() => {
                              onLogSet(setNum, weightInput ? parseFloat(weightInput) : null);
                              setWeightInput('');
                            }}
                            disabled={!isCurrentSet}
                            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                              isCurrentSet 
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20 hover:bg-primary-500 hover:scale-105 active:scale-95' 
                                : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50'
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

