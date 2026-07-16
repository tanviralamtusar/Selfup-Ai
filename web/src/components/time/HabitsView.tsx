'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Flame, Loader2, Plus, Sparkles, Trophy, MoreVertical, Edit2, Trash2, Zap as ZapIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { HabitHeatmap } from './HabitHeatmap'

interface Habit {
  id: string
  title: string
  description?: string
  category: string
  reset_type: string
  frequency_days: number[]
  reminder_time?: string
  current_streak: number
  best_streak: number
  is_completed_this_cycle: boolean
  xp_reward: number
  hp_penalty: number
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

const CATEGORY_COLORS: Record<string, string> = {
  fitness: 'text-green-400 bg-green-400/10 border-green-400/20',
  skills:  'text-primary bg-primary/10 border-primary/20',
  time:    'text-secondary bg-secondary/10 border-secondary/20',
  style:   'text-pink-400 bg-pink-400/10 border-pink-400/20',
  general: 'text-muted-foreground bg-muted border-border',
}

export function HabitsView() {
  const { session } = useAuthStore()
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [checkInNote, setCheckInNote] = useState('')
  const [newHabit, setNewHabit] = useState<{
    title: string;
    description: string;
    category: string;
    reset_type: string;
    frequency_days: number[];
    reminder_time: string;
  }>({ 
    title: '', 
    description: '', 
    category: 'general', 
    reset_type: 'daily',
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
      if (res.ok) {
        const json = await res.json()
        setHabits(json.data || [])
      }
    } catch { toast.error('Failed to load habits') }
    finally { setIsLoading(false) }
  }, [headers])

  useEffect(() => {
    if (session?.access_token) fetchHabits()
  }, [session, fetchHabits])

