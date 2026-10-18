// Daily hours available: 24h minus fixed commitments (sleep, work, commute...).
// Pure functions so the calculator UI and any future server use share one formula.

export type DayType = 'weekday' | 'weekend'

export interface Commitment {
  id: string
  label: string
  weekday: number // hours per weekday
  weekend: number // hours per weekend day
}

export interface DayBreakdown {
  committed: number
  available: number
  overBy: number // hours committed beyond 24
}

export interface WeekBreakdown {
  weekday: DayBreakdown
  weekend: DayBreakdown
  weeklyAvailable: number
  dailyAverage: number
}

export const HOURS_IN_DAY = 24
export const WEEKDAYS_PER_WEEK = 5
export const WEEKEND_DAYS_PER_WEEK = 2

export const DEFAULT_COMMITMENTS: Commitment[] = [
  { id: 'sleep', label: 'Sleep', weekday: 8, weekend: 8 },
  { id: 'work', label: 'Work / School', weekday: 8, weekend: 0 },
  { id: 'commute', label: 'Commute', weekday: 1, weekend: 0 },
  { id: 'meals', label: 'Meals', weekday: 1.5, weekend: 2 },
  { id: 'care', label: 'Personal care & chores', weekday: 1, weekend: 1.5 },
]

/** Clamp a user-entered hour value to [0, 24] and drop NaN. */
export function sanitizeHours(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(HOURS_IN_DAY, Math.round(value * 4) / 4)
}

export function computeDay(commitments: Commitment[], day: DayType): DayBreakdown {
  const committed = commitments.reduce((sum, c) => sum + sanitizeHours(c[day]), 0)
  return {
    committed,
    available: Math.max(0, HOURS_IN_DAY - committed),
    overBy: Math.max(0, committed - HOURS_IN_DAY),
  }
}

export function computeWeek(commitments: Commitment[]): WeekBreakdown {
  const weekday = computeDay(commitments, 'weekday')
  const weekend = computeDay(commitments, 'weekend')
  const weeklyAvailable =
    weekday.available * WEEKDAYS_PER_WEEK + weekend.available * WEEKEND_DAYS_PER_WEEK
  return {
    weekday,
    weekend,
    weeklyAvailable,
    dailyAverage: weeklyAvailable / (WEEKDAYS_PER_WEEK + WEEKEND_DAYS_PER_WEEK),
  }
}

/**
 * Free hours still left today: the day's free time scaled by the share of
 * waking hours that remain before bedtime.
 */
export function remainingToday(
  available: number,
  sleepHours: number,
  now: Date,
  bedtimeHour: number,
): number {
  let nowHour = now.getHours() + now.getMinutes() / 60
  const wakingHours = HOURS_IN_DAY - sleepHours
  if (wakingHours <= 0) return 0
  // Bedtime after midnight (e.g. 1am) counts as 25h on today's clock.
  const bed = bedtimeHour < 12 ? bedtimeHour + HOURS_IN_DAY : bedtimeHour
  const wake = bed - wakingHours
  // Past midnight but before a late bedtime: still the same waking day.
  if (bed > HOURS_IN_DAY && nowHour < bed - HOURS_IN_DAY) nowHour += HOURS_IN_DAY
  const left = Math.min(wakingHours, Math.max(0, bed - Math.max(nowHour, wake)))
  return (available * left) / wakingHours
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 60) return `${h + 1}h`
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
