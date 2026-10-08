'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Schedule a task at a single time or over a range. The parent keeps both
 * values; `end_time` set is what makes it a range (see lib/task-time.ts).
 * Switching to "Time" clears the end, so the pair is always valid.
 */
export function TimeRangeField({
  scheduledTime,
  endTime,
  onChange,
  label = 'Time',
}: {
  scheduledTime: string
  endTime: string
  onChange: (next: { scheduled_time: string; end_time: string }) => void
  label?: string
}) {
  const isRange = !!endTime
  const invalid = isRange && !!scheduledTime && endTime <= scheduledTime

  const setMode = (range: boolean) => {
    if (range === isRange) return
    if (range) {
      // Default to an hour after the start so the range is valid straight away.
      const start = scheduledTime || '09:00'
      const [h, m] = start.split(':').map(Number)
      const end = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      onChange({ scheduled_time: start, end_time: end > start ? end : '23:59' })
    } else {
      onChange({ scheduled_time: scheduledTime, end_time: '' })
    }
  }

  const inputClass =
    'w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-border transition-all font-medium'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between pl-1">
        <label className="text-[10px] text-primary/60 flex items-center gap-1.5">
          <Clock size={11} /> {label}
        </label>
        <div className="flex rounded-md border border-border overflow-hidden" role="group" aria-label={`${label} mode`}>
          {[
            { id: 'single', text: 'Time', range: false },
            { id: 'range', text: 'Range', range: true },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isRange === opt.range}
              onClick={() => setMode(opt.range)}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium transition-colors',
                isRange === opt.range ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('gap-2', isRange ? 'grid grid-cols-2' : 'grid grid-cols-1')}>
        <input
          type="time"
          aria-label={isRange ? `${label} start` : label}
          value={scheduledTime}
          onChange={e => {
            const start = e.target.value
            // Clearing the start clears the range: an end alone isn't valid.
            onChange({ scheduled_time: start, end_time: start ? endTime : '' })
          }}
          className={inputClass}
        />
        {isRange && (
          <input
            type="time"
            aria-label={`${label} end`}
            value={endTime}
            onChange={e => onChange({ scheduled_time: scheduledTime, end_time: e.target.value })}
            className={cn(inputClass, invalid && 'border-rose-500/60')}
          />
        )}
      </div>

      {invalid && <p className="text-[10px] text-rose-400 pl-1">End time must be after the start time.</p>}
      {!scheduledTime && <p className="text-[10px] text-muted-foreground pl-1">Leave empty for no set time.</p>}
    </div>
  )
}
