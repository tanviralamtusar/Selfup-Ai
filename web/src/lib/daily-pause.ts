import { todayIn } from '@/lib/user-time'

/**
 * Pausing a daily — see scripts/migrations/add_daily_pause.sql.
 * `paused_at` set = paused from that day (user's zone) on; `paused_until`
 * is the day it becomes active again (NULL = until resumed by hand).
 * Mirrored by isPausedOn() in mobile/src/domain/selectors.ts.
 */
export interface PausableDaily {
  paused_at?: string | null
  paused_until?: string | null
}

/** Is the daily paused on `day` (YYYY-MM-DD in the user's zone)? */
export function isPausedOn(daily: PausableDaily, day: string, tz: string): boolean {
  if (!daily.paused_at) return false
  if (todayIn(tz, new Date(daily.paused_at)) > day) return false
  return !daily.paused_until || day < daily.paused_until
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validate the pause fields of a PATCH body. Returns the columns to write,
 * or an `error`. Omitted fields are left out of `updates`.
 */
export function parsePauseUpdate(body: Record<string, unknown>): { updates: Record<string, unknown>; error?: string } {
  const updates: Record<string, unknown> = {}
  if (body.paused_at !== undefined) {
    const v = body.paused_at
    if (v !== null && (typeof v !== 'string' || Number.isNaN(Date.parse(v)))) {
      return { updates, error: 'paused_at must be an ISO timestamp or null' }
    }
    updates.paused_at = v
  }
  if (body.paused_until !== undefined) {
    const v = body.paused_until
    if (v !== null && v !== '' && (typeof v !== 'string' || !DATE_RE.test(v))) {
      return { updates, error: 'paused_until must be YYYY-MM-DD or null' }
    }
    updates.paused_until = v || null
  }
  // Resuming clears the resume date too.
  if (updates.paused_at === null) updates.paused_until = null
  return { updates }
}
