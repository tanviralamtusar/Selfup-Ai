'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { motion } from 'framer-motion'
import { History, Brain, Trophy, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillSession {
  id: string
  session_date: string
  created_at: string
  duration_minutes: number
  notes: string | null
  xp_earned: number
}

interface SkillSessionsHistoryProps {
  sessions: SkillSession[]
  isLoading: boolean
}

export function SkillSessionsHistory({ sessions, isLoading }: SkillSessionsHistoryProps) {
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Fetching History...</p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto opacity-50 mb-4">
          <History size={32} className="text-on-surface-variant" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant mb-2">No Sessions Yet</h3>
        <p className="text-xs text-on-surface-variant/40 max-w-[250px] mx-auto">
          Start logging your practice sessions to track your time and progress over time.
        </p>
      </div>
    )
  }

  // Calculate some aggregate stats
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const totalXp = sessions.reduce((acc, s) => acc + s.xp_earned, 0)

  return (
    <div className="space-y-6 pb-6 px-2">
      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 gap-4 px-6 pt-4">
        <div className="flex items-center gap-3 p-3 bg-surface-container-highest/20 rounded-2xl border border-outline-variant/10">
           <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
             <Clock size={14} />
           </div>
           <div>
             <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Total Time</p>
             <p className="text-sm font-black text-on-surface">{totalHours} <span className="text-[10px] text-on-surface-variant">HRS</span></p>
           </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-surface-container-highest/20 rounded-2xl border border-outline-variant/10">
           <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
             <Trophy size={14} />
           </div>
           <div>
             <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Total XP</p>
             <p className="text-sm font-black text-primary">+{totalXp}</p>
           </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 pr-6 space-y-8 mt-6">
        {/* Continuous Line */}
        <div className="absolute left-[39px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

        {sessions.map((session, index) => (
          <motion.div 
            key={session.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className="absolute -left-[37px] top-1.5 w-6 h-6 rounded-full bg-surface-container-low border-2 border-primary flex items-center justify-center shadow-[0_0_10px_rgba(174,162,255,0.2)] z-10">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>

            <div className="bg-surface-container-lowest/50 hover:bg-surface-container-low transition-colors rounded-2xl p-4 border border-outline-variant/10 shadow-sm group">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-on-surface">
                    {format(new Date(session.session_date), 'MMMM d, yyyy')}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant/50 font-medium">
                    {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-secondary/10 text-secondary px-2 py-0.5 rounded-full uppercase tracking-widest">
                    <Clock size={10} />
                    {session.duration_minutes}m
                  </span>
                  <span className="text-[10px] font-black text-primary italic">
                    +{session.xp_earned} XP
                  </span>
                </div>
              </div>

              {session.notes && (
                <div className="mt-3 p-3 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    "{session.notes}"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
