'use client'

import { useMemo } from 'react'
import { format, subDays, eachDayOfInterval, startOfToday, startOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'

interface HabitLog {
  completed_at: string
}

interface HabitCalendarGridProps {
  logs: HabitLog[]
  pillar: string
  weeks?: number
}

const PILLAR_COLORS: Record<string, string> = {
  fitness: 'bg-rose-500',
  skills:  'bg-primary',
  time:    'bg-[#5db8a0]',
  style:   'bg-primary/50',
  general: 'bg-primary',
}

export function HabitCalendarGrid({ logs, pillar, weeks = 12 }: HabitCalendarGridProps) {
  const today = startOfToday()
  
  const dateRange = useMemo(() => {
    // Start `weeks` weeks ago on a Sunday to ensure grid alignment
    const startDate = startOfWeek(subDays(today, (weeks - 1) * 7))
    return eachDayOfInterval({
      start: startDate,
      end: today
    })
  }, [today, weeks])

  const logDates = useMemo(() => {
    return new Set(logs.map(l => l.completed_at))
  }, [logs])

  const pillarColor = PILLAR_COLORS[pillar] || PILLAR_COLORS.general

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-fit overflow-x-auto custom-scrollbar pb-2">
        {dateRange.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const isCompleted = logDates.has(dateStr)
          
          return (
            <div
              key={dateStr}
              className={cn(
                "w-3.5 h-3.5 rounded-[2px] transition-all border",
                isCompleted
                  ? `${pillarColor} border-transparent opacity-90`
                  : "bg-muted border-border hover:border-border"
              )}
              title={`${format(date, 'MMM d, yyyy')}${isCompleted ? ' (Synchronized)' : ''}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between items-center text-[9px]   text-muted-foreground w-full ">
        <span>{format(dateRange[0], 'MMM d')}</span>
        <span>Today</span>
      </div>
    </div>
  )
}
