'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Check,
  Clock,
  Zap,
  Flame,
  Calendar,
  ListTodo,
  CheckCircle2,
  Loader2,
  Trophy,
  Target,
  Sparkles,
  X,
  Trash2,
  AlertTriangle,
  Shield,
  Heart,
  Timer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDailies, type Daily } from '@/lib/hooks/useDailies'
import { useHabits, type Habit } from '@/lib/hooks/useHabits'
import { useTodos, type Todo } from '@/lib/hooks/useTodos'
import { DailyModal } from '@/components/dashboard/DailyModal'
import { HabitModal } from '@/components/dashboard/HabitModal'
import { toast } from 'sonner'

// ── Priority Config ──

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', xp: 35 },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', xp: 20 },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', xp: 10 },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', xp: 5 },
}

const CATEGORY_ICONS: Record<string, string> = {
  general: '📋', fitness: '💪', skills: '🧠', style: '👔', system: '⚙️',
}

const RESET_TYPE_CONFIG = {
  daily: { label: 'Daily', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  weekly: { label: 'Weekly', color: 'text-violet-400', bg: 'bg-violet-500/15' },
  monthly: { label: 'Monthly', color: 'text-amber-400', bg: 'bg-amber-500/15' },
}

// ── Midnight Countdown ──

function MidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1.5 text-xs text-white/40">
      <Timer size={12} />
      <span>Resets in {timeLeft}</span>
    </div>
  )
}

// ── Quick Add Input ──

function QuickAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const [value, setValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all text-sm"
        aria-label={`Add new ${placeholder}`}
      >
        <Plus size={14} />
        <span>{placeholder}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setIsOpen(false) }}
        placeholder={placeholder}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-all"
        aria-label={`New ${placeholder} input`}
      />
      <button onClick={handleSubmit} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all" aria-label="Confirm add">
        <Check size={14} />
      </button>
      <button onClick={() => { setIsOpen(false); setValue('') }} className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white/60 transition-all" aria-label="Cancel add">
        <X size={14} />
      </button>
    </div>
  )
}

// ── Daily Item ──

function DailyItem({ daily, onComplete, onDelete, onEdit }: {
  daily: Daily
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (daily: Daily) => void
}) {
  const config = PRIORITY_CONFIG[daily.priority]
  const icon = CATEGORY_ICONS[daily.category] || '📋'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
        daily.is_completed
          ? 'bg-emerald-500/5 border-emerald-500/15 opacity-60'
          : `bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10`
      )}
    >
      {/* Completion checkbox */}
      <button
        onClick={() => !daily.is_completed && onComplete(daily.id)}
        disabled={daily.is_completed}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          daily.is_completed
            ? 'bg-emerald-500 border-emerald-500'
            : `${config.border} hover:bg-white/10`
        )}
        aria-label={daily.is_completed ? 'Completed' : `Complete ${daily.title}`}
      >
        {daily.is_completed && <Check size={12} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(daily)}>
        <div className="flex items-center gap-2">
          <span className="text-xs">{icon}</span>
          <span className={cn('text-sm font-medium truncate hover:text-cyan-400 transition-colors', daily.is_completed ? 'line-through text-white/40 pointer-events-none' : 'text-white/90')}>
            {daily.title}
          </span>
        </div>
        {daily.subtasks && daily.subtasks.length > 0 && (
          <div className="text-xs text-white/30 mt-0.5">
            {daily.subtasks.filter(s => s.is_completed).length}/{daily.subtasks.length} subtasks
          </div>
        )}
      </div>

      {/* Priority badge */}
      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider', config.bg, config.color)}>
        {config.label}
      </span>

      {/* XP reward */}
      <span className="text-xs text-amber-400/70 font-mono">+{daily.xp_reward}</span>

      {/* Delete button */}
      <button
        onClick={() => onDelete(daily.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
        aria-label={`Delete ${daily.title}`}
      >
        <Trash2 size={12} />
      </button>
    </motion.div>
  )
}

// ── Habit Item ──

