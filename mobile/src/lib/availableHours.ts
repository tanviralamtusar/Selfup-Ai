// Daily hours available, worked out from the user's dailies:
//   free = waking hours (24h − sleep) − time covered by dailies' time ranges.
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

/** Wake-up and bedtime on the waking-day clock. */
export function wakingWindow({ sleepHours, bedtimeHour }: SleepSettings): { wake: number; bed: number } {
  const bed = bedtimeHour < 12 ? bedtimeHour + HOURS_IN_DAY : bedtimeHour
  return { wake: bed - (HOURS_IN_DAY - sanitizeHours(sleepHours)), bed }
}

/** Dailies with a time range, as blocks clipped to the waking window. */
export function toBlocks(tasks: TimedTask[], sleep: SleepSettings): Block[] {
  const { wake, bed } = wakingWindow(sleep)
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

export function computeDay(tasks: TimedTask[], sleep: SleepSettings): DayBreakdown {
  const { wake, bed } = wakingWindow(sleep)
  const blocks = toBlocks(tasks, sleep)
  const waking = bed - wake
  const committed = coveredHours(blocks, wake, bed)
  return { waking, committed, available: Math.max(0, waking - committed), blocks }
}

/** Free hours left between now and bedtime, not counting today's remaining dailies. */
export function remainingToday(blocks: Block[], sleep: SleepSettings, now: Date): number {
  const { wake, bed } = wakingWindow(sleep)
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
