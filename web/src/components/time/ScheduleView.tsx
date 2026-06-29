'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { 
  Loader2, 
  Calendar, 
  Clock, 
  Trash2, 
  GripHorizontal, 
  ChevronDown, 
  Sparkles,
  Zap,
  Target,
  Clock3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Todo {
  id: string
  title: string
  is_completed: boolean
  priority: string
  category: string
  scheduled_start: string | null
  scheduled_end: string | null
  xp_reward: number
}

interface Habit {
  id: string
  title: string
  category: string
  is_completed_this_cycle: boolean
}

interface DragState {
  id: string | null
  type: 'task' | 'habit'
  offsetX: number
  offsetY: number
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)
const HOUR_HEIGHT = 90

const CATEGORY_COLORS: Record<string, string> = {
  fitness: 'rgba(244, 63, 94, 0.1)', // Rose
  skills: 'rgba(59, 130, 246, 0.1)',  // Blue
  time: 'rgba(34, 211, 238, 0.1)',    // Cyan
  style: 'rgba(147, 197, 253, 0.1)',   // Sky
  general: 'rgba(30, 41, 59, 0.1)'    // Slate
}

const CATEGORY_BORDERS: Record<string, string> = {
  fitness: 'rgba(244, 63, 94, 0.5)',
  skills: 'rgba(59, 130, 246, 0.5)',
  time: 'rgba(34, 211, 238, 0.5)',
  style: 'rgba(147, 197, 253, 0.5)',
  general: 'rgba(71, 85, 105, 0.5)'
}

