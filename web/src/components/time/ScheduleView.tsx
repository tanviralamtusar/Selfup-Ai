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
  fitness: 'rgba(244, 63, 94, 0.1)', // Rose
  skills: 'rgba(59, 130, 246, 0.1)',  // Blue
  time: 'rgba(34, 211, 238, 0.1)',    // Cyan
  style: 'rgba(147, 197, 253, 0.1)',   // Sky
  general: 'rgba(30, 41, 59, 0.1)'    // Slate
}

const PILLAR_BORDERS: Record<string, string> = {
  fitness: 'rgba(244, 63, 94, 0.5)',
  skills: 'rgba(59, 130, 246, 0.5)',
  time: 'rgba(34, 211, 238, 0.5)',
  style: 'rgba(147, 197, 253, 0.5)',
  general: 'rgba(71, 85, 105, 0.5)'
}

export function ScheduleView() {
  const { session } = useAuthStore()
  const [allTasks, setAllTasks] = useState<Task[]>([])
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

  const scheduledTasks = allTasks.filter(t => 
    t.scheduled_start && 
    t.scheduled_end && 
    t.scheduled_start.startsWith(selectedDateStr)
  )
  
  const unscheduledTasks = allTasks.filter(t => 
    t.status !== 'done' && (
      !t.scheduled_start || 
      !t.scheduled_start.startsWith(selectedDateStr)
    )
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
    <div className="space-y-8 italic">
      {/* Header with Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 bg-slate-950/40 border border-blue-500/20 rounded-xl px-6 py-4 shadow-[0_0_20px_rgba(59,130,246,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500/10 group-hover:bg-blue-500/30 transition-colors" />
            <button
              onClick={handlePreviousDay}
              className="p-2 hover:bg-blue-500/10 rounded-lg transition-all text-blue-500/40 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-56 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 mb-1">Temporal Alignment</p>
              <p className="text-xl font-black text-blue-50 tracking-widest system-text-glow">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </p>
            </div>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-blue-500/10 rounded-lg transition-all text-blue-500/40 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {!isToday && (
            <button
              onClick={handleToday}
              className="px-6 py-3 bg-blue-500/5 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500/10 transition-all shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]"
            >
              Back to Present
            </button>
          )}
        </div>
        <button
          onClick={handleAutoSchedule}
          disabled={isOptimizing}
          className="relative group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-400"
        >
          {isOptimizing ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Sparkles size={18} className="group-hover:animate-pulse" />
          )}
          <span>{isOptimizing ? 'Strategizing...' : 'System Optimization'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
      </div>

      <AnimatePresence>
        {systemLogic && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 flex gap-6 items-start relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
            <div className="p-3 bg-blue-500/10 rounded-lg shrink-0 border border-blue-500/20">
              <Sparkles size={20} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                  System Strategic Logic
                </div>
                <button 
                  onClick={handleRevertSchedule}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/40 hover:text-rose-500 transition-colors border-b border-transparent hover:border-rose-500/20"
                >
                  [ REVERT PROTOCOL ]
                </button>
              </div>
              <p className="text-sm text-blue-100 font-bold leading-relaxed tracking-wide italic">
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
              className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md rounded-2xl border border-blue-500/20"
            >
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                  <Loader2 className="animate-spin text-blue-400 relative z-10" size={56} />
                </div>
                <h4 className="text-2xl font-black uppercase tracking-[0.4em] text-blue-50 system-text-glow">Strategizing...</h4>
                <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-[0.2em] mt-2">Analyzing protocols, persona data, and temporal constraints.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side Panel: Backlog & Habits */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-950/40 border border-blue-500/20 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-2 h-16 bg-blue-500/10 group-hover:bg-blue-500/30 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 mb-6 flex items-center gap-2">
              <Target size={16} /> Backlog <span className="text-blue-500/20">[{unscheduledTasks.length}]</span>
            </h3>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-12 bg-blue-500/[0.02] rounded-xl border border-dashed border-blue-500/10">
                  <CheckCircle2 className="mx-auto text-blue-500/20 mb-3" size={32} />
                  <p className="text-[10px] font-black text-blue-500/30 uppercase tracking-[0.3em]">No Pending Tasks</p>
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
                      onDragStart={(e) => handleDragStart(e, task.id, 'task')}
                      className="group p-4 bg-slate-950/60 border border-blue-500/10 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-500/40 transition-all hover:bg-blue-900/10 relative overflow-hidden"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("w-1 h-10 rounded-full shrink-0 mt-0.5", 
                          task.priority === 'high' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-blue-500/40')} 
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-xs font-black text-blue-50 tracking-wider truncate uppercase">{task.title}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-blue-500/10 rounded text-blue-400 border border-blue-500/20">
                              {task.pillar}
                            </span>
                            <span className="text-[9px] font-black text-blue-500/40 flex items-center gap-1.5 uppercase">
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
          <div className="bg-slate-950/40 border border-blue-500/20 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-16 bg-blue-500/10 group-hover:bg-blue-500/30 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 mb-6 flex items-center gap-2">
              <Zap size={16} /> Active Protocols
            </h3>
            <div className="space-y-3">
              {habits.map(habit => (
                <div 
                  key={habit.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, habit.id, 'habit')}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all cursor-grab relative overflow-hidden group/item",
                    habit.completed_today 
                      ? "bg-blue-500/5 border-blue-500/20 opacity-40 shadow-inner" 
                      : "bg-slate-950/60 border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-900/10"
                  )}
                >
                  <span className="text-[11px] font-black text-blue-100 uppercase tracking-widest">{habit.name}</span>
                  {habit.completed_today ? (
                    <CheckCircle2 size={16} className="text-blue-400" />
                  ) : (
                    <GripHorizontal size={16} className="text-blue-500/20 group-hover/item:text-blue-400 transition-colors" />
                  )}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/0 group-hover/item:bg-blue-500/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="lg:col-span-3">
          <div className="bg-slate-950/40 border border-blue-500/20 rounded-xl relative overflow-hidden flex flex-col shadow-2xl">
            {/* Timeline Header */}
            <div className="bg-slate-950/80 backdrop-blur-md border-b border-blue-500/20 p-6 sticky top-0 z-20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 mb-1">Temporal Grid</p>
                <p className="text-sm font-black text-blue-50 uppercase tracking-widest system-text-glow">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-blue-500/40 uppercase tracking-[0.3em]">
                {isToday && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    Live Trace
                  </>
                )}
              </div>
            </div>

            {/* Scrollable timeline */}
            <div className="flex-1 overflow-y-auto max-h-[850px] custom-scrollbar bg-blue-500/[0.01]" style={{ backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
              <div ref={containerRef} className="relative w-full p-6" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                
                {/* Current Time Line */}
                <div 
                  className="absolute left-0 right-0 z-30 pointer-events-none transition-all duration-1000 ease-linear"
                  style={{ top: `${getCurrentTimeTop()}px` }}
                >
                  <div className="relative">
                    <div className="absolute left-0 w-24 flex justify-end pr-6 -top-3.5">
                      <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] uppercase tracking-widest">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="h-px w-full bg-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <div className="absolute left-24 -top-1.5 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] border border-white" />
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
                      'absolute left-0 right-0 flex items-start border-t border-blue-500/5 transition-all duration-300',
                      hoveredHour === hour && dragState.id && 'bg-blue-500/5 border-t-blue-500/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]'
                    )}
                    style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    <div className="w-24 shrink-0 flex items-center justify-end pr-6 -mt-3.5">
                      <span className="text-[10px] font-black text-blue-500/30 tracking-widest uppercase">
                        {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                      </span>
                    </div>
                    <div className="flex-1 h-full border-l border-blue-500/5 border-dashed" />
                  </div>
                ))}

                {/* Scheduled items */}
                <div className="absolute left-24 right-6 top-0 bottom-0 pointer-events-none">
                  <AnimatePresence>
                    {scheduledTasks.map(task => {
                      if (!task.scheduled_start || !task.scheduled_end) return null
                      const style = getTaskStyle(task.scheduled_start, task.scheduled_end)
                      const bgColor = PILLAR_COLORS[task.pillar] || PILLAR_COLORS.general
                      const borderColor = PILLAR_BORDERS[task.pillar] || PILLAR_BORDERS.general

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.98, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-4 right-4 rounded-lg border pointer-events-auto shadow-2xl overflow-hidden flex flex-col group hover:shadow-blue-500/20 transition-all cursor-default backdrop-blur-md"
                          style={{
                            backgroundColor: bgColor,
                            borderColor: borderColor,
                            ...style
                          }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: borderColor }} />
                          <div className="p-4 flex-1 flex flex-col min-h-0 bg-gradient-to-br from-white/[0.03] to-transparent">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm font-black text-blue-50 leading-tight uppercase tracking-widest system-text-glow truncate">{task.title}</p>
                              <button
                                onClick={() => handleUnscheduleTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 rounded transition-all text-blue-500/40 hover:text-rose-400 border border-transparent hover:border-rose-500/20 shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 mt-auto">
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                {task.pillar}
                              </span>
                              <div className="flex items-center gap-2 text-[9px] font-black text-blue-500/40 uppercase tracking-widest">
                                <Clock size={10} />
                                {new Date(task.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors pointer-events-none" />
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
