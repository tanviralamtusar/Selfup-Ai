import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Activity, CalendarDays, Loader2 } from 'lucide-react'

interface AiPlanGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (goal: string, days: number) => void
  isGenerating: boolean
}

export function AiPlanGeneratorModal({ isOpen, onClose, onSubmit, isGenerating }: AiPlanGeneratorModalProps) {
  const [goal, setGoal] = useState('muscle_gain')
  const [days, setDays] = useState(4)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80  ">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden  flex flex-col relative"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Fitness Planner</h2>
                <p className="text-xs text-muted-foreground">Create Your Plan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="w-8 h-8 rounded-md bg-muted hover:bg-destructive/10 border border-border hover:border-destructive/30 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Goal Selection */}
            <div className="space-y-6">
              <label className="flex items-center gap-3 text-[10px]   text-muted-foreground">
                <Activity size={14} className="text-primary" /> Choose Your Goal
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'muscle_gain', label: 'Muscle Gain' },
                  { id: 'fat_loss', label: 'Fat Loss' },
                  { id: 'endurance', label: 'Endurance' },
                  { id: 'general_fitness', label: 'Fitness' },
                  { id: 'mobility', label: 'Flexibility' },
                  { id: 'strength', label: 'Strength' },
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border text-[11px]   transition-all relative overflow-hidden group ${
                      goal === g.id 
                        ? 'bg-primary text-primary-foreground border-primary/30 ' 
                        : 'bg-card border-border text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground/80 shadow-inner'
                    }`}
                  >
                    {g.label}
                    {goal === g.id && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Days per week */}
            <div className="space-y-6">
              <label className="flex items-center gap-3 text-[10px]   text-muted-foreground">
                <CalendarDays size={14} className="text-primary" /> Days Per Week
              </label>
              <div className="flex gap-3">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    disabled={isGenerating}
                    className={`flex-1 py-4 rounded-lg border text-[11px]   transition-all relative overflow-hidden group ${
                      days === d
                        ? 'bg-primary text-primary-foreground border-primary/30 '
                        : 'bg-card border-border text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground/80'
                    }`}
                  >
                    {d} DAYS
                    {days === d && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-border bg-background/95 relative z-10">
            <button
              onClick={() => onSubmit(goal, days)}
              disabled={isGenerating}
              className="w-full py-5 rounded-lg bg-primary hover:bg-primary text-primary-foreground   text-[11px] transition-all flex items-center justify-center gap-3  border border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="group-hover:animate-pulse" />
                   Create My Fitness Plan
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  )
}
