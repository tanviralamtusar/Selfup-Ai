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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md italic">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="w-full max-w-md bg-slate-950 border border-blue-500/50 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col relative"
        >
          {/* Scanline Effect */}
          <div className="absolute inset-0 scanline pointer-events-none opacity-10" />
          
          {/* Header */}
          <div className="p-8 pb-6 border-b border-blue-500/20 flex justify-between items-center relative overflow-hidden bg-blue-500/5">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-[0.3em] text-blue-50 system-text-glow">System Fitness</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500/60 font-black">Protocol Initializer</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isGenerating}
              className="w-10 h-10 rounded-lg bg-blue-500/5 hover:bg-rose-500/20 border border-blue-500/20 hover:border-rose-500/40 flex items-center justify-center text-blue-500/40 hover:text-rose-400 transition-all relative z-10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 space-y-10 flex-1 overflow-y-auto relative z-10 bg-gradient-to-b from-blue-500/[0.02] to-transparent">
            {/* Goal Selection */}
            <div className="space-y-6">
              <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">
                <Activity size={14} className="text-blue-400" /> Protocol Objective
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'muscle_gain', label: 'Hypertrophy' },
                  { id: 'fat_loss', label: 'Lean Synthesis' },
                  { id: 'endurance', label: 'Stamina Build' },
                  { id: 'general_fitness', label: 'Vessel Maintenance' },
                  { id: 'mobility', label: 'Flow States' },
                  { id: 'strength', label: 'Absolute Power' },
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
                      goal === g.id 
                        ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                        : 'bg-slate-950/60 border-blue-500/10 text-blue-500/40 hover:border-blue-500/40 hover:bg-blue-900/10 hover:text-blue-200 shadow-inner'
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
              <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">
                <CalendarDays size={14} className="text-blue-400" /> Temporal Allocation
              </label>
              <div className="flex gap-3">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    disabled={isGenerating}
                    className={`flex-1 py-4 rounded-lg border text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
                      days === d
                        ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        : 'bg-slate-950/60 border-blue-500/10 text-blue-500/40 hover:border-blue-500/40 hover:bg-blue-900/10 hover:text-blue-200'
                    }`}
                  >
                    {d} PHASES
                    {days === d && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-blue-500/20 bg-slate-950/80 backdrop-blur-sm relative z-10">
            <button
              onClick={() => onSubmit(goal, days)}
              disabled={isGenerating}
              className="w-full py-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.4)] border border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SYNTHESIZING PROTOCOL...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="group-hover:animate-pulse" />
                  INITIALIZE SYSTEM GENERATION
                </>
              )}
            </button>
          </div>

          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500/40" />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
