'use client'

import { useMemo } from 'react'
import { format, subDays, eachDayOfInterval, startOfToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface HabitLog {
  completed_at: string
}

interface HabitCalendarGridProps {
  logs: HabitLog[]
  pillar: string
  days?: number
}

const PILLAR_COLORS: Record<string, string> = {
  fitness: 'bg-rose-500',
  skills:  'bg-blue-500',
  time:    'bg-cyan-400',
  style:   'bg-blue-300',
  general: 'bg-blue-400',
}

export function HabitCalendarGrid({ logs, pillar, days = 35 }: HabitCalendarGridProps) {
  const today = startOfToday()
  
  const dateRange = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(today, days - 1),
      end: today
    })
  }, [today, days])

  const logDates = useMemo(() => {
    return new Set(logs.map(l => l.completed_at))
  }, [logs])

  const pillarColor = PILLAR_COLORS[pillar] || PILLAR_COLORS.general

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const isCompleted = logDates.has(dateStr)
        
        return (
          <div
            key={dateStr}
            className={cn(
              "w-2 h-2 rounded-[1.5px] transition-all",
              isCompleted 
                ? `${pillarColor} shadow-[0_0_8px] ${pillarColor.replace('bg-', 'shadow-')}/40` 
                : "bg-on-surface-variant/10"
            )}
            title={format(date, 'MMM d')}
          />
        )
      })}
    </div>
  )
}