export function ScheduleView() {
  const { session } = useAuthStore()
  const [allTodos, setAllTodos] = useState<Todo[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [systemLogic, setSystemLogic] = useState<string | null>(null)
  const [lastBatchIds, setLastBatchIds] = useState<string[]>([])
  const [dragState, setDragState] = useState<DragState>({ id: null, type: 'task', offsetX: 0, offsetY: 0 })
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDateStr === todayStr

  const scheduledTasks = allTodos.filter(t => 
    t.scheduled_start && 
    t.scheduled_end && 
    t.scheduled_start.startsWith(selectedDateStr)
  )
  
  const unscheduledTasks = allTodos.filter(t => 
    !t.is_completed && (
      !t.scheduled_start || 
      !t.scheduled_start.startsWith(selectedDateStr)
    )
  )

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [todosRes, habitsRes] = await Promise.all([
        fetch('/api/todos', { headers: { Authorization: `Bearer ${session?.access_token}` } }),
        fetch('/api/habits', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      ])
      
      if (todosRes.ok) {
        const json = await todosRes.json()
        setAllTodos(json.data || [])
      }
      if (habitsRes.ok) {
        const json = await habitsRes.json()
        setHabits(json.data || [])
      }
    } catch {
      toast.error('Failed to load schedule data')
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session?.access_token) fetchData()
    
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [session, fetchData])

  const getTaskStyle = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const startHour = s.getHours() + s.getMinutes() / 60
    const duration = (e.getTime() - s.getTime()) / (1000 * 60 * 60)

    const top = (startHour - 6) * HOUR_HEIGHT
    const height = duration * HOUR_HEIGHT

    return { top: `${top}px`, height: `${Math.max(45, height)}px` }
  }

  const getCurrentTimeTop = () => {
    if (!isToday) return -100
    const hour = currentTime.getHours() + currentTime.getMinutes() / 60
    if (hour < 6 || hour > 24) return -100
    return (hour - 6) * HOUR_HEIGHT
  }

  const handlePreviousDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    setSelectedDate(prev)
  }

  const handleNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    setSelectedDate(next)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const handleTimelineMouseEnter = (hour: number) => {
    if (dragState.id) setHoveredHour(hour)
  }

  const handleDragStart = (e: React.DragEvent, id: string, type: 'task' | 'habit') => {
    e.dataTransfer.effectAllowed = 'move'
    setDragState({ id, type, offsetX: e.clientX, offsetY: e.clientY })
  }

  const handleTimelineDrop = async (e: React.DragEvent, targetHour: number) => {
    e.preventDefault()
    if (!dragState.id) return

    const startDate = new Date(selectedDate)
    startDate.setHours(targetHour, 0, 0, 0)
    
    let durationMinutes = 60
    if (dragState.type === 'task') {
      // Todos don't have estimated_minutes, default to 60
      durationMinutes = 60
    }

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

    try {
      if (dragState.type === 'task') {
        const res = await fetch(`/api/todos/${dragState.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            scheduled_start: startDate.toISOString(),
            scheduled_end: endDate.toISOString()
          })
        })

        if (res.ok) {
          toast.success('Task scheduled!')
          await fetchData()
        }
      }
    } catch {
      toast.error('Error scheduling item')
    }

    setDragState({ id: null, type: 'task', offsetX: 0, offsetY: 0 })
    setHoveredHour(null)
  }

  const handleAutoSchedule = async () => {
    setIsOptimizing(true)
    setSystemLogic(null)
    try {
      const res = await fetch('/api/time/auto-schedule', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      
      if (!res.ok) throw new Error()
      
      const { schedule, logic } = await res.json()
      setSystemLogic(logic)
      
      const updates = schedule
        .filter((item: any) => item.type === 'task')
        .map((item: any) => {
          const start = new Date(selectedDate)
          const [h, m] = item.start.split(':')
          start.setHours(parseInt(h), parseInt(m), 0, 0)
          
          const end = new Date(selectedDate)
          const [eh, em] = item.end.split(':')
          end.setHours(parseInt(eh), parseInt(em), 0, 0)

          return {
            id: item.id,
            scheduled_start: start.toISOString(),
            scheduled_end: end.toISOString()
          }
        })

      if (updates.length > 0) {
        const batchRes = await fetch('/api/todos/batch', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ updates })
        })

        if (!batchRes.ok) throw new Error('Batch update failed')
        setLastBatchIds(updates.map((u: any) => u.id))
      }
      
      toast.success('System optimized your schedule!')
      await fetchData()
    } catch {
      toast.error('Auto-schedule failed')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleUnscheduleTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/todos/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          scheduled_start: null,
          scheduled_end: null
        })
      })

      if (res.ok) {
        toast.success('Task unscheduled')
        await fetchData()
      }
    } catch {
      toast.error('Error unscheduling task')
    }
  }

  const handleRevertSchedule = async () => {
    if (lastBatchIds.length === 0) return
    
    setIsLoading(true)
    try {
      const updates = lastBatchIds.map(id => ({
        id,
        scheduled_start: null,
        scheduled_end: null
      }))

      const res = await fetch('/api/todos/batch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ updates })
      })

      if (res.ok) {
        toast.success('Schedule reverted')
        setSystemLogic(null)
        setLastBatchIds([])
        await fetchData()
      }
    } catch {
      toast.error('Failed to revert')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 ">
      {/* Header with Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-6 py-4  relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary/10 group-hover:bg-primary/20 transition-colors" />
            <button
              onClick={handlePreviousDay}
              className="p-2 hover:bg-primary/10 rounded-lg transition-all text-muted-foreground hover:text-primary border border-transparent hover:border-border"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-56 text-center">
              <p className="text-[10px]   text-muted-foreground mb-1">Schedule</p>
              <p className="text-xl  text-foreground">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </p>
            </div>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-primary/10 rounded-lg transition-all text-muted-foreground hover:text-primary border border-transparent hover:border-border"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {!isToday && (
            <button
              onClick={handleToday}
              className="px-6 py-3 bg-muted text-primary border border-border rounded-lg text-[10px]   hover:bg-primary/10 transition-all "
            >
              Back to Present
            </button>
          )}
        </div>
        <button
          onClick={handleAutoSchedule}
          disabled={isOptimizing}
          className="relative group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl   text-[10px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden  border border-primary/30"
        >
          {isOptimizing ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Sparkles size={18} className="group-hover:animate-pulse" />
          )}
          <span>{isOptimizing ? 'Planning...' : 'Auto Schedule'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
      </div>

      <AnimatePresence>
        {systemLogic && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-muted border border-border rounded-xl p-6 flex gap-6 items-start relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-muted blur-3xl pointer-events-none" />
            <div className="p-3 bg-primary/10 rounded-lg shrink-0 border border-border">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="text-[10px]   text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  AI Planning Notes
                </div>
                <button 
                  onClick={handleRevertSchedule}
                  className="text-[9px]   text-muted-foreground hover:text-rose-500 transition-colors border-b border-transparent hover:border-destructive/20"
                >
                  [ REVERT SCHEDULE ]
                </button>
              </div>
              <p className="text-sm text-foreground font-medium leading-relaxed tracking-wide ">
                "{systemLogic}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
        {/* Loading Overlay */}
        <AnimatePresence>
          {isOptimizing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-card  rounded-xl border border-border"
            >
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full animate-pulse" />
                  <Loader2 className="animate-spin text-primary relative z-10" size={56} />
                </div>
                <h4 className="text-2xl   text-foreground">Planning...</h4>
                <p className="text-[10px] text-muted-foreground   mt-2">Analyzing your tasks, habits, and goals.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side Panel: Backlog & Habits */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-2 h-16 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
            <h3 className="text-[10px]   text-muted-foreground mb-6 flex items-center gap-2">
              <Target size={16} /> Backlog <span className="text-muted-foreground">[{unscheduledTasks.length}]</span>
            </h3>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-12 bg-primary/[0.02] rounded-xl border border-dashed border-border">
                  <CheckCircle2 className="mx-auto text-muted-foreground mb-3" size={32} />
                  <p className="text-[10px]  text-muted-foreground ">No Pending Tasks</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {unscheduledTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, task.id, 'task')}
                      className="group p-4 bg-card border border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-border transition-all hover:bg-muted relative overflow-hidden"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("w-1 h-10 rounded-full shrink-0 mt-0.5", 
                          task.priority === 'high' ? 'bg-rose-500' : 'bg-primary/40')} 
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-xs  text-foreground truncate">{task.title}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[8px]   px-2 py-0.5 bg-primary/10 rounded text-primary border border-border">
                              {task.category}
                            </span>
                            <span className="text-[9px]  text-muted-foreground flex items-center gap-1.5">
                              <Clock3 size={10} /> +{task.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Habits Mini-Panel */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-16 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
            <h3 className="text-[10px]   text-muted-foreground mb-6 flex items-center gap-2">
              <Zap size={16} /> Active Habits
            </h3>
            <div className="space-y-3">
              {habits.map(habit => (
                <div 
                  key={habit.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, habit.id, 'habit')}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all cursor-grab relative overflow-hidden group/item",
                    habit.is_completed_this_cycle 
                      ? "bg-muted border-border opacity-40 shadow-inner" 
                      : "bg-card border-border hover:border-border hover:bg-muted"
                  )}
                >
                  <span className="text-[11px]  text-foreground">{habit.title}</span>
                  {habit.is_completed_this_cycle ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <GripHorizontal size={16} className="text-muted-foreground group-hover/item:text-primary transition-colors" />
                  )}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover/item:bg-primary/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-xl relative overflow-hidden flex flex-col shadow-2xl">
            {/* Timeline Header */}
            <div className="bg-background/95  border-b border-border p-6 sticky top-0 z-20 flex items-center justify-between">
              <div>
                <p className="text-[10px]   text-muted-foreground mb-1">Timeline</p>
                <p className="text-sm  text-foreground">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]  text-muted-foreground ">
                {isToday && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse " />
                    Current Time
                  </>
                )}
              </div>
            </div>

            {/* Scrollable timeline */}
            <div className="flex-1 overflow-y-auto max-h-[850px] custom-scrollbar bg-primary/[0.01]" style={{ backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
              <div ref={containerRef} className="relative w-full p-6" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                
                {/* Current Time Line */}
                <div 
                  className="absolute left-0 right-0 z-30 pointer-events-none transition-all duration-1000 ease-linear"
                  style={{ top: `${getCurrentTimeTop()}px` }}
                >
                  <div className="relative">
                    <div className="absolute left-0 w-24 flex justify-end pr-6 -top-3.5">
                      <span className="bg-primary text-primary-foreground text-[9px]  px-2 py-1 rounded border border-primary/30 ">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="h-px w-full bg-primary/60 " />
                    <div className="absolute left-24 -top-1.5 w-3 h-3 bg-primary rounded-full  border border-white" />
                  </div>
                </div>

                {/* Time grid lines */}
                {HOURS.map((hour, i) => (
                  <div
                    key={hour}
                    onMouseEnter={() => handleTimelineMouseEnter(hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleTimelineDrop(e, hour)}
                    className={cn(
                      'absolute left-0 right-0 flex items-start border-t border-border transition-all duration-300',
                      hoveredHour === hour && dragState.id && 'bg-muted border-t-primary/40 '
                    )}
                    style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="w-24 shrink-0 flex items-center justify-end pr-6 -mt-3.5">
                      <span className="text-[10px]  text-muted-foreground">
                        {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                      </span>
                    </div>
                    <div className="flex-1 h-full border-l border-border border-dashed" />
                  </div>
                ))}

                {/* Scheduled items */}
                <div className="absolute left-24 right-6 top-0 bottom-0 pointer-events-none">
                  <AnimatePresence>
                    {scheduledTasks.map(task => {
                      if (!task.scheduled_start || !task.scheduled_end) return null
                      const style = getTaskStyle(task.scheduled_start, task.scheduled_end)
                      const bgColor = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general
                      const borderColor = CATEGORY_BORDERS[task.category] || CATEGORY_BORDERS.general

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.98, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-4 right-4 rounded-lg border pointer-events-auto shadow-2xl overflow-hidden flex flex-col group hover:shadow-black/20 transition-all cursor-default "
                          style={{
                            backgroundColor: bgColor,
                            borderColor: borderColor,
                            ...style
                          }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: borderColor }} />
                          <div className="p-4 flex-1 flex flex-col min-h-0 bg-gradient-to-br from-white/[0.03] to-transparent">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm  text-foreground leading-tight truncate">{task.title}</p>
                              <button
                                onClick={() => handleUnscheduleTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 rounded transition-all text-muted-foreground hover:text-rose-400 border border-transparent hover:border-destructive/20 shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 mt-auto">
                              <span className="text-[8px]   text-primary bg-primary/10 px-2 py-0.5 rounded border border-border">
                                {task.category}
                              </span>
                              <div className="flex items-center gap-2 text-[9px]  text-muted-foreground">
                                <Clock size={10} />
                                {new Date(task.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors pointer-events-none" />
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
