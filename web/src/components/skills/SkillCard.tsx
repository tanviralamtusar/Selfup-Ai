'use client'

import { motion } from 'framer-motion'
import { Brain, ChevronRight, TrendingUp, Clock, Zap, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillCardProps {
  skill: {
    id: string
    name: string
    category: string
    current_level: string
    total_hours: number
    activeRoadmap?: {
      id: string
      title: string
      status: string
      plan_type: string
      difficulty: string
      daily_study_minutes: number
    } | null
    milestoneStats: {
      completed: number
      total: number
      progress: number
    }
  }
  isActive?: boolean
  onClick: () => void
}

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/10 border-green-500/20',
  intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  advanced: 'text-red-400 bg-red-500/10 border-red-500/20',
}

const planTypeLabels: Record<string, string> = {
  crash_course: 'Crash Course',
  standard: 'Standard',
  deep_dive: 'Deep Dive',
}

export function SkillCard({ skill, isActive, onClick }: SkillCardProps) {
  const { progress, completed, total } = skill.milestoneStats
  const roadmap = skill.activeRoadmap
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full text-left bg-card border rounded-xl p-6 transition-all group relative overflow-hidden ",
        isActive 
          ? "border-border bg-primary/10 " 
          : "border-border hover:bg-card"
      )}
    >
      {/* Background Icon/Glow */}
      <div className="absolute -top-4 -right-4 text-6xl opacity-[0.03] text-primary select-none pointer-events-none group-hover:scale-110 transition-transform">
        <Brain size={80} />
      </div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none opacity-50" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-border ">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-lg  font-headline text-foreground ">{skill.name}</h3>
            <p className="text-[10px]  text-primary/40  ">{skill.category || 'General'} Module</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px]  text-primary   px-2 py-1 bg-primary/10 rounded-lg border border-border ">
            {skill.current_level}
          </span>
          {roadmap && (
            <span className={cn(
              "text-[8px]    px-2 py-0.5 rounded border",
              difficultyColors[roadmap.difficulty] || 'text-primary bg-primary/10 border-border'
            )}>
              {planTypeLabels[roadmap.plan_type] || roadmap.plan_type}
            </span>
          )}
        </div>
      </div>

      {/* Roadmap Quick Info */}
      {roadmap && (
        <div className="mt-4 flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-1 text-[9px]    text-[#5db8a0]/60">
            <BookOpen size={10} />
            <span>{roadmap.title}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px]    text-primary/40">
            <Zap size={10} />
            <span>{roadmap.daily_study_minutes}m/day</span>
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="mt-6 space-y-4 relative z-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-primary/40  ">
                <TrendingUp size={14} className="text-[#5db8a0]" />
                <span className="text-[10px]">Progress</span>
             </div>
             <p className="text-xs  text-foreground ">{completed} / {total} Milestones Done</p>
          </div>
          <p className="text-2xl  font-headline  text-primary">
            {progress.toFixed(0)}%
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden border border-border">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full ",
              progress >= 100 ? "bg-[#5db8a0]" : "bg-primary"
            )}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-6 border-t border-border flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-primary/40">
            <Clock size={12} />
            <span className="text-[10px]   ">{Number(skill.total_hours || 0).toFixed(1)}h Studied</span>
          </div>
        </div>
        <ChevronRight size={16} className={cn(
          "transition-all",
          isActive ? "text-primary translate-x-1" : "text-primary/20 group-hover:text-primary group-hover:translate-x-1"
        )} />
      </div>
    </motion.button>
  )
}
