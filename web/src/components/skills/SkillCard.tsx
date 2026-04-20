'use client'

import { motion } from 'framer-motion'
import { Brain, ChevronRight, TrendingUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillCardProps {
  skill: {
    id: string
    name: string
    category: string
    current_level: string
    total_hours: number
    milestoneStats: {
      completed: number
      total: number
      progress: number
    }
  }
  onClick: () => void
}

export function SkillCard({ skill, onClick }: SkillCardProps) {
  const { progress, completed, total } = skill.milestoneStats
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 hover:bg-surface-container-medium transition-all group relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 blur-[60px] group-hover:bg-primary/20 transition-all rounded-full" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_20px_rgba(174,162,255,0.1)]">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black font-headline tracking-tight text-on-surface">{skill.name}</h3>
            <p className="text-[10px] font-black uppercase text-on-surface-variant/40 tracking-widest">{skill.category || 'General'}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest px-2 py-1 bg-primary/10 rounded-lg border border-primary/20">
            {skill.current_level}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-8 space-y-4 relative z-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-on-surface-variant/60 font-black">
                <TrendingUp size={14} className="text-secondary" />
                <span className="text-[10px] uppercase tracking-widest">Milestones</span>
             </div>
             <p className="text-xs font-black text-on-surface">{completed} / {total} Completed</p>
          </div>
          <p className="text-2xl font-black font-headline italic tracking-tighter text-primary">
            {progress.toFixed(0)}%
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient shadow-[0_0_10px_rgba(174,162,255,0.3)]"
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-6 border-t border-outline-variant/10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-on-surface-variant/60">
            <Clock size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">{Number(skill.total_hours || 0).toFixed(1)}h logged</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-on-surface-variant/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </motion.button>
  )
}
