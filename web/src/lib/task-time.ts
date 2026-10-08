/**
 * A task is scheduled either at a single time or over a time range.
 * `scheduled_time` is the time (or the start of the range) and `end_time`
 * is set only for a range — see scripts/migrations/add_task_time_range.sql,
 * which enforces the same rules with a CHECK constraint.
 */

/** 'HH:MM' or 'HH:MM:SS'. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

/** Normalize to 'HH:MM:SS' for Postgres TIME, or null when unset. */
export function normalizeTime(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !TIME_RE.test(value)) return undefined as never
  return value.length === 5 ? `${value}:00` : value
}

/**
 * Validate and normalize the pair. Returns an `error` message when the input
 * is unusable, so route handlers can reply 400 instead of leaving it to the
 * database constraint.
 */
export function parseTimeRange(
  scheduledTime: unknown,
  endTime: unknown
): { scheduled_time: string | null; end_time: string | null; error?: string } {
  const invalid = { scheduled_time: null, end_time: null }

  const start = normalizeTime(scheduledTime)
  if (start === undefined) return { ...invalid, error: 'scheduled_time must be HH:MM' }

  const end = normalizeTime(endTime)
  if (end === undefined) return { ...invalid, error: 'end_time must be HH:MM' }

  if (end && !start) return { ...invalid, error: 'A time range needs a start time' }
  if (end && start && end <= start) return { ...invalid, error: 'End time must be after the start time' }

  return { scheduled_time: start, end_time: end }
}

/** '09:00' or '09:00 – 10:30' for display; '' when unscheduled. */
export function formatTaskTime(scheduledTime: string | null, endTime: string | null): string {
  if (!scheduledTime) return ''
  const hhmm = (t: string) => t.slice(0, 5)
  return endTime ? `${hhmm(scheduledTime)} – ${hhmm(endTime)}` : hhmm(scheduledTime)
}
