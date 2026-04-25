import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Activity, CalendarDays } from 'lucide-react'

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-surface-container border border-outline-variant/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-outline-variant/10 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-on-surface">System Fitness</h2>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">AI Plan Generator</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isGenerating}
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors relative z-10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8 flex-1 overflow-y-auto">
            {/* Goal Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant">
                <Activity size={14} className="text-primary" /> Primary Goal
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'muscle_gain', label: 'Muscle Gain' },
                  { id: 'fat_loss', label: 'Fat Loss' },
                  { id: 'endurance', label: 'Endurance' },
                  { id: 'general_fitness', label: 'General Fitness' },
                  { id: 'mobility', label: 'Mobility' },
                  { id: 'strength', label: 'Pure Strength' },
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    disabled={isGenerating}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      goal === g.id 
                        ? 'bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
                        : 'bg-surface-container-low border-outline-variant/10 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Days per week */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant">
                <CalendarDays size={14} className="text-secondary" /> Training Days Per Week
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    disabled={isGenerating}
                    className={`flex-1 py-3 rounded-xl border font-black transition-all ${
                      days === d
                        ? 'bg-secondary/10 border-secondary/50 text-secondary shadow-[0_0_15px_rgba(var(--secondary),0.1)]'
                        : 'bg-surface-container-low border-outline-variant/10 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t border-outline-variant/10 bg-surface-container-low">
            <button
              onClick={() => onSubmit(goal, days)}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate AI Plan
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
