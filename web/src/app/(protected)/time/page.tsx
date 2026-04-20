'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Timer, Play, Pause, RotateCcw, CheckCircle2, Coffee,
  Plus, X, ChevronDown, Flame, Clock, ListTodo,
  Zap, Circle, AlertCircle, Trophy, Loader2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type TimerState = 'idle' | 'active' | 'break' | 'paused'
type TaskStatus = 'todo' | 'in_progress' | 'done'
type Priority = 'low' | 'medium' | 'high' | 'critical'

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: Priority
  pillar: string
  estimated_minutes: number | null
  completed_at: string | null
}

interface PomodoroSession {
  id: string
  task?: { title: string }
  duration_minutes: number
  status: string
  started_at: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; glow: string }> = {
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10 border-red-500/20', glow: 'shadow-red-500/20' },
  high:     { label: 'High',     color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', glow: 'shadow-orange-500/20' },
  medium:   { label: 'Medium',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', glow: 'shadow-yellow-500/20' },
  low:      { label: 'Low',      color: 'text-on-surface-variant/60 bg-surface-container-highest/30 border-outline-variant/10', glow: '' },
}

const PILLAR_COLORS: Record<string, string> = {
  fitness: 'text-green-400',
  skills:  'text-primary',
  time:    'text-secondary',
  style:   'text-pink-400',
  general: 'text-on-surface-variant/60',
}

function CircularTimer({
  seconds, totalSeconds, state
}: { seconds: number; totalSeconds: number; state: TimerState }) {
  const size = 240
  const stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = state === 'idle' ? 0 : (seconds / totalSeconds)
  const offset = circ - pct * circ

  const glowColor = state === 'break'
    ? 'rgba(107,255,193,0.3)'
    : state === 'active'
      ? 'rgba(174,162,255,0.4)'
      : 'rgba(100,100,120,0.2)'

  const strokeColor = state === 'break' ? '#6bffc1' : state === 'active' ? '#aea2ff' : '#48474d'

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 20px ${glowColor})` }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f1f26" strokeWidth={stroke} />
        {/* Progress */}
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          initial={{ strokeDashoffset: circ }}
          transition={{ duration: 0.5 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black font-headline tracking-tighter tabular-nums text-on-surface">
          {mins}:{secs}
        </span>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-[0.3em] mt-1",
          state === 'break' ? 'text-tertiary-fixed-dim' :
          state === 'active' ? 'text-primary' : 'text-on-surface-variant/40'
        )}>
          {state === 'break' ? 'Rest Phase' : state === 'active' ? 'Focus Mode' : state === 'paused' ? 'Paused' : 'Ready'}
        </span>
      </div>
    </div>
  )
}

export default function TimePage() {
  const { session } = useAuthStore()

  // ── Timer State ──
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60)
  const [totalSeconds, setTotalSeconds] = useState(workMinutes * 60)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)
  const [pomodoroHistory, setPomodoroHistory] = useState<PomodoroSession[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Task State ──
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskTab, setTaskTab] = useState<TaskStatus>('todo')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', pillar: 'general', estimated_minutes: 25 })
  const [isLoading, setIsLoading] = useState(true)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  useEffect(() => {
    if (session?.access_token) {
      fetchAll()
    }
  }, [session])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [tasksRes, histRes] = await Promise.all([
        fetch('/api/tasks', { headers: headers() }),
        fetch('/api/pomodoro', { headers: headers() })
      ])
      const [tasksData, histData] = await Promise.all([tasksRes.json(), histRes.json()])
      if (tasksRes.ok) setTasks(tasksData)
      if (histRes.ok) setPomodoroHistory(histData)
    } catch { toast.error('Failed to load data') }
    finally { setIsLoading(false) }
  }

  // ── Timer Tick ──
  useEffect(() => {
    if (timerState === 'active' || timerState === 'break') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            if (timerState === 'active') handleTimerComplete()
            else switchToWork()
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerState])

  const handleTimerComplete = useCallback(async () => {
    clearInterval(intervalRef.current!)
    toast.success(`Focus session complete! +${workMinutes + 5} XP`)
    if (activeSessionId) {
      await fetch('/api/pomodoro', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ session_id: activeSessionId, action: 'complete' })
      })
      setActiveSessionId(null)
    }
    fetchAll()
    // Switch to break
    setTimerState('break')
    setSecondsLeft(breakMinutes * 60)
    setTotalSeconds(breakMinutes * 60)
  }, [activeSessionId, workMinutes, breakMinutes, headers])

  const switchToWork = useCallback(() => {
    setTimerState('idle')
    setSecondsLeft(workMinutes * 60)
    setTotalSeconds(workMinutes * 60)
  }, [workMinutes])

  const handleStart = async () => {
    if (timerState === 'paused') { setTimerState('active'); return }
    try {
      const res = await fetch('/api/pomodoro', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          task_id: linkedTaskId,
          duration_minutes: workMinutes,
          break_minutes: breakMinutes
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setActiveSessionId(data.id)
      setTimerState('active')
      setSecondsLeft(workMinutes * 60)
      setTotalSeconds(workMinutes * 60)
    } catch (e: any) {
      toast.error(e.message || 'Failed to start session')
    }
  }

  const handlePause = () => setTimerState('paused')

  const handleReset = async () => {
    clearInterval(intervalRef.current!)
    if (activeSessionId) {
      await fetch('/api/pomodoro', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ session_id: activeSessionId, action: 'cancel' })
      })
      setActiveSessionId(null)
    }
    setTimerState('idle')
    setSecondsLeft(workMinutes * 60)
    setTotalSeconds(workMinutes * 60)
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(newTask)
      })
      if (res.ok) {
        toast.success('Task created!')
        setIsAddingTask(false)
        setNewTask({ title: '', priority: 'medium', pillar: 'general', estimated_minutes: 25 })
        fetchAll()
      }
    } catch { toast.error('Failed to create task') }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        if (status === 'done') toast.success('+50 XP for completing the task!')
        fetchAll()
      }
    } catch { toast.error('Failed to update task') }
  }

  const filteredTasks = tasks.filter(t => t.status === taskTab)
  const completedToday = pomodoroHistory.filter(s => s.status === 'completed').length
  const totalFocusMinutes = pomodoroHistory
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shadow-[0_0_20px_rgba(168,140,251,0.1)]">
          <Timer size={28} />
        </div>
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Time Command</h1>
          <p className="text-on-surface-variant/60 text-sm">Deep work. Zero distractions. Maximum XP.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left: Pomodoro Timer ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 space-y-8 relative overflow-hidden">
            {/* Background glow */}
            <div className={cn(
              "absolute inset-0 transition-all duration-1000 pointer-events-none",
              timerState === 'active' ? 'bg-primary/3' :
              timerState === 'break' ? 'bg-tertiary-fixed/3' : 'opacity-0'
            )} />

            {/* Timer */}
            <div className="flex justify-center relative z-10">
              <CircularTimer seconds={secondsLeft} totalSeconds={totalSeconds} state={timerState} />
            </div>

            {/* Duration Controls */}
            {timerState === 'idle' && (
              <div className="flex items-center justify-center gap-6 relative z-10">
                {[15, 25, 50].map(m => (
                  <button
                    key={m}
                    onClick={() => { setWorkMinutes(m); setSecondsLeft(m * 60); setTotalSeconds(m * 60) }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                      workMinutes === m
                        ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                        : 'border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
                    )}
                  >{m}m</button>
                ))}
              </div>
            )}

            {/* Link Task Dropdown */}
            {timerState === 'idle' && tasks.filter(t => t.status !== 'done').length > 0 && (
              <div className="relative z-10">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 block mb-2 ml-1">Link Task (optional)</label>
                <select
                  value={linkedTaskId || ''}
                  onChange={e => setLinkedTaskId(e.target.value || null)}
                  className="w-full h-12 px-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 text-sm font-medium appearance-none"
                >
                  <option value="">No task linked</option>
                  {tasks.filter(t => t.status !== 'done').map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 relative z-10">
              <button
                onClick={handleReset}
                className="w-12 h-12 rounded-full border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={timerState === 'active' ? handlePause : handleStart}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center font-black transition-all shadow-2xl",
                  timerState === 'break'
                    ? 'bg-tertiary-fixed-dim text-on-surface cursor-not-allowed opacity-50'
                    : 'bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-primary/30'
                )}
                disabled={timerState === 'break'}
              >
                {timerState === 'active' ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
              </button>

              <div className="w-12 h-12 rounded-full border border-outline-variant/10 flex items-center justify-center">
                {timerState === 'break' ? (
                  <Coffee size={18} className="text-tertiary-fixed-dim" />
                ) : (
                  <Flame size={18} className="text-on-surface-variant/30" />
                )}
              </div>
            </div>

            {/* Today's stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-outline-variant/10 relative z-10">
              <div className="text-center">
                <p className="text-2xl font-black font-headline text-primary">{completedToday}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Sessions Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black font-headline text-secondary">{totalFocusMinutes}m</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Focused Today</p>
              </div>
            </div>
          </div>

          {/* Session History */}
          {pomodoroHistory.length > 0 && (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Today's Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pomodoroHistory.slice(0, 8).map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      s.status === 'completed' ? 'bg-tertiary-fixed-dim' : 'bg-on-surface-variant/20'
                    )} />
                    <span className="text-xs font-medium text-on-surface flex-1 truncate">
                      {s.task?.title || 'Free session'}
                    </span>
                    <span className="text-[10px] font-black text-on-surface-variant/40">{s.duration_minutes}m</span>
                    {s.status === 'completed' && (
                      <CheckCircle2 size={14} className="text-tertiary-fixed-dim flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Task Manager ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ListTodo size={20} className="text-secondary" />
                <h2 className="text-sm font-black uppercase tracking-widest">Task Board</h2>
              </div>
              <button
                onClick={() => setIsAddingTask(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                <Plus size={14} />
                Add Task
              </button>
            </div>

            {/* Add Task Form */}
            <AnimatePresence>
              {isAddingTask && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-outline-variant/10"
                >
                  <div className="p-6 space-y-4 bg-surface-container-medium/50">
                    <input
                      autoFocus
                      type="text"
                      placeholder="What needs to be done?"
                      value={newTask.title}
                      onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      className="w-full h-12 px-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium text-sm"
                    />
                    <div className="flex gap-3 flex-wrap">
                      {(['low','medium','high','critical'] as Priority[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setNewTask(t => ({ ...t, priority: p }))}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            newTask.priority === p ? PRIORITY_CONFIG[p].color : 'border-outline-variant/10 text-on-surface-variant/40'
                          )}
                        >{PRIORITY_CONFIG[p].label}</button>
                      ))}
                      <input
                        type="number"
                        placeholder="Est. min"
                        value={newTask.estimated_minutes}
                        onChange={e => setNewTask(t => ({ ...t, estimated_minutes: Number(e.target.value) }))}
                        className="w-24 h-8 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-xs font-medium text-on-surface focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAddTask} className="flex-1 h-10 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-widest">Add Task</button>
                      <button onClick={() => setIsAddingTask(false)} className="px-4 h-10 rounded-xl border border-outline-variant/10 text-on-surface-variant text-xs font-black uppercase">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex border-b border-outline-variant/10">
              {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(tab => {
                const count = tasks.filter(t => t.status === tab).length
                return (
                  <button
                    key={tab}
                    onClick={() => setTaskTab(tab)}
                    className={cn(
                      "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                      taskTab === tab ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                    )}
                  >
                    {tab.replace('_', ' ')}
                    {count > 0 && (
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 rounded-full text-[9px]",
                        taskTab === tab ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-on-surface-variant/40'
                      )}>{count}</span>
                    )}
                    {taskTab === tab && (
                      <motion.div layoutId="taskTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Task List */}
            <div className="divide-y divide-outline-variant/5 max-h-[480px] overflow-y-auto">
              {isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="py-16 text-center">
                  <Circle size={32} className="text-on-surface-variant/20 mx-auto mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/30">
                    {taskTab === 'done' ? 'No completed tasks yet' : 'All clear — add a task above'}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredTasks.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={cn(
                        "flex items-center gap-4 p-5 hover:bg-surface-container-medium/30 transition-all group",
                        task.status === 'done' && 'opacity-40'
                      )}
                    >
                      {/* Status toggle */}
                      <button
                        onClick={() => {
                          if (task.status === 'todo') handleStatusChange(task.id, 'in_progress')
                          else if (task.status === 'in_progress') handleStatusChange(task.id, 'done')
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          task.status === 'done'
                            ? 'bg-tertiary-fixed-dim border-tertiary-fixed-dim text-on-surface'
                            : task.status === 'in_progress'
                              ? 'border-primary text-primary hover:bg-primary hover:text-on-primary'
                              : 'border-outline-variant hover:border-primary'
                        )}
                      >
                        {task.status === 'done' && <CheckCircle2 size={16} />}
                        {task.status === 'in_progress' && <Zap size={12} fill="currentColor" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold text-on-surface truncate", task.status === 'done' && 'line-through')}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", PILLAR_COLORS[task.pillar] || 'text-on-surface-variant/40')}>
                            {task.pillar}
                          </span>
                          {task.estimated_minutes && (
                            <span className="flex items-center gap-1 text-[10px] text-on-surface-variant/30">
                              <Clock size={10} />
                              {task.estimated_minutes}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Priority badge */}
                      <span className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex-shrink-0 hidden sm:block", PRIORITY_CONFIG[task.priority]?.color)}>
                        {PRIORITY_CONFIG[task.priority]?.label}
                      </span>

                      {/* Link to pomodoro */}
                      {task.status !== 'done' && timerState === 'idle' && (
                        <button
                          onClick={() => { setLinkedTaskId(task.id); toast.success(`Linked: "${task.title}"`) }}
                          className={cn(
                            "p-2 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-all",
                            linkedTaskId === task.id ? 'bg-primary/20 text-primary' : 'hover:bg-surface-container-highest text-on-surface-variant/40'
                          )}
                          title="Link to Pomodoro"
                        >
                          <Timer size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
