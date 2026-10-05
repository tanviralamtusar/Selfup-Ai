/**
 * Days follow the phone's time zone. The sync engine copies that zone into
 * `user_profiles.timezone`, and the server computes "today" in it, so
 * dailies, the new-day check-in, XP day keys and streaks all roll over at the
 * user's own midnight (not UTC).
 */

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const pad = (n: number) => String(n).padStart(2, '0')

/** The phone's IANA time zone, e.g. "Asia/Dhaka". */
export function phoneTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Local calendar day as YYYY-MM-DD. */
export function localDay(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local calendar day of an ISO timestamp (e.g. completed_at), or '' if missing. */
export function dayOf(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : localDay(d)
}

/** 'sun'…'sat' for the local day (matches dailies.repeat_days). */
export function localDayName(date: Date = new Date()): string {
  return DAY_NAMES[date.getDay()]
}

/** First day of the local month containing `date`, as YYYY-MM-01. */
export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`
}

export function monthLabel(month: string): string {
  const d = new Date(`${month}T12:00:00Z`)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Move a YYYY-MM-01 month key by `delta` months (pure calendar math). */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`
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
