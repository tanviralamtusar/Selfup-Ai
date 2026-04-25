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
      className="w-full text-left bg-slate-950/40 border border-blue-500/20 rounded-3xl p-6 hover:bg-slate-950/60 transition-all group relative overflow-hidden backdrop-blur-md"
    >
      {/* Background Icon/Glow */}
      <div className="absolute -top-4 -right-4 text-6xl opacity-[0.03] text-blue-400 select-none pointer-events-none group-hover:scale-110 transition-transform">
        <Brain size={80} />
      </div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-50" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black font-headline text-blue-100 tracking-wider uppercase italic">{skill.name}</h3>
            <p className="text-[10px] font-black uppercase text-blue-400/40 tracking-[0.2em] italic">{skill.category || 'General'} Module</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em] italic px-2 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            RANK: {skill.current_level}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-8 space-y-4 relative z-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-blue-400/40 font-black italic tracking-widest uppercase">
                <TrendingUp size={14} className="text-cyan-400" />
                <span className="text-[10px]">Registry Trace</span>
             </div>
             <p className="text-xs font-black text-blue-100 italic">{completed} / {total} Protocols Synchronized</p>
          </div>
          <p className="text-2xl font-black font-headline italic tracking-widest text-blue-400 system-text-glow">
            {progress.toFixed(0)}%
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="h-2 w-full bg-blue-500/10 rounded-full overflow-hidden border border-blue-500/20">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-6 border-t border-blue-500/20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-blue-400/40">
            <Clock size={12} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{Number(skill.total_hours || 0).toFixed(1)}h Temporal Depth</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-blue-400/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.button>
  )
}
