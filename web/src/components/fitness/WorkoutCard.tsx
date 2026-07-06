'use client';

import React from 'react';
import { Dumbbell, Calendar, ChevronRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  currentDayId?: string;
  onSelect?: (id: string) => void;
}

import Link from 'next/link';

const WorkoutCard: React.FC<WorkoutCardProps> = ({ plan, isActive, currentDayId, onSelect }) => {
  const resumeUrl = currentDayId ? `/fitness/session/${currentDayId}` : undefined;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative overflow-hidden group rounded-xl p-6 border cursor-pointer transition-all duration-500 ",
        isActive 
          ? "bg-background border-border " 
          : "bg-card border-border hover:border-border hover:bg-muted"
      )}
      onClick={() => onSelect?.(plan.id)}
    >
      {/* ... scanline and glow code ... */}
      {isActive && <div className="absolute inset-0 scanline pointer-events-none opacity-10" />}
      
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 blur-[80px] rounded-full pointer-events-none transition-opacity duration-500",
        isActive ? "bg-primary/15 opacity-100" : "bg-primary/10 opacity-0 group-hover:opacity-100"
      )} />

      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "p-3 rounded-lg border transition-all duration-500",
          isActive ? "bg-primary/15 border-border text-primary/80" : "bg-muted border-border text-muted-foreground group-hover:text-primary group-hover:border-border"
        )}>
          <Dumbbell size={22} />
        </div>
        <div className="flex gap-3">
          <span className="px-3 py-1.5 rounded text-[10px]   bg-background border border-border text-primary/80 ">
            {plan.difficulty}
          </span>
          {isActive && (
            <span className="px-3 py-1.5 rounded text-[10px]   bg-primary/15 text-primary/80 border border-border animate-pulse">
              Active
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl  text-foreground mb-2 group-hover:text-primary/80 transition-colors ">
        {plan.name}
      </h3>
      <p className="text-[13px] text-primary/60 line-clamp-2 mb-6 leading-relaxed font-medium ">
        {plan.description || 'AI-generated fitness plan.'}
      </p>

      <div className="flex items-center gap-6 text-[10px]   text-primary/40">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary/50" />
          <span>{plan.days_per_week} DAYS / WEEK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 " />
          <span className="text-primary/80">{plan.goal.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        {isActive ? (
          resumeUrl ? (
            <Link 
              href={resumeUrl}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-xs    border border-primary/30 hover:scale-105 transition-all"
            >
              <Play size={16} fill="currentColor" />
              Continue Workout
            </Link>
          ) : (
            <button className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-primary/50 text-primary-foreground/50 text-xs   border border-border cursor-not-allowed">
              <Play size={16} fill="currentColor" />
              Next Workout Scheduled
            </button>
          )
        ) : (
          <div className="flex items-center gap-2 text-xs  text-primary/40  group-hover:text-primary/80 transition-colors ">
            Plan Details <ChevronRight size={16} />
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default WorkoutCard;
