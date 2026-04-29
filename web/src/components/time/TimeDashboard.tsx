'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Minus, 
  Check, 
  Clock, 
  Zap, 
  Flame, 
  Calendar,
  ListTodo,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Trophy,
  Target,
  Sparkles,
  MoreVertical,
  X,
  Trash2,
  Save,
  PlusCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface Habit {
  id: string
  name: string
  description?: string
  pillar: string
  streak: number
  best_streak: number
  completed_today: boolean
  frequency: string
  reminder_time?: string
  difficulty?: string
  tags?: string[]
  checklist?: any[]
  start_date?: string
  repeat_every?: number
  repeat_unit?: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority: string
  pillar: string
  scheduled_start: string | null
  estimated_minutes: number | null
  due_date?: string
  difficulty?: string
  tags?: string[]
  checklist?: any[]
}

export function TimeDashboard() {
  const { session } = useAuthStore()
  const [habits, setHabits] = useState<Habit[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Column Tabs
  const [habitTab, setHabitTab] = useState<'all' | 'weak' | 'strong'>('all')
  const [dailyTab, setDailyTab] = useState<'all' | 'due' | 'not_due'>('all')
  const [todoTab, setTodoTab] = useState<'active' | 'scheduled' | 'complete'>('active')

  // Add inputs
  const [newHabitName, setNewHabitName] = useState('')
  const [newDailyName, setNewDailyName] = useState('')
  const [newTodoName, setNewTodoName] = useState('')

  // Edit Modal
  const [editingItem, setEditingItem] = useState<Habit | Task | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  const fetchData = useCallback(async () => {
    try {
      const [habitsRes, tasksRes] = await Promise.all([
        fetch('/api/habits', { headers: headers() }),
        fetch('/api/tasks', { headers: headers() })
      ])
      if (habitsRes.ok) setHabits(await habitsRes.json())
      if (tasksRes.ok) setTasks(await tasksRes.json())
    } catch {
      toast.error('Sync failure')
    } finally {
      setIsLoading(false)
    }
  }, [headers])

  useEffect(() => {
    if (session?.access_token) fetchData()
  }, [session, fetchData])

  const handleHabitAction = async (habitId: string, delta: number) => {
    if (delta > 0) {
      // Logic for logging
      try {
        const res = await fetch(`/api/habits/${habitId}/log`, {
          method: 'POST',
          headers: headers(),
        })
        if (res.ok) {
          toast.success('Protocol established! +10 XP')
          fetchData()
        } else if (res.status === 409) {
          toast.info('Already synchronized today')
        }
      } catch {
        toast.error('Neural link error')
      }
    } else {
      toast.info('Negative protocols not yet implemented')
    }
  }

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        if (status === 'done') toast.success('Objective secured! +50 XP')
        fetchData()
      }
    } catch {
      toast.error('Failed to update objective')
    }
  }

  const handleAddHabit = async (type: 'habit' | 'daily') => {
    const name = type === 'habit' ? newHabitName : newDailyName
    if (!name.trim()) return

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ 
          name, 
          frequency: type === 'daily' ? 'daily' : 'weekly', 
          pillar: 'general',
          frequency_days: [1, 2, 3, 4, 5, 6, 7]
        })
      })
      if (res.ok) {
        toast.success(`${type === 'habit' ? 'Habit' : 'Daily'} protocol initialized`)
        if (type === 'habit') setNewHabitName('')
        else setNewDailyName('')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Protocol failed')
      }
    } catch {
      toast.error('Neural link error during initialization')
    }
  }

  const handleAddTodo = async () => {
    if (!newTodoName.trim()) return
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ title: newTodoName, priority: 'medium', pillar: 'general' })
      })
      if (res.ok) {
        toast.success('Objective logged')
        setNewTodoName('')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Objective log failed')
      }
    } catch {
      toast.error('System error while logging objective')
    }
  }

  const handleUpdateItem = async (updates: any) => {
    if (!editingItem) return
    const isNew = editingItem.id === 'new'
    const isHabit = 'name' in updates
    
    const method = isNew ? 'POST' : 'PATCH'
    const url = isHabit ? '/api/habits' : '/api/tasks'
    const finalUrl = isNew ? url : `${url}/${editingItem.id}`
    
    try {
      const res = await fetch(finalUrl, {
        method,
        headers: headers(),
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        toast.success(isNew ? 'Protocol initialized' : 'Protocol updated')
        fetchData()
        setIsEditModalOpen(false)
        setEditingItem(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Operation failed')
      }
    } catch {
      toast.error('Neural link error')
    }
  }

  const handleOpenAdvancedAdd = (type: 'habit' | 'daily' | 'todo') => {
    const newItem: any = {
      id: 'new',
      pillar: 'general',
      difficulty: 'medium',
      checklist: [],
      tags: [],
      description: '',
    }
    if (type === 'habit' || type === 'daily') {
      newItem.name = ''
      newItem.frequency = type === 'daily' ? 'daily' : 'weekly'
      newItem.streak = 0
      newItem.best_streak = 0
      if (type === 'daily') newItem.frequency_days = [1, 2, 3, 4, 5, 6, 7]
    } else {
      newItem.title = ''
      newItem.priority = 'medium'
      newItem.status = 'todo'
    }
    setEditingItem(newItem)
    setIsEditModalOpen(true)
  }

  const handleDeleteItem = async () => {
    if (!editingItem) return
    const isHabit = 'name' in editingItem
    const url = isHabit ? `/api/habits/${editingItem.id}` : `/api/tasks/${editingItem.id}`
    
    if (!confirm('Are you sure you want to delete this protocol?')) return

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: headers(),
      })
      if (res.ok) {
        toast.success('Protocol purged')
        fetchData()
        setIsEditModalOpen(false)
        setEditingItem(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Purge failed')
      }
    } catch {
      toast.error('Purge failed')
    }
  }

  // Filtering
  const filteredHabits = habits.filter(h => {
    if (h.frequency === 'daily') return false 
    if (habitTab === 'weak') return h.streak < 3
    if (habitTab === 'strong') return h.streak >= 7
    return true
  })

  const filteredDailies = habits.filter(h => {
    if (h.frequency !== 'daily') return false
    if (dailyTab === 'due') return !h.completed_today
    if (dailyTab === 'not_due') return h.completed_today
    return true
  })

  const filteredTodos = tasks.filter(t => {
    if (todoTab === 'active') return t.status !== 'done' && !t.scheduled_start
    if (todoTab === 'scheduled') return !!t.scheduled_start && t.status !== 'done'
    if (todoTab === 'complete') return t.status === 'done'
    return true
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-primary" size={48} strokeWidth={3} />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/40 animate-pulse">Syncing Neural Grid...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Global Dashboard Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Daily Sync" 
          value={`${Math.round(((habits.filter(h => h.completed_today).length + tasks.filter(t => t.status === 'done').length) / (habits.length + tasks.length || 1)) * 100)}%`}
          sub="Neural Integration"
          icon={<Zap size={18} />}
          color="primary"
          progress={((habits.filter(h => h.completed_today).length + tasks.filter(t => t.status === 'done').length) / (habits.length + tasks.length || 1)) * 100}
        />
        <StatCard 
          label="Active Streaks" 
          value={habits.reduce((acc, h) => acc + (h.streak > 0 ? 1 : 0), 0).toString()}
          sub="Operational Consistency"
          icon={<Flame size={18} />}
          color="secondary"
        />
        <StatCard 
          label="Objectives" 
          value={tasks.filter(t => t.status !== 'done').length.toString()}
          sub="Pending Decryption"
          icon={<Target size={18} />}
          color="tertiary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Column 1: Habits */}
        <section className="space-y-6">

        <ColumnHeader title="Habits" count={filteredHabits.length} color="primary" />
        
        <TabSelector 
          tabs={['all', 'weak', 'strong']} 
          active={habitTab} 
          onChange={setHabitTab} 
          color="primary" 
        />

        <div className="bg-surface-container-low/40 backdrop-blur-md rounded-[2.5rem] p-4 space-y-4 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <QuickAdd 
            placeholder="Add a Habit..." 
            value={newHabitName} 
            onChange={setNewHabitName} 
            onAdd={() => handleAddHabit('habit')}
            onAdvanced={() => handleOpenAdvancedAdd('habit')}
            color="primary"
          />
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredHabits.map((habit, idx) => (
                <HabitCard 
                  key={habit.id} 
                  habit={habit} 
                  onAction={handleHabitAction} 
                  colorIndex={idx}
                  onEdit={() => {
                    setEditingItem(habit)
                    setIsEditModalOpen(true)
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Column 2: Dailies */}
      <section className="space-y-6">
        <ColumnHeader title="Dailies" count={filteredDailies.length} color="secondary" />

        <TabSelector 
          tabs={['all', 'due', 'not_due']} 
          active={dailyTab} 
          onChange={setDailyTab} 
          color="secondary" 
        />

        <div className="bg-surface-container-low/40 backdrop-blur-md rounded-[2.5rem] p-4 space-y-4 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
          
          <QuickAdd 
            placeholder="Add a Daily..." 
            value={newDailyName} 
            onChange={setNewDailyName} 
            onAdd={() => handleAddHabit('daily')}
            onAdvanced={() => handleOpenAdvancedAdd('daily')}
            color="secondary"
          />
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredDailies.map(daily => (
                <DailyCard 
                  key={daily.id} 
                  daily={daily} 
                  onComplete={() => handleHabitAction(daily.id, 1)}
                  onEdit={() => {
                    setEditingItem(daily)
                    setIsEditModalOpen(true)
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Column 3: To Do's */}
      <section className="space-y-6">
        <ColumnHeader title="To Do's" count={filteredTodos.length} color="tertiary" />

        <TabSelector 
          tabs={['active', 'scheduled', 'complete']} 
          active={todoTab} 
          onChange={setTodoTab} 
          color="tertiary" 
        />

        <div className="bg-surface-container-low/40 backdrop-blur-md rounded-[2.5rem] p-4 space-y-4 border border-outline-variant/10 shadow-2xl relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-tertiary-fixed/20 to-transparent" />
          
          <QuickAdd 
            placeholder="Add a To Do..." 
            value={newTodoName} 
            onChange={setNewTodoName} 
            onAdd={handleAddTodo}
            onAdvanced={() => handleOpenAdvancedAdd('todo')}
            color="tertiary"
          />
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredTodos.length === 0 ? (
                <EmptyState color="tertiary" />
              ) : (
                filteredTodos.map(todo => (
                  <TodoCard 
                    key={todo.id} 
                    todo={todo} 
                    onToggle={() => handleTaskStatusChange(todo.id, todo.status === 'done' ? 'todo' : 'done')}
                    onEdit={() => {
                      setEditingItem(todo)
                      setIsEditModalOpen(true)
                    }}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>

    <AnimatePresence>
      {isEditModalOpen && editingItem && (
        <EditProtocolModal 
          item={editingItem}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingItem(null)
          }}
          onSave={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      )}
    </AnimatePresence>
  </div>
  )
}

// ── Components ──

function ColumnHeader({ title, count, color }: { title: string; count: number; color: 'primary' | 'secondary' | 'tertiary' }) {
  const colorMap = {
    primary: 'bg-primary text-on-primary',
    secondary: 'bg-secondary text-on-secondary',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed'
  }
  return (
    <div className="flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-black text-on-surface tracking-tighter">{title}</h2>
        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border border-white/10 shadow-lg", colorMap[color])}>
          {count}
        </span>
      </div>
      <button className="p-2 rounded-xl hover:bg-surface-container-medium text-on-surface-variant/40 transition-colors">
        <MoreVertical size={18} />
      </button>
    </div>
  )
}

function TabSelector({ tabs, active, onChange, color }: { tabs: string[]; active: string; onChange: (v: any) => void; color: string }) {
  const bgColorMap: any = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary-fixed-dim'
  }
  const textColorMap: any = {
    primary: 'text-on-primary',
    secondary: 'text-on-secondary',
    tertiary: 'text-on-tertiary-fixed'
  }

  return (
    <div className="flex gap-1 bg-surface-container-low/20 p-1.5 rounded-[1.25rem] border border-outline-variant/5">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all relative rounded-xl z-10",
            active === tab ? textColorMap[color] : "text-on-surface-variant/40 hover:text-on-surface-variant/60"
          )}
        >
          <span className="relative z-20">{tab.replace('_', ' ')}</span>
          {active === tab && (
            <motion.div 
              layoutId={`${color}TabGlow`} 
              className={cn("absolute inset-0 rounded-[0.9rem] shadow-lg", bgColorMap[color])} 
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

function QuickAdd({ placeholder, value, onChange, onAdd, onAdvanced, color }: { placeholder: string; value: string; onChange: (v: string) => void; onAdd: () => void; onAdvanced: () => void; color: string }) {
  const ringColor: any = {
    primary: 'focus:ring-primary/20 hover:border-primary/20',
    secondary: 'focus:ring-secondary/20 hover:border-secondary/20',
    tertiary: 'focus:ring-tertiary-fixed-dim/20 hover:border-tertiary-fixed-dim/20'
  }
  const btnColor: any = {
    primary: 'bg-primary text-on-primary shadow-primary/20',
    secondary: 'bg-secondary text-on-secondary shadow-secondary/20',
    tertiary: 'bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-tertiary-fixed-dim/20'
  }

  return (
    <div className="relative group">
      <input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        className={cn(
          "w-full h-14 px-6 rounded-2xl bg-surface-container-highest/10 text-on-surface placeholder:text-on-surface-variant/20 text-sm font-bold border border-outline-variant/5 focus:outline-none focus:ring-4 transition-all shadow-inner pr-28",
          ringColor[color]
        )}
      />
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        <button 
          onClick={onAdvanced}
          title="Advanced Creation"
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-on-surface/5 text-on-surface-variant/40 hover:bg-on-surface/10 transition-all active:scale-90"
        >
          <Sparkles size={18} />
        </button>
        <button 
          onClick={onAdd}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg",
            btnColor[color]
          )}
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}

function HabitCard({ habit, onAction, onEdit, colorIndex }: { habit: Habit; onAction: (id: string, delta: number) => void; onEdit: () => void; colorIndex: number }) {
  const pillarColors: any = {
    fitness: { from: 'from-emerald-500/80', to: 'to-teal-600/80', glow: 'shadow-emerald-500/20' },
    skills: { from: 'from-indigo-500/80', to: 'to-blue-600/80', glow: 'shadow-blue-500/20' },
    time: { from: 'from-amber-500/80', to: 'to-yellow-600/80', glow: 'shadow-amber-500/20' },
    style: { from: 'from-violet-500/80', to: 'to-purple-600/80', glow: 'shadow-purple-500/20' },
    general: { from: 'from-rose-500/80', to: 'to-orange-600/80', glow: 'shadow-rose-500/20' }
  }

  const p = pillarColors[habit.pillar || 'general']
  const gradient = `${p.from} ${p.to}`
  const glow = p.glow

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex items-stretch rounded-[1.75rem] overflow-hidden border border-white/10 shadow-xl transition-all group h-20",
        glow
      )}
    >
      <button 
        onClick={() => onAction(habit.id, 1)}
        className={cn("w-16 flex items-center justify-center bg-gradient-to-br transition-all hover:scale-105 active:scale-95 text-white", gradient)}
      >
        <Plus size={28} strokeWidth={4} />
      </button>
      
      <div className="flex-1 bg-surface-container-low/80 p-5 flex flex-col justify-center gap-1 border-x border-white/5 group-hover:bg-surface-container-medium transition-colors cursor-pointer" onClick={onEdit}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-on-surface leading-tight tracking-tight">{habit.name}</h3>
          <MoreVertical size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/40 font-black uppercase tracking-tighter">
            <Flame size={12} className={cn("transition-colors", habit.streak > 0 ? "text-orange-500" : "text-on-surface-variant/20")} />
            <span>STREAK: {habit.streak}</span>
          </div>
          <div className="w-[2px] h-[2px] rounded-full bg-on-surface-variant/20" />
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/40 font-black uppercase tracking-tighter">
            <Trophy size={10} className="text-yellow-500/40" />
            <span>BEST: {habit.best_streak}</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => onAction(habit.id, -1)}
        className="w-16 flex items-center justify-center bg-surface-container-highest/30 hover:bg-rose-500/10 transition-all text-on-surface-variant/20 hover:text-rose-500"
      >
        <Minus size={24} strokeWidth={3} />
      </button>
    </motion.div>
  )
}

function DailyCard({ daily, onComplete, onEdit }: { daily: Habit; onComplete: () => void; onEdit: () => void }) {
  const pillarColors: any = {
    fitness: { text: 'text-emerald-400', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    skills: { text: 'text-blue-400', bg: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    time: { text: 'text-amber-400', bg: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    style: { text: 'text-purple-400', bg: 'bg-purple-500', shadow: 'shadow-purple-500/20' },
    general: { text: 'text-rose-400', bg: 'bg-rose-500', shadow: 'shadow-rose-500/20' }
  }
  const p = pillarColors[daily.pillar || 'general']

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-center gap-4 p-5 rounded-[1.75rem] bg-surface-container-low/80 border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container-medium group relative overflow-hidden h-20",
        daily.completed_today && "opacity-50"
      )}
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500",
        daily.completed_today ? "h-0" : "h-full",
        p.bg
      )} />
      
      <button 
        onClick={onComplete}
        disabled={daily.completed_today}
        className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg active:scale-90",
          daily.completed_today 
            ? cn(p.bg, "border-transparent text-white shadow-lg", p.shadow) 
            : cn("bg-surface-container-highest/20 border-white/10 hover:border-white/20 text-transparent", p.text, "hover:text-current")
        )}
      >
        <Check size={24} strokeWidth={4} />
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center justify-between">
          <h3 className={cn("text-sm font-black text-on-surface truncate tracking-tight transition-all", daily.completed_today && "line-through opacity-40")}>
            {daily.name}
          </h3>
          <MoreVertical size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary/60">Daily Loop</span>
          {daily.reminder_time && (
            <>
              <div className="w-[2px] h-[2px] rounded-full bg-on-surface-variant/20" />
              <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant/40 font-bold">
                <Clock size={10} />
                <span>{daily.reminder_time}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest/40 border border-outline-variant/10", daily.streak > 2 && "text-orange-400")}>
          <Flame size={12} fill={daily.streak > 2 ? "currentColor" : "none"} />
          <span className="text-[10px] font-black">{daily.streak}</span>
        </div>
      </div>
    </motion.div>
  )
}

function TodoCard({ todo, onToggle, onEdit }: { todo: Task; onToggle: () => void; onEdit: () => void }) {
  const priorityColors: any = {
    critical: 'text-red-400 bg-red-400/10 border-red-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-4 p-5 rounded-[1.75rem] bg-surface-container-low/80 border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container-medium group h-20",
        todo.status === 'done' && "opacity-50"
      )}
    >
      <button 
        onClick={onToggle}
        className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg active:scale-90",
          todo.status === 'done' 
            ? "bg-tertiary-fixed-dim border-tertiary-fixed-dim text-on-tertiary-fixed shadow-tertiary-fixed/20" 
            : "bg-surface-container-highest/20 border-outline-variant hover:border-tertiary-fixed-dim text-transparent hover:text-tertiary-fixed-dim/60"
        )}
      >
        <Check size={24} strokeWidth={4} />
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center justify-between">
          <h3 className={cn("text-sm font-black text-on-surface truncate tracking-tight transition-all", todo.status === 'done' && "line-through opacity-40")}>
            {todo.title}
          </h3>
          <MoreVertical size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border", priorityColors[todo.priority] || priorityColors.medium)}>
            {todo.priority || 'medium'}
          </span>
          {todo.estimated_minutes && (
            <div className="flex items-center gap-1 text-[9px] text-on-surface-variant/40 font-bold">
              <Clock size={10} />
              {todo.estimated_minutes}m
            </div>
          )}
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant/40 transition-colors">
          <Zap size={16} />
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40 border-2 border-dashed border-outline-variant/10 rounded-[2rem] bg-surface-container-highest/5 transition-all hover:bg-surface-container-highest/10">
      <Sparkles className="mb-4 opacity-80" size={32} />
      <p className="text-sm font-black tracking-tight">System clear</p>
      <p className="text-[10px] uppercase tracking-[0.3em] mt-1.5 font-bold">Awaiting protocol initialization</p>
    </div>
  )
}

