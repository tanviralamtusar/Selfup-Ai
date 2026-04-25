'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, subDays, eachDayOfInterval, isSameDay, startOfToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface HabitLog {
  completed_at: string
}

interface Habit {
  id: string
  name: string
  pillar: string
  habit_logs?: HabitLog[]
}

interface HabitHeatmapProps {
  habits: Habit[]
  days?: number
}

const PILLAR_COLORS: Record<string, string> = {
  fitness: 'bg-green-400',
  skills:  'bg-primary',
  time:    'bg-secondary',
  style:   'bg-pink-400',
  general: 'bg-on-surface-variant',
}

export function HabitHeatmap({ habits, days = 84 }: HabitHeatmapProps) {
  const today = startOfToday()
  
  // Calculate the dates for the last N days
  const dateRange = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(today, days - 1),
      end: today
    })
  }, [today, days])

  // Group logs by date
  const logsByDate = useMemo(() => {
    const counts: Record<string, { count: number; pillars: Set<string> }> = {}
    
    habits.forEach(habit => {
      habit.habit_logs?.forEach(log => {
        const dateStr = log.completed_at
        if (!counts[dateStr]) {
          counts[dateStr] = { count: 0, pillars: new Set() }
        }
        counts[dateStr].count += 1
        counts[dateStr].pillars.add(habit.pillar)
      })
    })
    
    return counts
  }, [habits])

  // Group into weeks (columns)
  const columns = useMemo(() => {
    const cols: Date[][] = []
    let currentWeek: Date[] = []
    
    // To align properly, we should start from a Monday or Sunday.
    // GitHub starts weeks on Sunday.
    const firstDate = dateRange[0]
    const daysToPad = firstDate.getDay() // 0=Sun, 1=Mon...
    
    // Padding for the first week if it doesn't start on Sunday
    for (let i = 0; i < daysToPad; i++) {
      // currentWeek.push(null as any) // Optional: pad with nulls
    }

    dateRange.forEach((date) => {
      currentWeek.push(date)
      if (date.getDay() === 6 || date === dateRange[dateRange.length - 1]) {
        cols.push(currentWeek)
        currentWeek = []
      }
    })
    
    return cols
  }, [dateRange])

  return (
    <div className="bg-slate-950/40 border border-blue-500/20 rounded-xl p-6 space-y-6 relative overflow-hidden italic">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40">Consistency Logs</h3>
          <p className="text-[11px] font-black text-blue-100 flex items-center gap-2 uppercase tracking-wide">
            Last {days} Cycles <span className="w-1 h-1 rounded-full bg-blue-500/30" /> {habits.length} Active Protocols
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-2 rounded border border-blue-500/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500/5 border border-blue-500/10" />
            <span className="text-[8px] font-black text-blue-500/40 uppercase tracking-widest">Idle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500 opacity-40 border border-white/10" />
            <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500 opacity-70 border border-white/10" />
            <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500 border border-white/20 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[8px] font-black text-blue-500/40 uppercase tracking-widest">Peak</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-500/20">
        <div className="flex gap-2 min-w-max">
          {/* Days of week labels */}
          <div className="flex flex-col gap-1.5 pr-2 pt-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <span key={i} className="text-[8px] font-black text-blue-500/30 h-3.5 w-6 flex items-center justify-end uppercase tracking-tighter">
                {i % 2 === 0 ? day : ''}
              </span>
            ))}
          </div>

          {/* Grid columns (weeks) */}
          <div className="flex gap-1.5">
            {columns.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1.5">
                {weekIndex === 0 && week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-3.5 h-3.5" />
                ))}
                
                {week.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd')
                  const dayData = logsByDate[dateStr]
                  const count = dayData?.count || 0
                  const pillars = Array.from(dayData?.pillars || [])
                  
                  let bgColor = 'bg-blue-500/5 border-blue-500/10'
                  let opacity = 'opacity-100'
                  let glow = ''
                  
                  if (count > 0) {
                    const primaryPillar = pillars[0]
                    bgColor = (PILLAR_COLORS[primaryPillar] || PILLAR_COLORS.general) + ' border-white/10'
                    
                    if (count === 1) opacity = 'opacity-40'
                    else if (count === 2) opacity = 'opacity-70'
                    else {
                      opacity = 'opacity-100'
                      glow = `shadow-[0_0_12px] ${bgColor.split(' ')[0].replace('bg-', 'shadow-')}/50`
                    }
                  }

                  return (
                    <motion.div
                      key={dateStr}
                      whileHover={{ scale: 1.3, zIndex: 10 }}
                      className={cn(
                        "w-3.5 h-3.5 rounded-[1px] transition-all duration-300 cursor-pointer relative group border",
                        bgColor,
                        opacity,
                        glow
                      )}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-900 text-[10px] font-black text-blue-100 rounded border border-blue-500/40 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-90 group-hover:scale-100 uppercase tracking-widest italic">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-blue-500/60">{format(date, 'EEEE, MMM do')}</span>
                          <span className="text-blue-400">{count} Sync Events</span>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-blue-500/40 rotate-45 -translate-y-1" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
