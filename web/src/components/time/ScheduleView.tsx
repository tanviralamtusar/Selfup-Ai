'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Loader2, Calendar, Clock, Trash2, GripHorizontal, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  scheduled_start: string | null
  scheduled_end: string | null
}

interface DragState {
  taskId: string | null
  offsetX: number
  offsetY: number
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6 AM to 11 PM
const HOUR_HEIGHT = 80

export function ScheduleView() {
  const { session } = useAuthStore()
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dragState, setDragState] = useState<DragState>({ taskId: null, offsetX: 0, offsetY: 0 })
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const [expandedPanel, setExpandedPanel] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const scheduledTasks = allTasks.filter(t => t.scheduled_start && t.scheduled_end)
  const unscheduledTasks = allTasks.filter(t => !t.scheduled_start || !t.scheduled_end)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        const data: Task[] = await res.json()
        setAllTasks(data)
      }
    } catch { 
      toast.error('Failed to load schedule') 
    }
    finally { 
      setIsLoading(false) 
    }
  }, [session])

  useEffect(() => {
    if (session?.access_token) fetchTasks()
  }, [session, fetchTasks])

  // Helper to place task in the grid based on HH:MM
  const getTaskStyle = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const startHour = s.getHours() + s.getMinutes() / 60
    const duration = (e.getTime() - s.getTime()) / (1000 * 60 * 60)
    
    const top = (startHour - 6) * HOUR_HEIGHT
    const height = duration * HOUR_HEIGHT
    
    return { top: `${top}px`, height: `${Math.max(40, height)}px` }
  }

  // Calculate time from position in schedule
  const getTimeFromPosition = (y: number): { hour: number; minutes: number } => {
    const hour = Math.floor(y / HOUR_HEIGHT) + 6
    const minutes = Math.round((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60)
    return { hour: Math.min(23, Math.max(6, hour)), minutes }
  }

  // Format time display
  const formatTime = (hour: number, minutes: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 12 ? 12 : hour % 12 || 12
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    setDragState({ taskId, offsetX: e.clientX, offsetY: e.clientY })
  }

  const handleTimelineMouseEnter = (hour: number) => {
    if (dragState.taskId) setHoveredHour(hour)
  }

  const handleTimelineDrop = async (e: React.DragEvent, targetHour: number) => {
    e.preventDefault()
    if (!dragState.taskId) return

    const task = allTasks.find(t => t.id === dragState.taskId)
    if (!task) return

    // Set 1-hour duration
    const startDate = new Date()
    startDate.setHours(targetHour, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setHours(targetHour + 1, 0, 0, 0)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
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
        await fetchTasks()
      } else {
        toast.error('Failed to schedule task')
      }
    } catch {
      toast.error('Error scheduling task')
    }

    setDragState({ taskId: null, offsetX: 0, offsetY: 0 })
    setHoveredHour(null)
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
        await fetchTasks()
      } else {
        toast.error('Failed to unschedule task')
      }
    } catch {
      toast.error('Error unscheduling task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })

      if (res.ok) {
        toast.success('Task deleted')
        await fetchTasks()
      } else {
        toast.error('Failed to delete task')
      }
    } catch {
      toast.error('Error deleting task')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/10 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-secondary/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
            <Calendar className="text-secondary" size={20} /> Today's Timeline
          </h2>
          <p className="text-xs text-on-surface-variant/60 font-medium mt-1">Drag tasks to schedule them. Structure brings freedom.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Unscheduled Tasks Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-4 sticky top-20">
            <button
              onClick={() => setExpandedPanel(!expandedPanel)}
              className="w-full flex items-center justify-between mb-4 lg:mb-0 lg:hidden"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
                Unscheduled ({unscheduledTasks.length})
              </h3>
              <ChevronDown size={16} className={cn('transition-transform', expandedPanel && 'rotate-180')} />
            </button>

            <h3 className="hidden lg:block text-sm font-black uppercase tracking-widest text-on-surface mb-4">
              Unscheduled ({unscheduledTasks.length})
            </h3>

            <div className={cn(
              'space-y-2 max-h-96 overflow-y-auto hidden lg:flex lg:flex-col',
              expandedPanel && 'flex flex-col'
            )}>
              {unscheduledTasks.length === 0 ? (
                <p className="text-xs text-on-surface-variant/60 py-4 text-center">All tasks scheduled!</p>
              ) : (
                <AnimatePresence>
                  {unscheduledTasks.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      draggable
                      onDragStart={(e) => handleTaskDragStart(e, task.id)}
                      className="group p-3 bg-surface-container-highest border border-outline-variant/20 rounded-xl cursor-move hover:border-secondary/40 transition-all hover:shadow-lg"
                    >
                      <div className="flex items-start gap-2">
                        <GripHorizontal size={14} className="text-on-surface-variant/40 mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">{task.title}</p>
                          <p className="text-[10px] text-on-surface-variant/60 capitalize">{task.priority}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="flex-1 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="lg:col-span-3">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 relative min-h-150 overflow-x-auto">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/80 backdrop-blur-sm z-20 rounded-3xl">
                <Loader2 className="animate-spin text-secondary" size={32} />
              </div>
            ) : null}

            <div 
              ref={containerRef}
              className="relative w-full min-w-125" 
              style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
            >
              {/* Time lines and drop zones */}
              {HOURS.map((hour, i) => (
                <div
                  key={hour}
                  onMouseEnter={() => handleTimelineMouseEnter(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleTimelineDrop(e, hour)}
                  className={cn(
                    'absolute w-full flex items-start border-t border-outline-variant/10 transition-colors',
                    hoveredHour === hour && dragState.taskId && 'bg-secondary/5'
                  )}
                  style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="w-16 shrink-0 text-[10px] font-black font-headline text-on-surface-variant/40 -mt-2.5 bg-surface-container-low pr-2">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                </div>
              ))}

              {/* Render scheduled tasks */}
              <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
                <AnimatePresence>
                  {scheduledTasks.map(task => {
                    if (!task.scheduled_start || !task.scheduled_end) return null
                    const style = getTaskStyle(task.scheduled_start, task.scheduled_end)
                    
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={task.id}
                        className="absolute left-2 right-4 rounded-xl border p-3 pointer-events-auto shadow-lg overflow-hidden flex flex-col justify-between group hover:shadow-xl transition-shadow bg-surface-container-highest hover:bg-surface-container-highest/90"
                        style={{
                          backgroundColor: 'rgba(var(--secondary), 0.08)',
                          borderColor: 'rgba(var(--secondary), 0.3)',
                          ...style
                        }}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" />
                        <div>
                          <p className="text-xs font-bold text-on-surface truncate pr-6">{task.title}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(task.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(task.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleUnscheduleTask(task.id)}
                            className="flex-1 p-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded text-[10px] font-semibold transition-colors"
                          >
                            Unschedule
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
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
  )
}