function StatCard({ label, value, sub, icon, color, progress }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string; progress?: number }) {
  const colorMap: any = {
    primary: 'text-primary border-primary/20 bg-primary/5 shadow-primary/10',
    secondary: 'text-secondary border-secondary/20 bg-secondary/5 shadow-secondary/10',
    tertiary: 'text-tertiary-fixed-dim border-tertiary-fixed-dim/20 bg-tertiary-fixed-dim/5 shadow-tertiary-fixed-dim/10'
  }
  const barColor: any = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary-fixed-dim'
  }

  return (
    <div className={cn("p-6 rounded-[2rem] border backdrop-blur-md shadow-2xl relative overflow-hidden group", colorMap[color])}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-on-surface/5 flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
        </div>
        <span className="text-2xl font-black font-headline tracking-tighter">{value}</span>
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-30">{sub}</p>
      
      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full bg-on-surface/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn("h-full", barColor[color])}
          />
        </div>
      )}
      
      {/* Decorative pulse */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.07] transition-opacity" />
    </div>
  )
}

function EditProtocolModal({ 
  item, 
  onClose, 
  onSave, 
  onDelete 
}: { 
  item: Habit | Task; 
  onClose: () => void; 
  onSave: (updates: any) => void;
  onDelete: () => void;
}) {
  const isHabit = 'name' in item
  const [formData, setFormData] = useState<any>({ ...item })
  const [newChecklistItem, setNewChecklistItem] = useState('')

  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return
    const checklist = formData.checklist || []
    setFormData({
      ...formData,
      checklist: [...checklist, { text: newChecklistItem, completed: false }]
    })
    setNewChecklistItem('')
  }

  const toggleChecklist = (idx: number) => {
    const checklist = [...(formData.checklist || [])]
    checklist[idx].completed = !checklist[idx].completed
    setFormData({ ...formData, checklist })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl bg-surface-container-low border border-outline-variant/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {isHabit ? <Flame size={20} /> : <ListTodo size={20} />}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-on-surface">Edit Protocol</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant/40">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Title/Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Protocol Identification</label>
              <input 
                value={isHabit ? (formData as Habit).name : (formData as Task).title}
                onChange={e => setFormData({ ...formData, [isHabit ? 'name' : 'title']: e.target.value })}
                className="w-full h-14 px-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
              />
            </div>

            {/* Description/Notes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Notes / Logs</label>
              <textarea 
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter extra details..."
                className="w-full h-32 p-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pillar */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Pillar Alignment</label>
                <div className="relative">
                  <select 
                    value={formData.pillar}
                    onChange={e => setFormData({ ...formData, pillar: e.target.value })}
                    className="w-full h-14 px-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold appearance-none cursor-pointer"
                  >
                    <option value="general">General</option>
                    <option value="fitness">Fitness</option>
                    <option value="skills">Skills</option>
                    <option value="time">Time</option>
                    <option value="style">Style</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 opacity-20 pointer-events-none" />
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Difficulty Scalar</label>
                <div className="relative">
                  <select 
                    value={formData.difficulty || 'medium'}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full h-14 px-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold appearance-none cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 opacity-20 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Frequency specific */}
            {isHabit && (formData as Habit).frequency === 'daily' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Daily Synchronization Time</label>
                <input 
                  type="time"
                  value={formData.reminder_time || ''}
                  onChange={e => setFormData({ ...formData, reminder_time: e.target.value })}
                  className="w-full h-14 px-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                />
              </div>
            )}

            {/* Task specific */}
            {!isHabit && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Priority Level</label>
                  <div className="relative">
                    <select 
                      value={(formData as Task).priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full h-14 px-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold appearance-none cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 opacity-20 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Due Date</label>
                  <input 
                    type="date"
                    value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full h-14 px-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Sub-Objectives Checklist</label>
              <div className="space-y-2">
                {(formData.checklist || []).map((item: any, idx: number) => (
                  <div key={idx} className="group flex items-center gap-3 p-4 rounded-2xl bg-surface-container-highest/10 border border-outline-variant/5">
                    <button onClick={() => toggleChecklist(idx)} className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", item.completed ? "bg-secondary border-secondary shadow-lg shadow-secondary/20" : "border-outline-variant/30 hover:border-outline-variant")}>
                      {item.completed && <Check size={14} strokeWidth={4} className="text-on-secondary" />}
                    </button>
                    <span className={cn("text-sm font-bold flex-1", item.completed && "line-through opacity-40")}>{item.text}</span>
                    <button 
                      onClick={() => {
                        const next = [...formData.checklist]
                        next.splice(idx, 1)
                        setFormData({ ...formData, checklist: next })
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="relative mt-2">
                  <input 
                    placeholder="Add step..."
                    value={newChecklistItem}
                    onChange={e => setNewChecklistItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}
                    className="w-full h-14 px-6 pr-14 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:opacity-30 font-bold"
                  />
                  <button onClick={handleAddChecklist} className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-primary text-on-primary shadow-lg active:scale-90 flex items-center justify-center transition-all">
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Identification Tags (comma separated)</label>
              <input 
                value={(formData.tags || []).join(', ')}
                onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                className="w-full h-14 px-6 rounded-2xl bg-surface-container-highest/20 border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-surface-container-highest/10 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button 
            onClick={onDelete}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 h-14 rounded-2xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all font-black text-sm uppercase tracking-widest"
          >
            <Trash2 size={18} />
            Purge Protocol
          </button>
          
          <div className="w-full sm:w-auto flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 h-14 rounded-2xl text-on-surface-variant font-bold hover:bg-surface-container-highest transition-all"
            >
              Abort
            </button>
            <button 
              onClick={() => onSave(formData)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 h-14 rounded-2xl bg-primary text-on-primary shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all font-black text-sm uppercase tracking-widest"
            >
              <Save size={18} />
              Commit
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