function HabitItem({ habit, onComplete, onDelete, onEdit }: {
  habit: Habit
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (habit: Habit) => void
}) {
  const resetConfig = RESET_TYPE_CONFIG[habit.reset_type]
  const icon = CATEGORY_ICONS[habit.category] || '📋'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
        habit.is_completed_this_cycle
          ? 'bg-emerald-500/5 border-emerald-500/15 opacity-60'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
      )}
    >
      {/* Completion */}
      <button
        onClick={() => !habit.is_completed_this_cycle && onComplete(habit.id)}
        disabled={habit.is_completed_this_cycle}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          habit.is_completed_this_cycle
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-violet-500/30 hover:bg-white/10'
        )}
        aria-label={habit.is_completed_this_cycle ? 'Completed this cycle' : `Complete ${habit.title}`}
      >
        {habit.is_completed_this_cycle && <Check size={12} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(habit)}>
        <div className="flex items-center gap-2">
          <span className="text-xs">{icon}</span>
          <span className={cn('text-sm font-medium truncate hover:text-violet-400 transition-colors', habit.is_completed_this_cycle ? 'line-through text-white/40 pointer-events-none' : 'text-white/90')}>
            {habit.title}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Streak */}
          {habit.current_streak > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-orange-400">
              <Flame size={10} /> {habit.current_streak}
            </span>
          )}
          {/* HP warning */}
          <span className="flex items-center gap-0.5 text-[10px] text-red-400/50">
            <Heart size={9} /> -{habit.hp_penalty}
          </span>
        </div>
      </div>

      {/* Reset type badge */}
      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider', resetConfig.bg, resetConfig.color)}>
        {resetConfig.label}
      </span>

      {/* XP reward */}
      <span className="text-xs text-amber-400/70 font-mono">+{habit.xp_reward}</span>

      {/* Delete */}
      <button
        onClick={() => onDelete(habit.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
        aria-label={`Delete ${habit.title}`}
      >
        <Trash2 size={12} />
      </button>
    </motion.div>
  )
}

// ── Todo Item ──

