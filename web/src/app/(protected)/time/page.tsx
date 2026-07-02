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
import { HabitsView } from '@/components/time/HabitsView'
import { ScheduleView } from '@/components/time/ScheduleView'
import { TimeDashboard } from '@/components/time/TimeDashboard'

type TimerState = 'idle' | 'active' | 'break' | 'paused'
type Priority = 'low' | 'medium' | 'high' | 'critical'

interface Todo {
  id: string
  title: string
  priority: Priority
  category: string
  is_completed: boolean
  is_overdue?: boolean
  completed_at: string | null
  xp_reward: number
}

interface PomodoroSession {
  id: string
  task?: { title: string }
  duration_minutes: number
  status: string
  started_at: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  high:     { label: 'High',     color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  medium:   { label: 'Medium',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  low:      { label: 'Low',      color: 'text-muted-foreground bg-muted border-border' },
}

const PILLAR_COLORS: Record<string, string> = {
  fitness: 'text-green-400',
  skills:  'text-primary',
  time:    'text-secondary',
  style:   'text-pink-400',
  general: 'text-muted-foreground',
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

  const strokeColor = state === 'break'
    ? 'var(--color-tertiary)'
    : state === 'active'
      ? 'var(--color-primary)'
      : 'var(--color-outline)'

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-surface-container)" strokeWidth={stroke} />
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
        <span className="text-5xl font-headline tracking-tighter tabular-nums text-foreground">
          {mins}:{secs}
        </span>
        <span className={cn(
          "text-[10px] mt-1",
          state === 'break' ? 'text-tertiary' :
          state === 'active' ? 'text-primary' : 'text-muted-foreground'
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
  const [activeTab, setActiveTab] = useState<'board' | 'focus' | 'habits' | 'schedule'>('board')
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60)
  const [totalSeconds, setTotalSeconds] = useState(workMinutes * 60)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)
  const [pomodoroHistory, setPomodoroHistory] = useState<PomodoroSession[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Ref tracks the current session ID so timer callbacks don't close over stale state
  const activeSessionIdRef = useRef<string | null>(null)

  // ── Task State ──
  const [todos, setTodos] = useState<Todo[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' })
  const [isLoading, setIsLoading] = useState(true)

  // Keep ref in sync so timer callbacks always see the latest session ID
  useEffect(() => { activeSessionIdRef.current = activeSessionId }, [activeSessionId])

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  useEffect(() => {
    if (session?.access_token) {
      fetchAll()
    }
  }, [session])

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab')
    if (tabParam === 'habits' || tabParam === 'schedule' || tabParam === 'focus' || tabParam === 'board') {
      setActiveTab(tabParam as any)
    }
  }, [])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [todosRes, histRes] = await Promise.all([
        fetch('/api/todos', { headers: headers() }),
        fetch('/api/pomodoro', { headers: headers() })
      ])
      const [todosData, histData] = await Promise.all([todosRes.json(), histRes.json()])
      if (todosRes.ok) setTodos(todosData.data || [])
      if (histRes.ok) setPomodoroHistory(histData)
    } catch { toast.error('Failed to load data') }
    finally { setIsLoading(false) }
  }

  // ── Timer Tick ──
  // Pure tick: no side effects inside the state updater (React can call updaters
  // twice in StrictMode; async calls inside updaters would double-fire).
  useEffect(() => {
    if (timerState !== 'active' && timerState !== 'break') return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerState])

  const handleTimerComplete = useCallback(async () => {
    clearInterval(intervalRef.current!)
    toast.success(`Focus session complete! +${workMinutes + 5} XP`)
    const sessionId = activeSessionIdRef.current
    if (sessionId) {
      await fetch('/api/pomodoro', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ session_id: sessionId, action: 'complete' })
      })
      setActiveSessionId(null)
    }
    fetchAll()
    setTimerState('break')
    setSecondsLeft(breakMinutes * 60)
    setTotalSeconds(breakMinutes * 60)
  }, [workMinutes, breakMinutes, headers])

  const switchToWork = useCallback(() => {
    setTimerState('idle')
    setSecondsLeft(workMinutes * 60)
    setTotalSeconds(workMinutes * 60)
  }, [workMinutes])

  // ── Timer Completion ──
  // Watches for secondsLeft hitting 0 and fires the appropriate handler.
  // Runs as a separate effect so side effects never happen inside state updaters.
  useEffect(() => {
    if (secondsLeft !== 0) return
    if (timerState === 'active') handleTimerComplete()
    else if (timerState === 'break') switchToWork()
  }, [secondsLeft, timerState, handleTimerComplete, switchToWork])

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
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(newTask)
      })
      if (res.ok) {
        toast.success('Task created!')
        setIsAddingTask(false)
        setNewTask({ title: '', priority: 'medium' })
        fetchAll()
      }
    } catch { toast.error('Failed to create task') }
  }

  const handleCompleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}/complete`, {
        method: 'POST',
        headers: headers(),
      })
      const json = await res.json()
      if (res.ok) {
        const xp = json.data?.xp_awarded || 0
        toast.success(`Task completed! +${xp} XP`)
        fetchAll()
      }
    } catch { toast.error('Failed to complete task') }
  }

  const activeTodos = todos.filter(t => !t.is_completed)
  const completedTodos = todos.filter(t => t.is_completed)
  const displayedTodos = showCompleted ? completedTodos : activeTodos
  const completedToday = pomodoroHistory.filter(s => s.status === 'completed').length
  const totalFocusMinutes = pomodoroHistory
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
          <Timer size={28} />
        </div>
        <div>
          <h1 className="text-4xl  font-headline tracking-tighter text-foreground">Selfup Time Command</h1>
          <p className="text-muted-foreground text-sm">Deep work. Zero distractions. Maximum XP.</p>
        </div>
      </div>

      <div className="flex border-b border-border mb-6 overflow-x-auto">
        {(['board', 'focus', 'habits', 'schedule'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 md:flex-none min-w-[120px] py-4 text-[11px]  transition-all relative",
              activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-muted-foreground'
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="timePageTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'board' && <TimeDashboard />}
      {activeTab === 'focus' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left: Pomodoro Timer ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-muted border border-border rounded-xl p-8 space-y-8 relative overflow-hidden">
            {/* Subtle state indicator */}
            <div className={cn(
              "absolute inset-0 transition-all duration-1000 pointer-events-none rounded-xl",
              timerState === 'active' ? 'bg-primary/5' :
              timerState === 'break' ? 'bg-tertiary/5' : 'opacity-0'
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
                      "px-4 py-2 rounded-xl text-xs  border transition-all",
                      workMinutes === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >{m}m</button>
                ))}
              </div>
            )}

            {/* Link Task Dropdown */}
            {timerState === 'idle' && activeTodos.length > 0 && (
              <div className="relative z-10">
                <label className="text-[10px]   text-muted-foreground block mb-2 ml-1">Link Task (optional)</label>
                <select
                  value={linkedTaskId || ''}
                  onChange={e => setLinkedTaskId(e.target.value || null)}
                  className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 text-sm font-medium appearance-none"
                >
                  <option value="">No task linked</option>
                  {activeTodos.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 relative z-10">
              <button
                onClick={handleReset}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={timerState === 'active' ? handlePause : handleStart}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center  transition-all shadow-2xl",
                  timerState === 'break'
                    ? 'bg-tertiary/20 text-tertiary cursor-not-allowed opacity-50'
                    : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'
                )}
                disabled={timerState === 'break'}
              >
                {timerState === 'active' ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
              </button>

              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                {timerState === 'break' ? (
                  <Coffee size={18} className="text-tertiary" />
                ) : (
                  <Flame size={18} className="text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Today's stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border relative z-10">
              <div className="text-center">
                <p className="text-2xl  font-headline text-primary">{completedToday}</p>
                <p className="text-[10px]  text-muted-foreground">Sessions Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl  font-headline text-secondary">{totalFocusMinutes}m</p>
                <p className="text-[10px]  text-muted-foreground">Focused Today</p>
              </div>
            </div>
          </div>

          {/* Session History */}
          {pomodoroHistory.length > 0 && (
            <div className="bg-muted border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-[10px]   text-muted-foreground">Today's Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pomodoroHistory.slice(0, 8).map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      s.status === 'completed' ? 'bg-tertiary' : 'bg-muted-foreground'
                    )} />
                    <span className="text-xs font-medium text-foreground flex-1 truncate">
                      {s.task?.title || 'Free session'}
                    </span>
                    <span className="text-[10px]  text-muted-foreground">{s.duration_minutes}m</span>
                    {s.status === 'completed' && (
                      <CheckCircle2 size={14} className="text-tertiary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Task Manager ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-muted border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ListTodo size={20} className="text-secondary" />
                <h2 className="text-sm ">Task Board</h2>
              </div>
              <button
                onClick={() => setIsAddingTask(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs  hover:bg-primary/20 transition-all"
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
                  className="overflow-hidden border-b border-border"
                >
                  <div className="p-6 space-y-4 bg-surface-container/50">
                    <input
                      autoFocus
                      type="text"
                      placeholder="What needs to be done?"
                      value={newTask.title}
                      onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium text-sm"
                    />
                    <div className="flex gap-3 flex-wrap">
                      {(['low','medium','high','critical'] as Priority[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setNewTask(t => ({ ...t, priority: p }))}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px]  border transition-all",
                            newTask.priority === p ? PRIORITY_CONFIG[p].color : 'border-border text-muted-foreground'
                          )}
                        >{PRIORITY_CONFIG[p].label}</button>
                      ))}

                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAddTask} className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-xs">Add Task</button>
                      <button onClick={() => setIsAddingTask(false)} className="px-4 h-10 rounded-xl border border-border text-muted-foreground text-xs ">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {[{ key: 'active', label: 'Active', count: activeTodos.length }, { key: 'completed', label: 'Done', count: completedTodos.length }].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setShowCompleted(tab.key === 'completed')}
                  className={cn(
                    "flex-1 py-4 text-[10px]  transition-all relative",
                    (tab.key === 'completed') === showCompleted ? 'text-primary' : 'text-muted-foreground hover:text-muted-foreground'
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "ml-2 px-1.5 py-0.5 rounded-full text-[9px]",
                      (tab.key === 'completed') === showCompleted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}>{tab.count}</span>
                  )}
                  {(tab.key === 'completed') === showCompleted && (
                    <motion.div layoutId="taskTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Task List */}
            <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
              {isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              ) : displayedTodos.length === 0 ? (
                <div className="py-16 text-center">
                  <Circle size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-xs  text-muted-foreground">
                    {showCompleted ? 'No completed tasks yet' : 'All clear — add a task above'}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {displayedTodos.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={cn(
                        "flex items-center gap-4 p-5 hover:bg-surface-container/50 transition-all group",
                        task.is_completed && 'opacity-40'
                      )}
                    >
                      {/* Completion toggle */}
                      <button
                        onClick={() => !task.is_completed && handleCompleteTask(task.id)}
                        disabled={task.is_completed}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          task.is_completed
                            ? 'bg-tertiary border-tertiary text-white'
                            : 'border-border hover:border-primary'
                        )}
                      >
                        {task.is_completed && <CheckCircle2 size={16} />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium text-foreground truncate", task.is_completed && 'line-through')}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] ", PILLAR_COLORS[task.category] || 'text-muted-foreground')}>
                            {task.category}
                          </span>
                          <span className="text-[10px] text-amber-400/60 font-mono">+{task.xp_reward} XP</span>
                        </div>
                      </div>

                      {/* Priority badge */}
                      <span className={cn("px-2 py-1 rounded-lg text-[9px]  border flex-shrink-0 hidden sm:block", PRIORITY_CONFIG[task.priority]?.color)}>
                        {PRIORITY_CONFIG[task.priority]?.label}
                      </span>

                      {/* Link to pomodoro */}
                      {!task.is_completed && timerState === 'idle' && (
                        <button
                          onClick={() => { setLinkedTaskId(task.id); toast.success(`Linked: "${task.title}"`) }}
                          className={cn(
                            "p-2 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-all",
                            linkedTaskId === task.id ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'
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
      )}

      {activeTab === 'habits' && <HabitsView />}
      {activeTab === 'schedule' && <ScheduleView />}
    </div>
  )
}
