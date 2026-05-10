import { SupabaseClient } from '@supabase/supabase-js'

interface ConflictResult {
  available: boolean
  conflicts: { title: string; time: string; source: string }[]
  suggestedAlternatives: string[]
}

export async function checkAvailability(
  userId: string,
  preferredDay: string,
  preferredTime: string,
  sessionDurationMinutes: number,
  supabase: SupabaseClient
): Promise<ConflictResult> {
  const { data: scheduledDailies } = await supabase
    .from('dailies')
    .select('title, scheduled_time, repeat_days, source')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .not('scheduled_time', 'is', null)

  const conflicts: ConflictResult['conflicts'] = []

  if (scheduledDailies) {
    for (const daily of scheduledDailies) {
      const repeatDays = daily.repeat_days || []
      if (!repeatDays.includes(preferredDay)) continue

      if (daily.scheduled_time && timeOverlaps(daily.scheduled_time, preferredTime, sessionDurationMinutes)) {
        conflicts.push({ title: daily.title, time: daily.scheduled_time, source: daily.source || 'user' })
      }
    }
  }

  if (conflicts.length > 0) {
    const alternatives = await findNextFreeSlots(userId, preferredDay, supabase)
    return { available: false, conflicts, suggestedAlternatives: alternatives }
  }

  return { available: true, conflicts: [], suggestedAlternatives: [] }
}

function timeOverlaps(existingTime: string, newTime: string, durationMinutes: number): boolean {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const eStart = toMin(existingTime), nStart = toMin(newTime)
  return nStart < eStart + 60 && eStart < nStart + durationMinutes
}

async function findNextFreeSlots(userId: string, day: string, supabase: SupabaseClient): Promise<string[]> {
  const { data: busySlots } = await supabase
    .from('dailies').select('scheduled_time').eq('user_id', userId)
    .eq('is_completed', false).not('scheduled_time', 'is', null).contains('repeat_days', [day])

  const busy = new Set((busySlots || []).map(s => s.scheduled_time?.substring(0, 5)).filter(Boolean))
  return ['06:00','07:00','08:00','16:00','17:00','18:00','19:00','20:00'].filter(t => !busy.has(t)).slice(0, 3)
}

export async function batchCheckAvailability(
  userId: string, days: { day: string; time: string }[], duration: number, supabase: SupabaseClient
) {
  const results = []
  for (const { day, time } of days) {
    results.push({ day, result: await checkAvailability(userId, day, time, duration, supabase) })
  }
  return results
}