  const handleAddHabit = async () => {
    if (!newHabit.title.trim()) return
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(newHabit)
      })
      if (res.ok) {
        toast.success('Habit created!')
        setIsAddingHabit(false)
        setNewHabit({ title: '', description: '', category: 'general', reset_type: 'daily', frequency_days: [1, 2, 3, 4, 5, 6, 7], reminder_time: '08:00' })
        fetchHabits()
      }
    } catch { toast.error('Failed to create habit') }
  }

  const handleCompleteHabit = async (habit: Habit, notes?: string) => {
    if (habit.is_completed_this_cycle) return
    try {
      const res = await fetch(`/api/habits/${habit.id}/log`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ notes: notes?.trim() || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        const xp = data.data?.xp_awarded || 10
        toast.success(`+${xp} XP!`)
        setCheckingInId(null)
        setCheckInNote('')
        setHabits(prev => prev.map(h =>
          h.id === habit.id ? {
            ...h,
            is_completed_this_cycle: true,
            current_streak: h.current_streak + 1,
            habit_logs: [...(h.habit_logs || []), { completed_at: new Date().toISOString().split('T')[0] }]
          } : h
        ))
      }
    } catch { toast.error('Failed to update habit') }
  }

  const handleCheckIn = (habit: Habit) => {
    if (habit.is_completed_this_cycle) return
    if (checkingInId === habit.id) {
      // Already open — cancel
      setCheckingInId(null)
      setCheckInNote('')
    } else {
      setCheckingInId(habit.id)
      setCheckInNote('')
    }
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
            title: first.name || first.title,
            description: first.description,
            category: first.pillar || first.category || 'general',
            reset_type: first.frequency || first.reset_type || 'daily',
            frequency_days: first.frequency_days || [1,2,3,4,5,6,7],
            reminder_time: first.reminder_time || '08:00'
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
    <div className="space-y-8 max-w-5xl mx-auto ">
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-card border border-border p-8 rounded-xl group">

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl   text-foreground flex items-center justify-center md:justify-start gap-3">
              <ZapIcon className="text-primary animate-pulse" size={24} /> Daily Habits
            </h2>
            <p className="text-[10px] text-muted-foreground  ">Build consistency and level up your life.</p>
          </div>
          <button
            onClick={() => setIsAddingHabit(prev => !prev)}
            className="flex items-center gap-3 px-8 py-3 rounded bg-primary/10 text-primary text-xs   border border-border hover:bg-primary hover:text-foreground transition-all  active:scale-95 group-hover:"
          >
            <Plus size={18} /> New Habit
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
            <div className="bg-muted border border-border rounded-xl p-8 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-muted blur-[100px] pointer-events-none" />
               
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-xs   text-primary/80">New Habit</h3>
                <button 
                  onClick={handleAiSuggest}
                  disabled={isSuggesting}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-muted text-primary text-[10px]   border border-border hover:bg-primary/10 transition-all disabled:opacity-50"
                >
                  {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                  {isSuggesting ? 'Analyzing Data...' : 'System Suggestion'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px]   text-muted-foreground pl-1">Habit Name</label>
                    <input
                      autoFocus
                      placeholder="e.g. CORE STRENGTHENING"
                      value={newHabit.title}
                      onChange={e => setNewHabit(p => ({ ...p, title: e.target.value }))}
                      className="w-full h-14 px-5 rounded bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:  text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px]   text-muted-foreground pl-1">Description</label>
                    <input
                      placeholder="Define the objective..."
                      value={newHabit.description}
                      onChange={e => setNewHabit(p => ({ ...p, description: e.target.value }))}
                      className="w-full h-14 px-5 rounded bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px]   text-muted-foreground pl-1">Category</label>
                    <div className="grid grid-cols-3 gap-2 bg-background p-1.5 rounded border border-border">
                      {['fitness', 'skills', 'time', 'style', 'general'].map(p => (
                        <button
                          key={p}
                          onClick={() => setNewHabit(h => ({ ...h, category: p }))}
                          className={cn(
                            "px-3 py-2.5 rounded text-[9px]   transition-all border",
                            newHabit.category === p 
                              ? "bg-primary text-primary-foreground border-primary/30 " 
                              : "text-muted-foreground border-transparent hover:text-primary hover:border-border"
                          )}
                        >{p}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px]   text-muted-foreground pl-1">Repeat</label>
                      <select 
                        value={newHabit.reset_type}
                        onChange={e => setNewHabit(h => ({ ...h, reset_type: e.target.value }))}
                        className="w-full h-14 px-5 rounded bg-background border border-border text-foreground text-xs  focus:outline-none cursor-pointer appearance-none hover:border-border transition-all"
                      >
                        <option value="daily">Daily Loop</option>
                        <option value="weekly">Weekly Cycle</option>
                        <option value="monthly">Monthly Cycle</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px]   text-muted-foreground pl-1">Reminder</label>
                      <input
                        type="time"
                        value={newHabit.reminder_time}
                        onChange={e => setNewHabit(p => ({ ...p, reminder_time: e.target.value }))}
                        className="w-full h-14 px-5 rounded bg-background border border-border text-foreground text-xs  focus:outline-none hover:border-border transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <label className="text-[10px]   text-muted-foreground pl-1">Days</label>
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
                          "flex-1 h-12 rounded border text-[11px]  transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary/30 "
                            : "bg-background border-border text-muted-foreground hover:border-border"
                        )}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-border relative z-10">
                <button onClick={() => setIsAddingHabit(false)} className="px-6 py-3 rounded text-muted-foreground text-[10px]   hover:text-primary/80 transition-colors">Abort</button>
                <button onClick={handleAddHabit} className="px-10 py-3 bg-primary text-primary-foreground rounded text-[10px]   hover:bg-primary hover: transition-all active:scale-95 border border-primary/30">Create Habit</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits List */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-[10px] text-muted-foreground animate-pulse">Syncing System Data...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="py-24 text-center space-y-6 bg-card border border-border rounded-xl">
          <Sparkles size={48} className="text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-sm">No Habits Found</h3>
            <p className="text-muted-foreground text-[9px] max-w-xs mx-auto">Create your first daily habit to start growing.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {habits.map(habit => (
              <motion.div
                layout
                key={habit.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Row */}
                <div className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all group",
                  habit.is_completed_this_cycle
                    ? "bg-card border-border opacity-60"
                    : checkingInId === habit.id
                    ? "bg-card border-primary/30"
                    : "bg-card border-border hover:border-primary/20"
                )}>
                  {/* Habitica-style + button */}
                  <button
                    onClick={() => handleCheckIn(habit)}
                    disabled={habit.is_completed_this_cycle}
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      habit.is_completed_this_cycle
                        ? "bg-primary/20 text-primary cursor-default"
                        : "bg-primary text-primary-foreground hover:scale-110 active:scale-95 shadow-md hover:shadow-primary/40"
                    )}
                  >
                    {habit.is_completed_this_cycle
                      ? <CheckCircle2 size={22} />
                      : <Plus size={22} strokeWidth={2.5} />
                    }
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-sm font-medium truncate",
                        habit.is_completed_this_cycle ? "line-through text-muted-foreground" : "text-foreground"
                      )}>
                        {habit.title}
                      </span>
                      {habit.current_streak > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-400 flex-shrink-0">
                          <Flame size={10} fill="currentColor" /> {habit.current_streak}
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{habit.description}</p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] border",
                      habit.category === 'fitness' ? 'text-rose-400 bg-rose-500/5 border-rose-500/20' : 'text-primary bg-primary/5 border-primary/20'
                    )}>
                      {habit.category}
                    </span>
                    <span className="text-[10px] text-amber-400/70 font-mono hidden sm:block">+{habit.xp_reward} XP</span>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Inline check-in panel */}
                <AnimatePresence>
                  {checkingInId === habit.id && !habit.is_completed_this_cycle && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-3 mb-1 p-3 bg-muted rounded-b-xl border-x border-b border-primary/20 space-y-2">
                        <textarea
                          autoFocus
                          rows={2}
                          placeholder="How did it go? (optional note)"
                          value={checkInNote}
                          onChange={e => setCheckInNote(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCompleteHabit(habit, checkInNote) }}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none transition-all"
                        />
                        <button
                          onClick={() => handleCompleteHabit(habit, checkInNote)}
                          className="w-full py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
                        >
                          Confirm Check In
                        </button>
                      </div>
                    </motion.div>
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
