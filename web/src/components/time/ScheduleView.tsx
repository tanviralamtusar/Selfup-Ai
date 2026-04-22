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
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  pillar: string
  scheduled_start: string | null
  scheduled_end: string | null
  estimated_minutes: number
}

interface Habit {
  id: string
  name: string
  pillar: string
  completed_today: boolean
}

interface DragState {
  id: string | null
  type: 'task' | 'habit'
  offsetX: number
  offsetY: number
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)
const HOUR_HEIGHT = 90

const PILLAR_COLORS: Record<string, string> = {
  fitness: 'rgba(34, 197, 94, 0.2)', // Green
  skills: 'rgba(59, 130, 246, 0.2)',  // Blue
  time: 'rgba(168, 85, 247, 0.2)',    // Purple
  style: 'rgba(236, 72, 153, 0.2)',   // Pink
  general: 'rgba(100, 116, 139, 0.2)' // Slate
}

const PILLAR_BORDERS: Record<string, string> = {
  fitness: 'rgba(34, 197, 94, 0.5)',
  skills: 'rgba(59, 130, 246, 0.5)',
  time: 'rgba(168, 85, 247, 0.5)',
  style: 'rgba(236, 72, 153, 0.5)',
  general: 'rgba(100, 116, 139, 0.5)'
}