function TodoItem({ todo, onComplete, onDelete }: {
  todo: Todo
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const config = PRIORITY_CONFIG[todo.priority]
  const icon = CATEGORY_ICONS[todo.category] || '📋'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
        todo.is_completed
          ? 'bg-emerald-500/5 border-emerald-500/15 opacity-60'
          : todo.is_overdue
            ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/8'
            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
      )}
    >
      {/* Completion */}
      <button
        onClick={() => !todo.is_completed && onComplete(todo.id)}
        disabled={todo.is_completed}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          todo.is_completed
            ? 'bg-emerald-500 border-emerald-500'
            : todo.is_overdue
              ? 'border-red-500/40 hover:bg-red-500/10'
              : `${config.border} hover:bg-white/10`
        )}
        aria-label={todo.is_completed ? 'Completed' : `Complete ${todo.title}`}
      >
        {todo.is_completed && <Check size={12} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs">{icon}</span>
          <span className={cn('text-sm font-medium truncate', todo.is_completed ? 'line-through text-white/40' : 'text-white/90')}>
            {todo.title}
          </span>
          {todo.is_overdue && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-semibold">
              <AlertTriangle size={10} /> OVERDUE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {todo.due_date && (
            <span className={cn('flex items-center gap-0.5 text-xs', todo.is_overdue ? 'text-red-400' : 'text-white/30')}>
              <Calendar size={10} /> {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {todo.subtasks && todo.subtasks.length > 0 && (
            <span className="text-xs text-white/30">
              {todo.subtasks.filter(s => s.is_completed).length}/{todo.subtasks.length} subtasks
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider', config.bg, config.color)}>
        {config.label}
      </span>

      {/* XP reward */}
      <span className="text-xs text-amber-400/70 font-mono">+{todo.xp_reward}</span>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
        aria-label={`Delete ${todo.title}`}
      >
        <Trash2 size={12} />
      </button>
    </motion.div>
  )
}

// ── Column Panel ──

function PanelColumn({
  title,
  icon,
  iconColor,
  headerRight,
  footer,
  children,
}: {
  title: string
  icon: React.ReactNode
  iconColor: string
  headerRight?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', iconColor)}>
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-white/80 tracking-wide">{title}</h3>
        </div>
        {headerRight}
      </div>

      {/* Body */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-white/10">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01]">
          {footer}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ──

export function TimeDashboard() {
  const {
    dailies, loading: dailiesLoading, completedCount: dailiesCompleted,
    totalCount: dailiesTotal, completionRate: dailiesRate,
    createDaily, completeDaily, deleteDaily, updateDaily
  } = useDailies()

  const {
    habits, loading: habitsLoading, completedCount: habitsCompleted,
    totalCount: habitsTotal, totalStreak,
    createHabit, completeHabit, deleteHabit, updateHabit
  } = useHabits()

  const {
    todos, loading: todosLoading, overdueCount,
    remainingCount, completedCount: todosCompleted,
    createTodo, completeTodo, deleteTodo,
  } = useTodos()

  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false)
  const [editingDaily, setEditingDaily] = useState<Daily | null>(null)

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const isLoading = dailiesLoading || habitsLoading || todosLoading

  // ── Handlers ──

  const handleAddDaily = async (title: string) => {
    await createDaily({ title, priority: 'medium' })
  }

  const handleSaveDaily = async (data: any) => {
    if (editingDaily) {
      await updateDaily(editingDaily.id, data)
    } else {
      await createDaily(data)
    }
  }

  const handleDeleteDaily = async (id: string) => {
    await deleteDaily(id)
    setIsDailyModalOpen(false)
  }

  const handleAddHabit = async (title: string) => {
    await createHabit({ title, reset_type: 'daily' })
  }

  const handleSaveHabit = async (data: any) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data)
    } else {
      await createHabit(data)
    }
  }

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id)
    setIsHabitModalOpen(false)
  }

  const handleAddTodo = async (title: string) => {
    await createTodo({ title, priority: 'medium' })
  }

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          <span className="text-sm text-white/40">Initializing task system...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Stats Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs text-white/50">
              <span className="text-amber-400 font-semibold">{dailiesCompleted + habitsCompleted + todosCompleted}</span> completed today
            </span>
          </div>
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs text-red-400">{overdueCount} overdue</span>
            </div>
          )}
        </div>
        <MidnightCountdown />
      </div>

      {/* 3-Column Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── DAILIES PANEL ── */}
        <PanelColumn
          title="Dailies"
          icon={<Zap size={16} className="text-cyan-400" />}
          iconColor="bg-cyan-500/15"
          headerRight={
            <div className="flex items-center gap-2 text-xs text-white/30">
              <span>{dailiesCompleted}/{dailiesTotal}</span>
              <button 
                onClick={() => { setEditingDaily(null); setIsDailyModalOpen(true); }}
                className="text-cyan-400/60 hover:text-cyan-400 transition-colors p-1 bg-cyan-500/10 rounded-md hover:bg-cyan-500/20"
              >
                <Plus size={14} />
              </button>
            </div>
          }
          footer={
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${dailiesRate}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] text-white/30 font-mono">{dailiesRate}%</span>
              </div>
              <QuickAdd placeholder="Add daily..." onAdd={handleAddDaily} />
            </div>
          }
        >
          <AnimatePresence mode="popLayout">
            {dailies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-white/20">
                <Zap size={24} className="mb-2 opacity-50" />
                <span className="text-xs">No dailies yet</span>
              </div>
            ) : (
              dailies.map(daily => (
                <DailyItem
                  key={daily.id}
                  daily={daily}
                  onComplete={completeDaily}
                  onDelete={deleteDaily}
                  onEdit={(d) => { setEditingDaily(d); setIsDailyModalOpen(true); }}
                />
              ))
            )}
          </AnimatePresence>
        </PanelColumn>

        {/* ── HABITS PANEL ── */}
        <PanelColumn
          title="Habits"
          icon={<Flame size={16} className="text-violet-400" />}
          iconColor="bg-violet-500/15"
          headerRight={
            <div className="flex items-center gap-2">
              {totalStreak > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-400">
                  <Flame size={12} /> {totalStreak}
                </span>
              )}
              <span className="text-xs text-white/30">
                {habitsCompleted}/{habitsTotal}
              </span>
              <button 
                onClick={() => { setEditingHabit(null); setIsHabitModalOpen(true); }}
                className="text-violet-400/60 hover:text-violet-400 transition-colors p-1 bg-violet-500/10 rounded-md hover:bg-violet-500/20 ml-1"
              >
                <Plus size={14} />
              </button>
            </div>
          }
          footer={
            <QuickAdd placeholder="Add habit..." onAdd={handleAddHabit} />
          }
        >
          <AnimatePresence mode="popLayout">
            {habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-white/20">
                <Flame size={24} className="mb-2 opacity-50" />
                <span className="text-xs">No habits yet</span>
              </div>
            ) : (
              habits.map(habit => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onComplete={completeHabit}
                  onDelete={deleteHabit}
                  onEdit={(h) => { setEditingHabit(h); setIsHabitModalOpen(true); }}
                />
              ))
            )}
          </AnimatePresence>
        </PanelColumn>

        {/* ── TO-DOS PANEL ── */}
        <PanelColumn
          title="To-Dos"
          icon={<Target size={16} className="text-emerald-400" />}
          iconColor="bg-emerald-500/15"
          headerRight={
            <span className="text-xs text-white/30">
              {remainingCount} remaining
            </span>
          }
          footer={
            <QuickAdd placeholder="Add to-do..." onAdd={handleAddTodo} />
          }
        >
          <AnimatePresence mode="popLayout">
            {todos.filter(t => !t.is_completed).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-white/20">
                <CheckCircle2 size={24} className="mb-2 opacity-50" />
                <span className="text-xs">All clear!</span>
              </div>
            ) : (
              todos.filter(t => !t.is_completed).map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onComplete={completeTodo}
                  onDelete={deleteTodo}
                />
              ))
            )}
          </AnimatePresence>
        </PanelColumn>

      </div>

      <DailyModal
        isOpen={isDailyModalOpen}
        onClose={() => {
          setIsDailyModalOpen(false)
          setEditingDaily(null)
        }}
        daily={editingDaily}
        onSave={handleSaveDaily}
        onDelete={editingDaily ? handleDeleteDaily : undefined}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false)
          setEditingHabit(null)
        }}
        habit={editingHabit}
        onSave={handleSaveHabit}
        onDelete={editingHabit ? handleDeleteHabit : undefined}
      />
    </div>
  )
}
