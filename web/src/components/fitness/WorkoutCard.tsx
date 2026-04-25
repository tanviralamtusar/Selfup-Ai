'use client';

import React from 'react';
import { Dumbbell, Calendar, ChevronRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  goal: string;
  days_per_week: number;
}

interface WorkoutCardProps {
  plan: WorkoutPlan;
  isActive?: boolean;
  onSelect?: (id: string) => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ plan, isActive, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative overflow-hidden group rounded-xl p-6 border cursor-pointer transition-all duration-500 italic",
        isActive 
          ? "bg-slate-950 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
          : "bg-slate-950/40 border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-900/10"
      )}
      onClick={() => onSelect?.(plan.id)}
    >
      {/* Scanline Effect for Active Card */}
      {isActive && <div className="absolute inset-0 scanline pointer-events-none opacity-10" />}
      
      {/* Glow Effect */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 blur-[80px] rounded-full pointer-events-none transition-opacity duration-500",
        isActive ? "bg-blue-500/20 opacity-100" : "bg-blue-500/10 opacity-0 group-hover:opacity-100"
      )} />

      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "p-3 rounded-lg border transition-all duration-500",
          isActive ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-blue-500/5 border-blue-500/10 text-blue-500/40 group-hover:text-blue-400 group-hover:border-blue-500/30"
        )}>
          <Dumbbell size={22} />
        </div>
        <div className="flex gap-3">
          <span className="px-3 py-1 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-slate-950 border border-blue-500/20 text-blue-500/60 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
            {plan.difficulty}
          </span>
          {isActive && (
            <span className="px-3 py-1 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-blue-500/20 text-blue-300 border border-blue-400/30 animate-pulse">
              Active
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-black text-blue-50 mb-2 group-hover:text-blue-300 transition-colors uppercase tracking-[0.2em] system-text-glow">
        {plan.name}
      </h3>
      <p className="text-[11px] text-blue-500/40 line-clamp-2 mb-6 leading-relaxed font-bold">
        {plan.description || 'System-generated physical vessel optimization protocol.'}
      </p>

      <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/30">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-blue-500/40" />
          <span>{plan.days_per_week} PHASES / WEEK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-blue-500/40" />
          <span className="text-blue-400/60">{plan.goal.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        {isActive ? (
          <button className="flex items-center gap-3 px-6 py-3 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400 hover:scale-105 transition-all">
            <Play size={14} fill="currentColor" />
            Resume Protocol
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500/40 uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">
            Protocol Details <ChevronRight size={14} />
          </div>
        )}
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-500/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-500/20" />
    </motion.div>
  );
};

export default WorkoutCard;
