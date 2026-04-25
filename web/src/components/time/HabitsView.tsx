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
    <div className="space-y-8 max-w-5xl mx-auto italic">
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-slate-950/40 border border-blue-500/20 p-8 rounded-xl group">
        {/* Decorative Corner */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/20" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/20" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-blue-50 flex items-center justify-center md:justify-start gap-3 system-text-glow">
              <Zap className="text-blue-400 animate-pulse" size={24} /> Daily Quests
            </h2>
            <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-[0.2em]">Synchronize your actions with system protocols for maximum evolution.</p>
          </div>
          <button
            onClick={() => setIsAddingHabit(prev => !prev)}
            className="flex items-center gap-3 px-8 py-3 rounded bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-[0.3em] border border-blue-500/40 hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)] active:scale-95 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
          >
            <Plus size={18} /> Initialize Protocol
          </button>
        </div>
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
            <div className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-8 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
               
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400/80">Quest Formulation</h3>
                <button 
                  onClick={handleAiSuggest}
                  disabled={isSuggesting}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20 hover:bg-blue-500/10 transition-all disabled:opacity-50"
                >
                  {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                  {isSuggesting ? 'Analyzing Data...' : 'System Suggestion'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 pl-1">Protocol Identifier</label>
                    <input
                      autoFocus
                      placeholder="e.g. CORE STRENGTHENING"
                      value={newHabit.name}
                      onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))}
                      className="w-full h-14 px-5 rounded bg-slate-950 border border-blue-500/20 text-blue-50 placeholder:text-blue-900/40 focus:outline-none focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] font-black tracking-widest text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 pl-1">Operational Parameters</label>
                    <input
                      placeholder="Define the objective..."
                      value={newHabit.description}
                      onChange={e => setNewHabit(p => ({ ...p, description: e.target.value }))}
                      className="w-full h-14 px-5 rounded bg-slate-950 border border-blue-500/20 text-blue-100 placeholder:text-blue-900/40 focus:outline-none focus:border-blue-500/40 text-sm font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 pl-1">Attribute Alignment</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded border border-blue-500/10">
                      {['fitness', 'skills', 'time', 'style', 'general'].map(p => (
                        <button
                          key={p}
                          onClick={() => setNewHabit(h => ({ ...h, pillar: p }))}
                          className={cn(
                            "px-3 py-2.5 rounded text-[9px] font-black uppercase tracking-[0.2em] transition-all border",
                            newHabit.pillar === p 
                              ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                              : "text-blue-500/40 border-transparent hover:text-blue-400 hover:border-blue-500/20"
                          )}
                        >{p}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 pl-1">Sync Frequency</label>
                      <select 
                        value={newHabit.frequency}
                        onChange={e => setNewHabit(h => ({ ...h, frequency: e.target.value }))}
                        className="w-full h-14 px-5 rounded bg-slate-950 border border-blue-500/20 text-blue-50 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer appearance-none hover:border-blue-500/40 transition-all"
                      >
                        <option value="daily">Daily Loop</option>
                        <option value="weekly">Weekly Cycle</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 pl-1">Sync Window</label>
                      <input
                        type="time"
                        value={newHabit.reminder_time}
                        onChange={e => setNewHabit(p => ({ ...p, reminder_time: e.target.value }))}
                        className="w-full h-14 px-5 rounded bg-slate-950 border border-blue-500/20 text-blue-50 text-xs font-black focus:outline-none hover:border-blue-500/40 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 pl-1">Designated Execution Days</label>
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
                          "flex-1 h-12 rounded border text-[11px] font-black uppercase tracking-widest transition-all",
                          isActive
                            ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            : "bg-slate-950 border-blue-500/20 text-blue-500/40 hover:border-blue-500/60"
                        )}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-blue-500/10 relative z-10">
                <button onClick={() => setIsAddingHabit(false)} className="px-6 py-3 rounded text-blue-500/60 text-[10px] font-black uppercase tracking-[0.3em] hover:text-blue-300 transition-colors">Abort</button>
                <button onClick={handleAddHabit} className="px-10 py-3 bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all active:scale-95 border border-blue-400">Establish Protocol</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.4em] animate-pulse">Syncing System Data...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="py-24 text-center space-y-6 bg-slate-950/40 border border-blue-500/10 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <Sparkles size={48} className="text-blue-500/20 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-blue-500/40 font-black uppercase tracking-[0.4em] text-sm">Protocol Bank Empty</h3>
            <p className="text-blue-500/40 text-[9px] uppercase tracking-widest max-w-xs mx-auto">A wandering soul gathers no XP. Initialize your first daily quest to begin evolution.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {habits.map(habit => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={habit.id}
                className={cn(
                  "relative p-8 rounded-xl transition-all duration-500 overflow-hidden border group",
                  habit.completed_today 
                    ? "bg-blue-500/5 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                    : "bg-slate-950 border-blue-500/20 hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.05)]"
                )}
              >
                {/* Scanline Effect */}
                <div className="scanline opacity-20 pointer-events-none" />

                {/* Decoration */}
                <div className="absolute top-0 right-0 w-2 h-16 bg-blue-500/10 group-hover:bg-blue-500/30 transition-colors" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className={cn(
                    "px-3 py-1 rounded text-[8px] font-black uppercase tracking-[0.2em] border",
                    habit.pillar === 'fitness' ? 'text-rose-400 bg-rose-500/5 border-rose-500/20' :
                    'text-blue-400 bg-blue-500/5 border-blue-500/20'
                  )}>
                    {habit.pillar}
                  </span>
                  <div className="flex items-center gap-3">
                    {habit.streak > 2 && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded border border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        <Zap size={10} fill="currentColor" /> {habit.streak}
                      </span>
                    )}
                    <button 
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1.5 rounded text-blue-500/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-8 relative z-10">
                  <h3 className={cn(
                    "text-lg font-black uppercase tracking-widest transition-all",
                    habit.completed_today ? "text-blue-400/40 line-through italic" : "text-blue-50 system-text-glow"
                  )}>
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="text-[10px] text-blue-500/60 uppercase tracking-wide truncate">{habit.description}</p>
                  )}
                  
                  {/* Calendar Grid */}
                  <div className="pt-4 opacity-60 group-hover:opacity-100 transition-opacity">
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
                    "w-full py-4 rounded flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative z-10 border shadow-inner",
                    habit.completed_today
                      ? "bg-blue-500/20 text-blue-400/60 border-blue-500/30 cursor-not-allowed opacity-50"
                      : "bg-slate-900 text-blue-400 border-blue-500/40 hover:bg-blue-500 hover:text-white hover:border-blue-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] active:scale-95"
                  )}
                >
                  {habit.completed_today ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} /> Sync Verified
                    </div>
                  ) : (
                    <>
                      <Plus size={16} /> Mark Synchronized
                    </>
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
