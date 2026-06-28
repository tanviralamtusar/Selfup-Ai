'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Shield, Info, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface StreakHistoryProps {
  isOpen: boolean
  onClose: () => void
  currentStreak: number
  bestStreak: number
  freezeCount: number
  lastDate?: string | null
}

export function StreakHistory({ isOpen, onClose, currentStreak, bestStreak, freezeCount, lastDate }: StreakHistoryProps) {
  // Generate dummy grid for the last 30 days for visual demo
  const history = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Simple logic for dummy display
    const isToday = i === 0
    const isMissed = i === 3 || i === 7 // Mocked missed days
    const isFreezeUsed = i === 3
    const isCompleted = !isMissed && i < 15 // Mocked completion for last 15 days

    return {
      date: dateStr,
      isCompleted,
      isFreezeUsed,
      isMissed,
      isToday
    }
  }).reverse()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-muted rounded-[2.5rem] border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[10px]   text-muted-foreground">Consistency Audit</span>
                </div>
                <h2 className="text-3xl  tracking-tight text-foreground font-headline">Streak History</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-mutedest/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 pt-0 space-y-8">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-mutedest/20 rounded-xl p-4 border border-border">
                  <p className="text-[8px]  text-muted-foreground mb-1">Current</p>
                  <p className="text-2xl  text-foreground leading-none">{currentStreak}<span className="text-[10px] ml-1 text-muted-foreground">D</span></p>
                </div>
                <div className="bg-mutedest/20 rounded-xl p-4 border border-border">
                  <p className="text-[8px]  text-muted-foreground mb-1">Record</p>
                  <p className="text-2xl  text-foreground leading-none">{bestStreak}<span className="text-[10px] ml-1 text-muted-foreground">D</span></p>
                </div>
                <div className="bg-mutedest/20 rounded-xl p-4 border border-border">
                  <p className="text-[8px]  text-muted-foreground mb-1">Freezes</p>
                  <p className="text-2xl  text-foreground leading-none">{freezeCount}</p>
                </div>
              </div>

              {/* Calendar Grid (Simplified for demo) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px]  text-muted-foreground flex items-center gap-2">
                    <Calendar size={12} /> Last 30 Days
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-[3px] bg-orange-500" />
                      <span className="text-[8px]  text-muted-foreground">Log</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-[3px] bg-primary" />
                      <span className="text-[8px]  text-muted-foreground">Freeze</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-10 gap-2">
                  {history.map((day, i) => (
                    <div 
                      key={day.date}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center transition-all duration-500 relative group/tile",
                        day.isCompleted ? "bg-orange-500 shadow-lg shadow-orange-500/20" :
                        day.isFreezeUsed ? "bg-primary shadow-sm" :
                        "bg-mutedest/50 border border-border"
                      )}
                    >
                      {day.isToday && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-muted rounded-md border border-border opacity-0 group-hover/tile:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        <p className="text-[8px]  text-foreground">{formatDate(day.date, 'MMM d')}</p>
                        <p className="text-[7px] font-medium text-muted-foreground">
                          {day.isCompleted ? 'Activity Logged' : day.isFreezeUsed ? 'Freeze Consumed' : 'No Activity'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Information / Legend */}
              <div className="space-y-4 pt-4 border-t border-border">
                 <div className="flex items-start gap-4 p-4 rounded-xl bg-mutedest/10 border border-border">
                   <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                     <Info size={16} />
                   </div>
                   <div className="space-y-1">
                     <p className="text-xs  text-foreground">How Streaks Work</p>
                     <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                       Log any habit, workout, or skill session to extend your streak. If you miss a day, a <span className="text-primary font-medium">Streak Freeze</span> will automatically protect your progress.
                     </p>
                   </div>
                 </div>

                 <div className="flex items-center justify-between text-[9px]   text-muted-foreground">
                   <div className="flex items-center gap-1.5">
                     <CheckCircle2 size={12} className="text-orange-500" /> 
                     Consistency: 85%
                   </div>
                   <div className="flex items-center gap-1.5">
                     <AlertCircle size={12} className="text-muted-foreground" /> 
                     Next Reset: 00:00 AM
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
