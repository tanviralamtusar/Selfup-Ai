import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Calendar days in the user's own time zone (`user_profiles.timezone`, an
 * IANA name like "Asia/Dhaka"). The Android app keeps it equal to the phone's
 * zone. Dailies reset, the new-day check-in, XP day keys, habit logs and
 * streaks all roll over at the user's local midnight instead of UTC midnight.
 *
 * Day strings are "YYYY-MM-DD". Arithmetic on them goes through UTC noon so
 * it never depends on the server's own zone or DST.
 */

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

function safeZone(tz: string | null | undefined): string {
  return isValidTimeZone(tz) ? tz : 'UTC'
}

/** The calendar date of `at` in `tz`, as YYYY-MM-DD. */
export function todayIn(tz: string | null | undefined, at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: safeZone(tz), year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

/** Shift a YYYY-MM-DD date by whole days. */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10)
}

/** 'sun'…'sat' for a YYYY-MM-DD date (matches dailies.repeat_days). */
export function weekdayOf(ymd: string): (typeof DAY_NAMES)[number] {
  const [y, m, d] = ymd.split('-').map(Number)
  return DAY_NAMES[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()]
}

/** Whole days from `a` to `b` (both YYYY-MM-DD); positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}

/** Minutes `tz` is ahead of UTC at instant `at` (e.g. +360 for Asia/Dhaka). */
function offsetMinutes(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - at.getTime()) / 60000)
}

/** The instant the user's current local day began, for timestamp queries. */
export function startOfTodayIn(tz: string | null | undefined, at: Date = new Date()): Date {
  const zone = safeZone(tz)
  const [y, m, d] = todayIn(zone, at).split('-').map(Number)
  const midnightAsUtc = Date.UTC(y, m - 1, d)
  return new Date(midnightAsUtc - offsetMinutes(zone, new Date(midnightAsUtc)) * 60000)
}

/** The user's zone from their profile, falling back to UTC. */
export async function getUserTimezone(db: SupabaseClient, userId: string): Promise<string> {
  const { data } = await db.from('user_profiles').select('timezone').eq('id', userId).maybeSingle()
  return safeZone(data?.timezone)
}
