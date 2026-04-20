'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Milestone {
  id: string
  title: string
  description: string
  order_index: number
  estimated_hours: number
  is_completed: boolean
}

interface RoadmapTimelineProps {
  milestones: Milestone[]
  onToggleMilestone: (id: string, isCompleted: boolean) => void
  isLoading?: string | null // ID of milestone being toggled
}

export function RoadmapTimeline({ milestones, onToggleMilestone, isLoading }: RoadmapTimelineProps) {
  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center animate-pulse">
          <Info size={32} className="text-on-surface-variant/20" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-on-surface uppercase tracking-widest">Generating Growth Path</p>
          <p className="text-xs text-on-surface-variant/40">Nova is architecting your master plan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 pl-10 pr-4 py-4">
      {/* Connector Line */}
      <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-outline-variant/10" />

      {milestones.map((milestone, idx) => {
        const isNext = !milestone.is_completed && (idx === 0 || milestones[idx - 1].is_completed)
        const isLocked = !milestone.is_completed && idx > 0 && !milestones[idx - 1].is_completed
        const isUpdating = isLoading === milestone.id

        return (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "relative group transition-all duration-500",
              isLocked && "opacity-40 grayscale"
            )}
          >
            {/* Status Icon / Node */}
            <div className="absolute -left-[31px] top-1">
              <motion.button
                whileHover={!isLocked ? { scale: 1.2 } : {}}
                whileTap={!isLocked ? { scale: 0.9 } : {}}
                onClick={() => !isLocked && onToggleMilestone(milestone.id, !milestone.is_completed)}
                disabled={isLocked || isUpdating}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 relative z-10",
                  milestone.is_completed
                    ? "bg-green-500 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : isNext
                      ? "bg-background border-primary text-primary shadow-[0_0_15px_rgba(174,162,255,0.2)]"
                      : "bg-background border-outline-variant text-on-surface-variant/40"
                )}
              >
                {isUpdating ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : milestone.is_completed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Circle size={10} fill={isNext ? "currentColor" : "transparent"} />
                )}
              </motion.button>
              
              {/* Highlight Line Segment (Animated) */}
              <AnimatePresence>
                {milestone.is_completed && idx < milestones.length - 1 && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    className="absolute top-10 left-[19px] w-[2px] bg-green-500 z-0 origin-top"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Content Card */}
            <div className={cn(
               "p-5 rounded-2xl border transition-all duration-500",
               milestone.is_completed 
                 ? "bg-green-500/5 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                 : isNext
                   ? "bg-surface-container-low border-primary/20 shadow-lg shadow-primary/5"
                   : "bg-surface-container-lowest border-outline-variant/5"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className={cn(
                    "font-bold text-sm tracking-tight",
                    milestone.is_completed ? "text-green-400" : "text-on-surface"
                  )}>
                    {milestone.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant/60 leading-relaxed max-w-sm">
                    {milestone.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30">
                  <Clock size={10} />
                  <span>~{milestone.estimated_hours}h</span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
