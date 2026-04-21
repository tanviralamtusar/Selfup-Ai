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

  // Split into weeks for the grid (GitHub style)
  const weeks = useMemo(() => {
    const result: Date[][] = []
    let currentWeek: Date[] = []
    
    dateRange.forEach((date, i) => {
      currentWeek.push(date)
      // If Sunday (0) or last day, push week
      if (date.getDay() === 0 || i === dateRange.length - 1) {
        result.push(currentWeek)
        currentWeek = []
      }
    })
    
    // If the last day wasn't Sunday, we might have a partial week at the end
    // But GitHub style usually has weeks as columns.
    // Let's re-think: GitHub has 7 rows (days) and N columns (weeks).
    
    const rows: Date[][] = [[], [], [], [], [], [], []] // Mon to Sun or Sun to Sat? 
    // Let's go Mon(1) to Sun(0)
    
    dateRange.forEach(date => {
      const day = date.getDay()
      const rowIndex = day === 0 ? 6 : day - 1 // Mon=0, ..., Sun=6
      rows[rowIndex].push(date)
    })
    
    return rows
  }, [dateRange])

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Consistency Overview (Last 3 Months)</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-on-surface-variant/10" />
            <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase">None</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase">Max</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-1.5 min-w-max">
          {/* Days of week labels */}
          <div className="flex flex-col gap-1.5 pr-2 pt-1">
            {['M', '', 'W', '', 'F', '', 'S'].map((day, i) => (
              <span key={i} className="text-[8px] font-black text-on-surface-variant/30 h-3 w-3 flex items-center justify-center">
                {day}
              </span>
            ))}
          </div>

          {/* Grid columns (weeks) */}
          <div className="flex gap-1.5">
            {Array.from({ length: Math.ceil(dateRange.length / 7) + 1 }).map((_, colIndex) => {
              // We want to align by weeks.
              // This is slightly complex. Let's just use a simple flex-wrap or grid.
              return null
            })}
            
            {/* Simple approach: iterate over all days but group them visually */}
            {/* Actually, let's just do a grid with 7 rows */}
            <div 
              className="grid grid-flow-col gap-1.5"
              style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
            >
              {dateRange.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayData = logsByDate[dateStr]
                const count = dayData?.count || 0
                const pillars = Array.from(dayData?.pillars || [])
                
                // Color logic
                let bgColor = 'bg-surface-container-highest/20'
                let opacity = 'opacity-100'
                
                if (count > 0) {
                  // If multiple pillars, use a blend or default to primary
                  // For now, use the first pillar's color
                  const primaryPillar = pillars[0]
                  bgColor = PILLAR_COLORS[primaryPillar] || PILLAR_COLORS.general
                  
                  // Vary intensity based on count
                  if (count === 1) opacity = 'opacity-40'
                  else if (count === 2) opacity = 'opacity-70'
                  else opacity = 'opacity-100'
                }

                return (
                  <motion.div
                    key={dateStr}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                    className={cn(
                      "w-3.5 h-3.5 rounded-[3px] transition-colors cursor-pointer relative group",
                      bgColor,
                      opacity
                    )}
                    style={{
                      // If it's a future day (shouldn't happen with dateRange), hide or grey
                      gridRowStart: date.getDay() === 0 ? 7 : date.getDay()
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-[9px] font-bold text-on-surface rounded border border-outline-variant/20 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl">
                      {format(date, 'MMM d')}: {count} completions
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
