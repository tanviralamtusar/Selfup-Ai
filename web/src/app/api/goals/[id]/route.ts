import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authed, num } from '@/lib/money/server'
import { actionDate, idempotent } from '@/lib/idempotency'
import { getUserTimezone, todayIn } from '@/lib/user-time'
import { TaskEconomyService } from '@/lib/task-economy.service'
import { completeGoal, failExpiredGoals, type Goal } from '@/lib/goals.service'

const patchSchema = z.object({
  /** Add to current_value (negative to correct a mistake). */
  progress: z.coerce.number().min(-1_000_000).max(1_000_000).optional(),
  /** Set current_value outright. */
  current_value: z.coerce.number().min(0).max(1_000_000).optional(),
  /** Mark done in one go (sets current_value to the target). */
  complete: z.boolean().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  /** Day the progress was made (offline clients); defaults to today. */
  date: z.string().optional(),
})

/**
 * PATCH /api/goals/[id] — record progress. Reaching the target completes the
 * goal and awards XP. The deadline is strict: once it has passed the goal is
 * failed (HP penalty) and no longer accepts progress.
 */
async function handlePATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }
  const body = parsed.data

  const tz = await getUserTimezone(db, user.id)
  const today = todayIn(tz)
  // Progress logged offline counts on the day it was made, so a phone that
  // syncs late doesn't lose a goal it actually finished in time.
  const day = actionDate(body.date, tz)

  const { data: row, error: gErr } = await db.from('goals').select('*').eq('id', id).eq('user_id', user.id).single()
  if (gErr || !row) return NextResponse.json({ success: false, error: 'Goal not found' }, { status: 404 })
  const goal = { ...row, target_value: num(row.target_value), current_value: num(row.current_value) } as Goal

  const recordsProgress = body.progress !== undefined || body.current_value !== undefined || body.complete
  if (goal.status === 'active' && recordsProgress && day > goal.deadline) {
    await failExpiredGoals(db, user.id, today)
    return NextResponse.json({ success: false, error: 'The deadline has passed — this goal failed' }, { status: 409 })
  }
  if (goal.status !== 'active') {
    return NextResponse.json({ success: false, error: `This goal is already ${goal.status}` }, { status: 409 })
  }

  let current = goal.current_value
  if (body.complete) current = goal.target_value
  else if (body.current_value !== undefined) current = body.current_value
  else if (body.progress !== undefined) current = Math.max(0, current + body.progress)

  if (current >= goal.target_value) {
    const done = await completeGoal(db, user.id, goal, current)
    if (!done.goal) return NextResponse.json({ success: false, error: 'This goal is no longer active' }, { status: 409 })
    return NextResponse.json({
      success: true,
      data: { ...done.goal, target_value: num(done.goal.target_value), current_value: num(done.goal.current_value) },
      xp_awarded: done.xpAwarded,
      leveled_up: done.leveledUp,
    })
  }

  const updates: Record<string, unknown> = { current_value: current, updated_at: new Date().toISOString() }
  if (body.title) updates.title = body.title
  const { data, error } = await db
    .from('goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .select()
    .single()
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, data: { ...data, target_value: num(data.target_value), current_value: num(data.current_value) } })
}

/** Deleting an active goal within this window counts as fixing a mistake, not giving up. */
const FREE_DELETE_MS = 60 * 60 * 1000

/**
 * DELETE /api/goals/[id] — remove a goal. Deleting an active goal is giving up
 * on it: it costs the same HP as missing the deadline (except right after
 * creating it), so deleting can't dodge the penalty.
 */
async function handleDELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params

  const { data, error } = await db.from('goals').delete().eq('id', id).eq('user_id', user.id).select('*')
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  const goal = data?.[0]
  if (!goal) return NextResponse.json({ success: false, error: 'Goal not found' }, { status: 404 })

  let hpLost = 0
  const isFresh = Date.now() - new Date(goal.created_at).getTime() < FREE_DELETE_MS
  if (goal.status === 'active' && !isFresh && goal.hp_penalty > 0) {
    const r = await new TaskEconomyService(db).applyHpDamage(user.id, goal.hp_penalty, `Gave up on goal: ${goal.title}`)
    hpLost = r.actualDamage
  }
  return NextResponse.json({ success: true, data: { hp_lost: hpLost } })
}

export const PATCH = idempotent(handlePATCH)
export const DELETE = idempotent(handleDELETE)
