import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TaskEconomyService } from '@/lib/task-economy.service'
import { GamificationService } from '@/lib/gamification.service'
import { HP_DAMAGE, HP_RECOVERY } from '@/constants/gamification'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Was this daily scheduled on the given date?
 * Mirrors the filter in GET /api/dailies, but for an arbitrary day.
 */
function isScheduledOn(daily: any, date: Date): boolean {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (daily.expires_on && new Date(daily.expires_on) < dayStart) return false
  if (daily.created_at && new Date(daily.created_at) > new Date(dayStart.getTime() + 86400000)) return false
  if (daily.repeat_type === 'weekly' && daily.repeat_days) {
    return daily.repeat_days.includes(DAY_NAMES[date.getDay()])
  }
  return true
}

async function loadCronState(db: SupabaseClient, userId: string) {
  const { data: profile } = await db
    .from('user_profiles')
    .select('last_cron_date')
    .eq('id', userId)
    .single()

  const today = toDateStr(new Date())
  // A profile that has never run cron is treated as up to date, so a brand new
  // user is not immediately shown a check-in for days they were never here.
  const lastCronDate: string = profile?.last_cron_date ?? today

  return { today, lastCronDate, isDue: lastCronDate < today }
}

/**
 * GET /api/dailies/cron — is a new day pending, and what was due on it?
 *
 * Returns the dailies scheduled for the last un-rolled day so the client can
 * show the Habitica-style "Welcome back" check-in before anything is scored.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const db = getDb(req)
  const { today, lastCronDate, isDue } = await loadCronState(db, user.id)

  if (!isDue) {
    return NextResponse.json({ success: true, data: { isDue: false, lastCronDate, dailies: [] } })
  }

  const { data, error: dbErr } = await db
    .from('dailies')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_time', { ascending: true, nullsFirst: false })

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })

  const missedDay = new Date(`${lastCronDate}T12:00:00`)
  const dueThatDay = (data || []).filter((d) => isScheduledOn(d, missedDay))

  return NextResponse.json({
    success: true,
    data: {
      isDue: true,
      lastCronDate,
      today,
      daysMissed: Math.round(
        (new Date(`${today}T12:00:00`).getTime() - missedDay.getTime()) / 86400000
      ),
      dailies: dueThatDay.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        priority: d.priority,
        scheduled_time: d.scheduled_time,
        xp_reward: d.xp_reward,
        xp_penalty: d.xp_penalty,
        current_streak: d.current_streak ?? 0,
        // Ticked during the day itself — already scored, shown pre-checked.
        is_completed: d.is_completed,
      })),
    },
  })
}

/**
 * POST /api/dailies/cron — run the new day.
 *
 * Body: { completedIds: string[] } — dailies the user retroactively confirms
 * they did yesterday.
 *
 * Awards XP for confirmed dailies (backdated so the idempotency key belongs to
 * the day it was earned), applies XP penalty + HP damage for the rest, rolls
 * streaks, then clears completion flags for the new day.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const db = getDb(req)
  const body = await req.json().catch(() => ({}))
  const completedIds: string[] = Array.isArray(body.completedIds) ? body.completedIds : []

  const { today, lastCronDate, isDue } = await loadCronState(db, user.id)

  // Not due — the day was already rolled (double submit, or another tab won).
  // Returning success keeps the client idempotent.
  if (!isDue) {
    return NextResponse.json({ success: true, data: { alreadyRan: true, lastCronDate } })
  }

  // Claim the day up front. Whatever happens below runs once: a crash mid-way
  // is preferable to a retry that double-penalises.
  const { error: claimErr } = await db
    .from('user_profiles')
    .update({ last_cron_date: today })
    .eq('id', user.id)
    .eq('last_cron_date', lastCronDate)

  if (claimErr) {
    return NextResponse.json({ success: false, error: claimErr.message }, { status: 500 })
  }

  const { data: allDailies } = await db
    .from('dailies')
    .select('*')
    .eq('user_id', user.id)

  const missedDay = new Date(`${lastCronDate}T12:00:00`)
  const dueThatDay = (allDailies || []).filter((d) => isScheduledOn(d, missedDay))
  const confirmed = new Set(completedIds)

  const economy = new TaskEconomyService(db)
  const gamification = new GamificationService(db)

  let xpEarned = 0
  let xpLost = 0
  let hpLost = 0
  let completedCount = 0
  const missedTitles: string[] = []

  for (const daily of dueThatDay) {
    const wasDone = daily.is_completed || confirmed.has(daily.id)
    const streak = daily.current_streak ?? 0

    if (wasDone) {
      completedCount += 1

      // Only award for retroactive ticks — ones completed in-app during the day
      // were already scored, and the shared source_id would collapse anyway.
      if (!daily.is_completed) {
        const result = await economy.awardXp(
          user.id,
          'daily',
          `${daily.id}:${lastCronDate}`,
          daily.xp_reward,
          `Checked in: ${daily.title}`,
          daily.category
        )
        xpEarned += result.amount
      }

      const nextStreak = streak + 1
      await db
        .from('dailies')
        .update({
          current_streak: nextStreak,
          longest_streak: Math.max(nextStreak, daily.longest_streak ?? 0),
        })
        .eq('id', daily.id)
        .eq('user_id', user.id)
    } else {
      missedTitles.push(daily.title)

      if (daily.xp_penalty > 0) {
        await economy.applyXpPenalty(
          user.id,
          'daily',
          `${daily.id}:${lastCronDate}`,
          daily.xp_penalty,
          `Missed daily: ${daily.title}`
        )
        xpLost += daily.xp_penalty
      }

      await db
        .from('dailies')
        .update({ current_streak: 0 })
        .eq('id', daily.id)
        .eq('user_id', user.id)
    }
  }

  // HP damage is pooled and capped per day rather than charged per daily, so a
  // user with twenty dailies is not wiped out by a single bad day.
  const missedCount = missedTitles.length
  if (missedCount > 0) {
    const rawDamage = Math.min(
      missedCount * HP_DAMAGE.MISSED_DAILY_HABIT,
      HP_DAMAGE.MISSED_HABIT_DAILY_CAP
    )
    const result = await economy.applyHpDamage(
      user.id,
      rawDamage,
      `Missed ${missedCount} ${missedCount === 1 ? 'daily' : 'dailies'} on ${lastCronDate}`
    )
    hpLost = result.actualDamage
  }

  // Perfect day — everything due was done.
  let hpHealed = 0
  if (missedCount === 0 && dueThatDay.length > 0) {
    const heal = await economy.recoverHp(user.id, HP_RECOVERY.PERFECT_DAY, 'Perfect day')
    hpHealed = heal.newHp
    await gamification.addXp(user.id, 50, { skipModifier: true })
  }

  // Reset for the new day.
  await db
    .from('dailies')
    .update({ is_completed: false, completed_at: null })
    .eq('user_id', user.id)
    .eq('is_completed', true)

  // Habits reset on their own cadence; only the daily ones roll over here.
  await db
    .from('habits')
    .update({ is_completed_this_cycle: false })
    .eq('user_id', user.id)
    .eq('reset_type', 'daily')
    .eq('is_completed_this_cycle', true)

  return NextResponse.json({
    success: true,
    data: {
      alreadyRan: false,
      ranFor: lastCronDate,
      totalDue: dueThatDay.length,
      completedCount,
      missedCount,
      missedTitles,
      xpEarned,
      xpLost,
      hpLost,
      hpHealed,
      perfectDay: missedCount === 0 && dueThatDay.length > 0,
    },
  })
}
