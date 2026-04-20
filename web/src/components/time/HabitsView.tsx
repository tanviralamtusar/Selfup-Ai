'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Flame, Loader2, Plus, Sparkles, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Habit {
  id: string
  name: string
  description?: string
  pillar: string
  frequency: string
  streak: number
  best_streak: number
  completed_today: boolean
}

const PILLAR_COLORS: Record<string, string> = {
  fitness: 'text-green-400 bg-green-400/10 border-green-400/20',
  skills:  'text-primary bg-primary/10 border-primary/20',
  time:    'text-secondary bg-secondary/10 border-secondary/20',
  style:   'text-pink-400 bg-pink-400/10 border-pink-400/20',
  general: 'text-on-surface-variant/60 bg-surface-container-highest/30 border-outline-variant/10',
}

export function HabitsView() {
  const { session } = useAuthStore()
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: '', description: '', pillar: 'general', frequency: 'daily' })

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  const fetchHabits = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/habits', { headers: headers() })
      if (res.ok) setHabits(await res.json())
    } catch { toast.error('Failed to load habits') }
    finally { setIsLoading(false) }
  }, [headers])

  useEffect(() => {
    if (session?.access_token) fetchHabits()
  }, [session, fetchHabits])

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(newHabit)
      })
      if (res.ok) {
        toast.success('Habit created!')
        setIsAddingHabit(false)
        setNewHabit({ name: '', description: '', pillar: 'general', frequency: 'daily' })
        fetchHabits()
      }
    } catch { toast.error('Failed to create habit') }
  }

  const handleCompleteHabit = async (habit: Habit) => {
    if (habit.completed_today) return // already done
    try {
      const res = await fetch(`/api/habits/${habit.id}/log`, {
        method: 'POST',
        headers: headers(),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`+${data.xpEarned || 10} XP!`)
        // Optimistic update
        setHabits(prev => prev.map(h => 
          h.id === habit.id ? { ...h, completed_today: true, streak: h.streak + 1 } : h
        ))
      }
    } catch { toast.error('Failed to update habit') }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-low border border-outline-variant/10 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="space-y-1 relative z-10 text-center md:text-left">
          <h2 className="text-xl font-black uppercase tracking-widest text-on-surface flex items-center justify-center md:justify-start gap-2">
            <Flame className="text-orange-400" size={20} /> Today's Imperatives
          </h2>
          <p className="text-xs text-on-surface-variant/60 font-medium">Small daily inputs yield massive ultimate outcomes.</p>
        </div>
        <button
          onClick={() => setIsAddingHabit(prev => !prev)}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> New Habit
        </button>
      </div>

      {/* Add Habit Inline Form */}
      <AnimatePresence>
        {isAddingHabit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-5 relative">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Forge a New Habit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  autoFocus
                  placeholder="Habit Name (e.g. Read 20 Pages)"
                  value={newHabit.name}
                  onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium text-sm"
                />
                <input
                  placeholder="Description (Optional)"
                  value={newHabit.description}
                  onChange={e => setNewHabit(p => ({ ...p, description: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 text-sm"
                />
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Pillar</label>
                  <div className="flex gap-2 bg-surface-container-lowest p-1 rounded-xl">
                    {['general', 'fitness', 'skills', 'time', 'style'].map(p => (
                      <button
                        key={p}
                        onClick={() => setNewHabit(h => ({ ...h, pillar: p }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          newHabit.pillar === p ? PILLAR_COLORS[p] : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                        )}
                      >{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
                <button onClick={() => setIsAddingHabit(false)} className="px-5 py-2 rounded-xl text-on-surface-variant text-xs font-black uppercase tracking-widest hover:bg-surface-container-highest transition-colors">Cancel</button>
                <button onClick={handleAddHabit} className="px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">Create Habit</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : habits.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-surface-container-low border border-outline-variant/10 rounded-3xl">
          <Sparkles size={40} className="text-on-surface-variant/20 mx-auto" />
          <h3 className="text-on-surface-variant/40 font-black uppercase tracking-widest text-sm">No Habits Tracked</h3>
          <p className="text-on-surface-variant/40 text-xs">A wandering soul gathers no XP. Start tracking something small.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {habits.map(habit => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={habit.id}
                className={cn(
                  "relative p-6 rounded-3xl transition-all duration-500 overflow-hidden border",
                  habit.completed_today 
                    ? "bg-tertiary-fixed-dim/5 border-tertiary-fixed-dim/20" 
                    : "bg-surface-container border-outline-variant/10 hover:border-primary/30"
                )}
              >
                {/* Background flourish when done */}
                {habit.completed_today && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary-fixed-dim/10 rounded-full blur-3xl" />
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className={cn("px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest", PILLAR_COLORS[habit.pillar] || PILLAR_COLORS.general)}>
                    {habit.pillar}
                  </span>
                  {habit.streak > 2 && (
                    <span className="flex items-center gap-1 text-[11px] font-black text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md">
                      <Flame size={12} fill="currentColor" /> {habit.streak}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-6 relative z-10">
                  <h3 className={cn("text-lg font-bold truncate", habit.completed_today ? "text-on-surface line-through opacity-70" : "text-on-surface")}>
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="text-xs text-on-surface-variant/60 truncate">{habit.description}</p>
                  )}
                </div>

                {/* Check-in button */}
                <button
                  onClick={() => handleCompleteHabit(habit)}
                  disabled={habit.completed_today}
                  className={cn(
                    "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all relative z-10",
                    habit.completed_today
                      ? "bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim cursor-not-allowed"
                      : "bg-surface-container-highest text-on-surface hover:bg-primary/20 hover:text-primary active:scale-95"
                  )}
                >
                  {habit.completed_today ? (
                    <>
                      <CheckCircle2 size={16} /> Completed
                    </>
                  ) : (
                    "Mark Done"
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
