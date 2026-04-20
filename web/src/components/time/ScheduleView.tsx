'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  scheduled_start: string | null
  scheduled_end: string | null
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6 AM to 11 PM

export function ScheduleView() {
  const { session } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        const data: Task[] = await res.json()
        setTasks(data.filter(t => t.scheduled_start)) // only scheduled tasks
      }
    } catch { toast.error('Failed to load schedule') }
    finally { setIsLoading(false) }
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
    
    // Base is 6 AM = top 0. Each hour is, say, 80px high
    const top = (startHour - 6) * 80
    const height = duration * 80
    
    return { top: `${top}px`, height: `${Math.max(40, height)}px` }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/10 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-secondary/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
            <Calendar className="text-secondary" size={20} /> Today's Timeline
          </h2>
          <p className="text-xs text-on-surface-variant/60 font-medium mt-1">Structure brings freedom.</p>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 relative min-h-[600px] overflow-x-auto">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/80 backdrop-blur-sm z-20 rounded-3xl">
            <Loader2 className="animate-spin text-secondary" size={32} />
          </div>
        ) : null}

        <div className="relative w-full min-w-[500px]" style={{ height: `${HOURS.length * 80}px` }}>
          {/* Time lines */}
          {HOURS.map((hour, i) => (
            <div key={hour} className="absolute w-full flex items-start border-t border-outline-variant/10" style={{ top: `${i * 80}px`, height: '80px' }}>
              <span className="w-16 flex-shrink-0 text-[10px] font-black font-headline text-on-surface-variant/40 -mt-2.5 bg-surface-container-low pr-2">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
          ))}

          {/* Render scheduled tasks */}
          <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
            {tasks.map(task => {
              if (!task.scheduled_start || !task.scheduled_end) return null
              const style = getTaskStyle(task.scheduled_start, task.scheduled_end)
              
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={task.id}
                  className="absolute left-2 right-4 rounded-xl border p-3 pointer-events-auto shadow-lg overflow-hidden flex flex-col justify-center"
                  style={{
                    backgroundColor: 'rgba(var(--secondary), 0.1)',
                    borderColor: 'rgba(var(--secondary), 0.2)',
                    ...style
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" />
                  <p className="text-xs font-bold text-on-surface truncate">{task.title}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(task.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(task.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
