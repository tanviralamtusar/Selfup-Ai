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
  skills:  'bg-blue-500',
  time:    'bg-cyan-400',
  style:   'bg-blue-300',
  general: 'bg-blue-400',
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
                  ? `${pillarColor} shadow-[0_0_8px] ${pillarColor.replace('bg-', 'shadow-')}/40 border-transparent` 
                  : "bg-slate-900 border-blue-500/10 hover:border-blue-500/30"
              )}
              title={`${format(date, 'MMM d, yyyy')}${isCompleted ? ' (Synchronized)' : ''}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/40 w-full italic">
        <span>{format(dateRange[0], 'MMM d')}</span>
        <span>Today</span>
      </div>
    </div>
  )
}
