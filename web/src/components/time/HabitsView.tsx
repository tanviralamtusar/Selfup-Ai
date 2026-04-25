'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Flame, Loader2, Plus, Sparkles, Trophy, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { HabitHeatmap } from './HabitHeatmap'
import { HabitCalendarGrid } from './HabitCalendarGrid'

interface Habit {
  id: string
  name: string
  description?: string
  pillar: string
  frequency: string
  frequency_days: number[]
  reminder_time?: string
  streak: number
  best_streak: number
  completed_today: boolean
  habit_logs?: { completed_at: string }[]
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'M' },
  { id: 2, label: 'T' },
  { id: 3, label: 'W' },
  { id: 4, label: 'T' },
  { id: 5, label: 'F' },
  { id: 6, label: 'S' },
  { id: 7, label: 'S' },
]

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
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const [newHabit, setNewHabit] = useState<{
    name: string;
    description: string;
    pillar: string;
    frequency: string;
    frequency_days: number[];
    reminder_time: string;
  }>({ 
    name: '', 
    description: '', 
    pillar: 'general', 
    frequency: 'daily',
    frequency_days: [1, 2, 3, 4, 5, 6, 7],
    reminder_time: '08:00'
  })

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
          h.id === habit.id ? { 
            ...h, 
            completed_today: true, 
            streak: h.streak + 1,
            habit_logs: [...(h.habit_logs || []), { completed_at: new Date().toISOString().split('T')[0] }]
          } : h
        ))
      }
    } catch { toast.error('Failed to update habit') }
  }

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      if (res.ok) {
        toast.success('Habit removed')
        setHabits(prev => prev.filter(h => h.id !== id))
      }
    } catch { toast.error('Failed to delete habit') }
  }

  const handleUpdateHabit = async (habit: Partial<Habit> & { id: string }) => {
    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(habit)
      })
      if (res.ok) {
        toast.success('Habit updated')
        fetchHabits()
      }
    } catch { toast.error('Failed to update habit') }
  }

  const handleAiSuggest = async () => {
    setIsSuggesting(true)
    try {
      const res = await fetch('/api/ai/habits/suggest', {
        method: 'POST',
        headers: headers(),
      })
      if (res.ok) {
        const suggestions = await res.json()
        if (suggestions && suggestions.length > 0) {
          const first = suggestions[0]
          setNewHabit({
            name: first.name,
            description: first.description,
            pillar: first.pillar,
            frequency: first.frequency,
            frequency_days: first.frequency_days,
            reminder_time: first.reminder_time
          })
          toast.success('System has formulated a suggestion.')
        }
      }
    } catch {
      toast.error('System is currently recalibrating.')
    } finally {
      setIsSuggesting(false)
    }
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

      {/* Global Heatmap */}
      {!isLoading && habits.length > 0 && (
        <HabitHeatmap habits={habits} />
      )}

      {/* Add Habit Inline Form */}
      <AnimatePresence>
        {isAddingHabit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-6 relative">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Forge a New Habit</h3>
                <button 
                  onClick={handleAiSuggest}
                  disabled={isSuggesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {isSuggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                  {isSuggesting ? 'Analyzing...' : 'AI Suggest'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Imperative Name</label>
                    <input
                      autoFocus
                      placeholder="e.g. Read 20 Pages"
                      value={newHabit.name}
                      onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Description</label>
                    <input
                      placeholder="The 'why' behind the what"
                      value={newHabit.description}
                      onChange={e => setNewHabit(p => ({ ...p, description: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Pillar Alignment</label>
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-1 rounded-xl">
                      {['fitness', 'skills', 'time', 'style', 'general'].map(p => (
                        <button
                          key={p}
                          onClick={() => setNewHabit(h => ({ ...h, pillar: p }))}
                          className={cn(
                            "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            newHabit.pillar === p ? PILLAR_COLORS[p] : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                          )}
                        >{p}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Frequency</label>
                      <select 
                        value={newHabit.frequency}
                        onChange={e => setNewHabit(h => ({ ...h, frequency: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface text-xs font-bold focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Reminder</label>
                      <input
                        type="time"
                        value={newHabit.reminder_time}
                        onChange={e => setNewHabit(p => ({ ...p, reminder_time: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Target Days</label>
                <div className="flex justify-between gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isActive = newHabit.frequency_days.includes(day.id)
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          const newDays = isActive
                            ? newHabit.frequency_days.filter(d => d !== day.id)
                            : [...newHabit.frequency_days, day.id]
                          setNewHabit({ ...newHabit, frequency_days: newDays })
                        }}
                        className={cn(
                          "flex-1 h-12 rounded-xl border text-[11px] font-black transition-all",
                          isActive
                            ? "bg-primary text-on-primary border-primary"
                            : "bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:border-primary/30"
                        )}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
                <button onClick={() => setIsAddingHabit(false)} className="px-5 py-2.5 rounded-xl text-on-surface-variant text-xs font-black uppercase tracking-widest hover:bg-surface-container-highest transition-colors">Cancel</button>
                <button onClick={handleAddHabit} className="px-8 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">Establish Imperative</button>
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
                  <div className="flex items-center gap-2">
                    {habit.streak > 2 && (
                      <span className="flex items-center gap-1 text-[11px] font-black text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md">
                        <Flame size={12} fill="currentColor" /> {habit.streak}
                      </span>
                    )}
                    <button 
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-6 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("text-lg font-bold truncate", habit.completed_today ? "text-on-surface line-through opacity-70" : "text-on-surface")}>
                      {habit.name}
                    </h3>
                  </div>
                  {habit.description && (
                    <p className="text-xs text-on-surface-variant/60 truncate">{habit.description}</p>
                  )}
                  
                  {/* Calendar Grid */}
                  <div className="pt-2">
                    <HabitCalendarGrid 
                      logs={habit.habit_logs || []} 
                      pillar={habit.pillar} 
                    />
                  </div>
                </div>

                {/* Check-in button */}
                <button
                  onClick={() => handleCompleteHabit(habit)}
                  disabled={habit.completed_today}
                  className={cn(
                    "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all relative z-10",
                    habit.completed_today
                      ? "bg-tertiary/20 text-tertiary cursor-not-allowed border border-tertiary/20"
                      : "bg-surface-container-highest text-on-surface hover:bg-primary hover:text-on-primary active:scale-95 shadow-sm hover:shadow-primary/20"
                  )}
                >
                  {habit.completed_today ? (
                    <motion.div 
                      initial={{ scale: 0.8 }} 
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Imperative Fulfilled
                    </motion.div>
                  ) : (
                    "Mark Done"
                  )}
                </button>
                
                {/* Visual completion burst */}
                <AnimatePresence>
                  {habit.completed_today && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-primary/20 rounded-full blur-2xl pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