export function ScheduleView() {
  const { session } = useAuthStore()
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [novaLogic, setNovaLogic] = useState<string | null>(null)
  const [lastBatchIds, setLastBatchIds] = useState<string[]>([])
  const [dragState, setDragState] = useState<DragState>({ id: null, type: 'task', offsetX: 0, offsetY: 0 })
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [expandedPanel, setExpandedPanel] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  const scheduledTasks = allTasks.filter(t => 
    t.scheduled_start && 
    t.scheduled_end && 
    t.scheduled_start.startsWith(todayStr)
  )
  
  const unscheduledTasks = allTasks.filter(t => 
    !t.scheduled_start || 
    !t.scheduled_start.startsWith(todayStr)
  )

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [tasksRes, habitsRes] = await Promise.all([
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${session?.access_token}` } }),
        fetch('/api/habits', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      ])
      
      if (tasksRes.ok) setAllTasks(await tasksRes.json())
      if (habitsRes.ok) setHabits(await habitsRes.json())
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
    const hour = currentTime.getHours() + currentTime.getMinutes() / 60
    if (hour < 6 || hour > 24) return -100
    return (hour - 6) * HOUR_HEIGHT
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

    const startDate = new Date()
    startDate.setHours(targetHour, 0, 0, 0)
    
    // Determine duration
    let durationMinutes = 60
    if (dragState.type === 'task') {
      const task = allTasks.find(t => t.id === dragState.id)
      durationMinutes = task?.estimated_minutes || 60
    }

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

    try {
      if (dragState.type === 'task') {
        const res = await fetch(`/api/tasks/${dragState.id}`, {
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
      } else {
        // Habits are handled differently for now, maybe just feedback
        toast.info('Habit positioning coming soon!')
      }
    } catch {
      toast.error('Error scheduling item')
    }

    setDragState({ id: null, type: 'task', offsetX: 0, offsetY: 0 })
    setHoveredHour(null)
  }

  const handleAutoSchedule = async () => {
    setIsOptimizing(true)
    setNovaLogic(null)
    try {
      const res = await fetch('/api/time/auto-schedule', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      
      if (!res.ok) throw new Error()
      
      const { schedule, logic } = await res.json()
      setNovaLogic(logic)
      
      // Batch update tasks using the new batch API
      const updates = schedule
        .filter((item: any) => item.type === 'task')
        .map((item: any) => {
          const start = new Date()
          const [h, m] = item.start.split(':')
          start.setHours(parseInt(h), parseInt(m), 0, 0)
          
          const end = new Date()
          const [eh, em] = item.end.split(':')
          end.setHours(parseInt(eh), parseInt(em), 0, 0)

          return {
            id: item.id,
            scheduled_start: start.toISOString(),
            scheduled_end: end.toISOString()
          }
        })

      if (updates.length > 0) {
        const batchRes = await fetch('/api/tasks/batch', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ updates })
        })

        if (!batchRes.ok) throw new Error('Batch update failed')
        setLastBatchIds(updates.map(u => u.id))
      }
      
      toast.success('Nova optimized your schedule!')
      await fetchData()
    } catch {
      toast.error('Auto-schedule failed')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleUnscheduleTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
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

      const res = await fetch('/api/tasks/batch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ updates })
      })

      if (res.ok) {
        toast.success('Schedule reverted')
        setNovaLogic(null)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-surface-container-low border border-outline-variant/10 p-6 rounded-3xl relative overflow-hidden gap-4">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-secondary/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-on-surface flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-xl">
              <Calendar className="text-secondary" size={24} />
            </div>
            Tactical Timeline
          </h2>
          <p className="text-sm text-on-surface-variant/70 font-medium mt-1 ml-11">
            Command your day. Structure is the foundation of mastery.
          </p>
        </div>

        <button
          onClick={handleAutoSchedule}
          disabled={isOptimizing}
          className="relative group flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden shadow-[0_0_20px_rgba(var(--secondary),0.3)]"
        >
          {isOptimizing ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Sparkles size={18} className="group-hover:animate-pulse" />
          )}
          <span>{isOptimizing ? 'Optimizing...' : 'Nova Auto-Schedule'}</span>
        </button>
      </div>

      <AnimatePresence>
        {novaLogic && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 flex gap-4 items-start"
          >
            <div className="p-2 bg-secondary/20 rounded-xl shrink-0">
              <Sparkles size={16} className="text-secondary" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-4 mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/70">Nova's Strategy</p>
                <button 
                  onClick={handleRevertSchedule}
                  className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-red-500 transition-colors"
                >
                  [ Revert Changes ]
                </button>
              </div>
              <p className="text-sm text-on-surface font-medium leading-relaxed italic">
                "{novaLogic}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        {/* Loading Overlay */}
        <AnimatePresence>
          {isOptimizing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-surface/40 backdrop-blur-md rounded-3xl"
            >
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="animate-spin text-secondary relative z-10" size={48} />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-on-surface">Nova is Strategizing...</h4>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Analyzing tasks, persona, and memory for peak efficiency.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Side Panel: Unscheduled Tasks & Habits */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50 mb-4 flex items-center gap-2">
              <Target size={14} /> Backlog ({unscheduledTasks.length})
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-8 bg-surface-container-highest/30 rounded-2xl border border-dashed border-outline-variant/20">
                  <CheckCircle2 className="mx-auto text-on-surface-variant/20 mb-2" size={24} />
                  <p className="text-[10px] font-bold text-on-surface-variant/40">NO PENDING TASKS</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {unscheduledTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, 'task')}
                      className="group p-3 bg-surface-container-highest/50 border border-outline-variant/20 rounded-2xl cursor-grab active:cursor-grabbing hover:border-secondary/30 transition-all hover:bg-surface-container-highest"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-1 h-8 rounded-full shrink-0 mt-0.5", 
                          task.priority === 'high' ? 'bg-red-500' : 'bg-secondary/40')} 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-surface-container rounded-md text-on-surface-variant/60">
                              {task.pillar}
                            </span>
                            <span className="text-[10px] text-on-surface-variant/40 flex items-center gap-1">
                              <Clock3 size={10} /> {task.estimated_minutes || 30}m
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
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50 mb-4 flex items-center gap-2">
              <Zap size={14} /> Daily Habits
            </h3>
            <div className="space-y-2">
              {habits.map(habit => (
                <div 
                  key={habit.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, habit.id, 'habit')}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-grab",
                    habit.completed_today 
                      ? "bg-green-500/10 border-green-500/20 opacity-60" 
                      : "bg-surface-container-highest/30 border-outline-variant/10 hover:border-secondary/20"
                  )}
                >
                  <span className="text-xs font-bold text-on-surface">{habit.name}</span>
                  {habit.completed_today ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <GripHorizontal size={14} className="text-on-surface-variant/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="lg:col-span-3">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2.5rem] relative overflow-hidden flex flex-col shadow-xl">
            {/* Timeline Header */}
            <div className="bg-surface-container-highest/50 backdrop-blur-md border-b border-outline-variant/10 p-5 sticky top-0 z-20 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-on-surface">Time Grid (06:00 - 00:00)</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/50">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                LIVE
              </div>
            </div>

            {/* Scrollable timeline */}
            <div className="flex-1 overflow-y-auto max-h-[800px] custom-scrollbar">
              <div ref={containerRef} className="relative w-full p-4" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                
                {/* Current Time Line */}
                <div 
                  className="absolute left-0 right-0 z-30 pointer-events-none transition-all duration-1000 ease-linear"
                  style={{ top: `${getCurrentTimeTop()}px` }}
                >
                  <div className="relative">
                    <div className="absolute left-0 w-20 flex justify-end pr-4 -top-3">
                      <span className="bg-secondary text-on-secondary text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="h-px w-full bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.5)]" />
                    <div className="absolute left-20 -top-1 w-2.5 h-2.5 bg-secondary rounded-full shadow-[0_0_8px_rgba(var(--secondary),0.8)]" />
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
                      'absolute left-0 right-0 flex items-start border-t border-outline-variant/10 transition-all duration-300',
                      hoveredHour === hour && dragState.id && 'bg-secondary/5 border-t-secondary/40'
                    )}
                    style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="w-20 shrink-0 flex items-center justify-end pr-5 -mt-3.5">
                      <span className="text-[11px] font-black font-headline text-on-surface-variant/40 tracking-tighter">
                        {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                      </span>
                    </div>
                    <div className="flex-1 h-full border-l border-outline-variant/10 border-dashed" />
                  </div>
                ))}

                {/* Scheduled items */}
                <div className="absolute left-20 right-4 top-0 bottom-0 pointer-events-none">
                  <AnimatePresence>
                    {scheduledTasks.map(task => {
                      if (!task.scheduled_start || !task.scheduled_end) return null
                      const style = getTaskStyle(task.scheduled_start, task.scheduled_end)
                      const bgColor = PILLAR_COLORS[task.pillar] || PILLAR_COLORS.general
                      const borderColor = PILLAR_BORDERS[task.pillar] || PILLAR_BORDERS.general

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute left-3 right-3 rounded-2xl border pointer-events-auto shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all cursor-default backdrop-blur-sm"
                          style={{
                            backgroundColor: bgColor,
                            borderColor: borderColor,
                            ...style
                          }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: borderColor }} />
                          <div className="p-3 flex-1 flex flex-col min-h-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[13px] font-black text-on-surface leading-tight truncate">{task.title}</p>
                              <button
                                onClick={() => handleUnscheduleTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-on-surface/10 rounded-lg transition-opacity text-on-surface-variant shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-auto">
                              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface/60 bg-on-surface/5 px-2 py-0.5 rounded-md">
                                {task.pillar}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface/40">
                                <Clock size={10} />
                                {new Date(task.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
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
