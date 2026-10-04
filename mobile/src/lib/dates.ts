/**
 * The server buckets days in UTC (`new Date().toISOString().split('T')[0]`),
 * for XP idempotency keys, the new-day check-in and habit logs. The app uses
 * the same convention so an offline action lands on the day the server
 * expects.
 */
export function serverDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export function serverDayName(date: Date = new Date()): string {
  return DAY_NAMES[date.getUTCDay()]
}

/** First day of the month containing `date`, as YYYY-MM-01 (matches the web's monthKey). */
export function monthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`
}

export function monthLabel(month: string): string {
  const d = new Date(`${month}T12:00:00Z`)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function shiftMonth(month: string, delta: number): string {
  const d = new Date(`${month}T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + delta)
  return monthKey(d)
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'never'
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
