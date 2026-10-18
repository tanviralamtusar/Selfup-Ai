'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarDays, Clock, Hourglass, Plus, RotateCcw, Sun, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAvailableHours } from '@/lib/hooks/useAvailableHours'
import { HOURS_IN_DAY, formatHours, remainingToday, type DayType } from '@/lib/time/available-hours'

const SEGMENT_COLORS = [
  'bg-indigo-400', 'bg-sky-400', 'bg-amber-400', 'bg-rose-400',
  'bg-violet-400', 'bg-teal-400', 'bg-orange-400', 'bg-pink-400',
]

const BEDTIME_OPTIONS = [20, 21, 22, 23, 0, 1, 2, 3]

function hourLabel(h: number) {
  const suffix = h < 12 ? 'AM' : 'PM'
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${suffix}`
}

function StatCard({ icon: Icon, label, value, hint, accent }: {
  icon: typeof Clock
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className={cn(
      'bg-card border rounded-xl p-4',
      accent ? 'border-primary/40' : 'border-border'
    )}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon size={14} />
        {label}
      </div>
      <p className={cn('text-3xl font-headline tracking-tighter mt-2 tabular-nums', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

export function HoursCalculator() {
  const {
    commitments, bedtimeHour, week, sleepHours,
    updateCommitment, addCommitment, removeCommitment, setBedtimeHour, reset,
  } = useAvailableHours()
  const [day, setDay] = useState<DayType>(() => {
    const d = new Date().getDay()
    return d === 0 || d === 6 ? 'weekend' : 'weekday'
  })
  const [newLabel, setNewLabel] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const breakdown = week[day]
  const todayType: DayType = now.getDay() === 0 || now.getDay() === 6 ? 'weekend' : 'weekday'
  const leftToday = remainingToday(week[todayType].available, sleepHours(todayType), now, bedtimeHour)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    addCommitment(label)
    setNewLabel('')
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Hourglass}
          label={`Free per ${day}`}
          value={formatHours(breakdown.available)}
          hint={`${formatHours(breakdown.committed)} committed of ${HOURS_IN_DAY}h`}
          accent
        />
        <StatCard
          icon={Sun}
          label="Free time left today"
          value={formatHours(leftToday)}
          hint={`Until ${hourLabel(bedtimeHour)} bedtime`}
        />
        <StatCard
          icon={CalendarDays}
          label="Free per week"
          value={formatHours(week.weeklyAvailable)}
          hint="5 weekdays + 2 weekend days"
        />
        <StatCard
          icon={Clock}
          label="Daily average"
          value={formatHours(week.dailyAverage)}
          hint="Across the whole week"
        />
      </div>

      {breakdown.overBy > 0 && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle size={16} />
          Your {day} commitments add up to {formatHours(breakdown.committed)}, which is {formatHours(breakdown.overBy)} more than a day has.
        </div>
      )}

      {/* 24h bar */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm text-foreground">Your 24 hours</h2>
          <div className="flex rounded-lg border border-border overflow-hidden text-xs" role="group" aria-label="Day type">
            {(['weekday', 'weekend'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDay(d)}
                aria-pressed={day === d}
                className={cn(
                  'px-3 py-1.5 capitalize transition-colors',
                  day === d ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex h-4 w-full rounded-full overflow-hidden bg-secondary">
          {commitments.map((c, i) => c[day] > 0 && (
            <div
              key={c.id}
              className={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              style={{ width: `${(Math.min(c[day], HOURS_IN_DAY) / Math.max(HOURS_IN_DAY, breakdown.committed)) * 100}%` }}
              title={`${c.label || 'Untitled'}: ${formatHours(c[day])}`}
            />
          ))}
          {breakdown.available > 0 && (
            <div
              className="bg-primary"
              style={{ width: `${(breakdown.available / HOURS_IN_DAY) * 100}%` }}
              title={`Free: ${formatHours(breakdown.available)}`}
            />
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {commitments.map((c, i) => c[day] > 0 && (
            <span key={c.id} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', SEGMENT_COLORS[i % SEGMENT_COLORS.length])} />
              {c.label || 'Untitled'} {formatHours(c[day])}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Free {formatHours(breakdown.available)}
          </span>
        </div>
      </div>

      {/* Commitments editor */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm text-foreground">Fixed commitments (hours per day)</h2>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        <div className="grid grid-cols-[1fr_72px_72px_32px] gap-2 px-4 pt-3 text-[11px] text-muted-foreground">
          <span>Activity</span>
          <span className="text-center">Weekday</span>
          <span className="text-center">Weekend</span>
          <span />
        </div>

        <ul className="divide-y divide-border">
          {commitments.map(c => (
            <li key={c.id} className="grid grid-cols-[1fr_72px_72px_32px] gap-2 items-center px-4 py-2">
              <input
                value={c.label}
                onChange={e => updateCommitment(c.id, { label: e.target.value })}
                aria-label="Activity name"
                className="bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-primary min-w-0"
              />
              {(['weekday', 'weekend'] as const).map(d => (
                <input
                  key={d}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={24}
                  step={0.25}
                  value={c[d]}
                  onChange={e => updateCommitment(c.id, { [d]: Number(e.target.value) })}
                  aria-label={`${c.label} hours per ${d}`}
                  className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-sm text-center tabular-nums text-foreground outline-none focus:border-primary"
                />
              ))}
              <button
                onClick={() => removeCommitment(c.id)}
                aria-label={`Remove ${c.label}`}
                className="flex justify-center text-muted-foreground hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="flex gap-2 px-4 py-3 border-t border-border">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Add a commitment (e.g. Gym, Family time)"
            aria-label="New commitment name"
            className="flex-1 min-w-0 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!newLabel.trim()}
            className="flex items-center gap-1 rounded-lg bg-primary/15 px-3 py-2 text-sm text-primary disabled:opacity-40"
          >
            <Plus size={14} /> Add
          </button>
        </form>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border text-sm">
          <label htmlFor="bedtime" className="text-muted-foreground">Usual bedtime</label>
          <select
            id="bedtime"
            value={bedtimeHour}
            onChange={e => setBedtimeHour(Number(e.target.value))}
            className="rounded-lg border border-border bg-secondary/40 px-2 py-1.5 text-foreground outline-none focus:border-primary"
          >
            {BEDTIME_OPTIONS.map(h => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
