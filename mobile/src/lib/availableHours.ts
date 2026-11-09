// Daily hours available, worked out from the user's dailies:
//   free = waking hours (wake-up → bedtime) − time covered by dailies' time ranges.
// Wake-up and bedtime come from that day's "wake" / "bed" dailies when it has
// them (so they can differ day to day), otherwise from the sleep settings.
// Only dailies with a time range (scheduled_time + end_time) take up time; a
// single-time daily is a reminder, not a block. Overlapping ranges count once.
//
// Everything runs on a "waking-day clock": hours from wake-up to bedtime,
// where a bedtime after midnight (e.g. 1am) is 25h. A daily that ends before
// that late bedtime (e.g. 00:00–00:45) belongs to the end of the waking day.

export const HOURS_IN_DAY = 24

export interface SleepSettings {
  sleepHours: number
  bedtimeHour: number // 0–23; values before noon mean "after midnight"
}

export const DEFAULT_SLEEP: SleepSettings = { sleepHours: 8, bedtimeHour: 23 }

/** The waking window on the waking-day clock, and where each end came from. */
export interface WakingWindow {
  wake: number
  bed: number
  wakeFrom: string | null // title of the daily that set it; null = sleep settings
  bedFrom: string | null
}

/** A daily's time block, in hours on the waking-day clock. */
export interface Block {
  id: string
  title: string
  start: number
  end: number
}

export interface DayBreakdown {
  waking: number
  committed: number // dailies' hours (overlaps merged), within waking hours
  available: number
  blocks: Block[]
}

interface TimedTask {
  id: string
  title: string
  scheduled_time: string | null
  end_time: string | null
}

/** Which dailies mark wake-up and bedtime. Undefined = guess from the titles. */
export interface SleepMarks {
  wakeIds?: string[]
  bedIds?: string[]
}

const WAKE_RE = /\b(wake|waking|get(ting)? up|rise)\b/i
const BED_RE = /\b(sleep|bed|bedtime)\b/i

/** Is this daily a wake-up / bedtime marker? Explicit choices win over the title guess. */
export function markOf(t: TimedTask, marks: SleepMarks): 'wake' | 'bed' | null {
  if (marks.wakeIds || marks.bedIds) {
    if (marks.wakeIds?.includes(t.id)) return 'wake'
    if (marks.bedIds?.includes(t.id)) return 'bed'
    return null
  }
  if (!t.scheduled_time) return null
  if (WAKE_RE.test(t.title)) return 'wake'
  if (BED_RE.test(t.title)) return 'bed'
  return null
}

/** Clamp a user-entered hour value to [0, 24] (quarter hours) and drop NaN. */
export function sanitizeHours(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(HOURS_IN_DAY, Math.round(value * 4) / 4)
}

/** 'HH:MM[:SS]' → hours as a decimal, or null. */
export function timeToHours(t: string | null | undefined): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h + m / 60
}

/** Wake-up and bedtime from the sleep settings alone. */
export function wakingWindow({ sleepHours, bedtimeHour }: SleepSettings): WakingWindow {
  const bed = bedtimeHour < 12 ? bedtimeHour + HOURS_IN_DAY : bedtimeHour
  return { wake: bed - (HOURS_IN_DAY - sanitizeHours(sleepHours)), bed, wakeFrom: null, bedFrom: null }
}

/**
 * The waking window for a day, from the dailies due that day: the earliest
 * wake-up daily and the latest bedtime daily (a bedtime before noon is after
 * midnight). A missing end is filled in from the sleep hours setting, and with
 * neither the sleep settings are used.
 */
export function dayWindow(due: TimedTask[], sleep: SleepSettings, marks: SleepMarks): WakingWindow {
  let wake: number | null = null
  let bed: number | null = null
  let wakeFrom: string | null = null
  let bedFrom: string | null = null
  for (const t of due) {
    const at = timeToHours(t.scheduled_time)
    if (at === null) continue
    const mark = markOf(t, marks)
    if (mark === 'wake' && (wake === null || at < wake)) { wake = at; wakeFrom = t.title }
    if (mark === 'bed') {
      const b = at < 12 ? at + HOURS_IN_DAY : at
      if (bed === null || b > bed) { bed = b; bedFrom = t.title }
    }
  }
  const awake = HOURS_IN_DAY - sanitizeHours(sleep.sleepHours)
  if (wake === null && bed === null) return wakingWindow(sleep)
  if (wake === null) wake = bed! - awake
  if (bed === null) bed = wake + awake
  if (bed <= wake) return wakingWindow(sleep)
  return { wake, bed, wakeFrom, bedFrom }
}

/** Dailies with a time range, as blocks clipped to the waking window. */
export function toBlocks(tasks: TimedTask[], { wake, bed }: WakingWindow): Block[] {
  const out: Block[] = []
  for (const t of tasks) {
    let start = timeToHours(t.scheduled_time)
    let end = timeToHours(t.end_time)
    if (start === null || end === null || end <= start) continue
    // Small hours before a late bedtime are the tail of this waking day.
    if (bed > HOURS_IN_DAY && end <= bed - HOURS_IN_DAY) {
      start += HOURS_IN_DAY
      end += HOURS_IN_DAY
    }
    start = Math.max(start, wake)
    end = Math.min(end, bed)
    if (end > start) out.push({ id: t.id, title: t.title, start, end })
  }
  return out.sort((a, b) => a.start - b.start)
}

/** Total length of the blocks inside [from, to], counting overlaps once. */
export function coveredHours(blocks: Block[], from: number, to: number): number {
  let total = 0
  let cursor = from
  for (const b of blocks) {
    const s = Math.max(b.start, cursor)
    const e = Math.min(b.end, to)
    if (e > s) {
      total += e - s
      cursor = e
    }
  }
  return total
}

export function computeDay(tasks: TimedTask[], win: WakingWindow): DayBreakdown {
  const { wake, bed } = win
  const blocks = toBlocks(tasks, win)
  const waking = bed - wake
  const committed = coveredHours(blocks, wake, bed)
  return { waking, committed, available: Math.max(0, waking - committed), blocks }
}

/** Free hours left between now and bedtime, not counting today's remaining dailies. */
export function remainingToday(blocks: Block[], { wake, bed }: WakingWindow, now: Date): number {
  let nowHour = now.getHours() + now.getMinutes() / 60
  // Past midnight but before a late bedtime: still the same waking day.
  if (bed > HOURS_IN_DAY && nowHour < bed - HOURS_IN_DAY) nowHour += HOURS_IN_DAY
  const from = Math.max(nowHour, wake)
  if (from >= bed) return 0
  return Math.max(0, bed - from - coveredHours(blocks, from, bed))
}

/** '9:30am' for an hour on the waking-day clock. */
export function clockLabel(hours: number): string {
  const total = Math.round(hours * 60) % (HOURS_IN_DAY * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 60) return `${h + 1}h`
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
