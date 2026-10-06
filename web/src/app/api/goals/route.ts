import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authed, num } from '@/lib/money/server'
import { clientId, existingOnDuplicate, idempotent } from '@/lib/idempotency'
import { getUserTimezone, todayIn } from '@/lib/user-time'
import { failExpiredGoals } from '@/lib/goals.service'
import { GOAL_REWARDS } from '@/constants/gamification'

const DATE = /^\d{4}-\d{2}-\d{2}$/

const createSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().max(500).nullish(),
  target_value: z.coerce.number().positive().max(1_000_000).default(1),
  unit: z.string().trim().max(30).nullish(),
  deadline: z.string().regex(DATE, 'deadline must be YYYY-MM-DD'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

const toNumbers = (g: Record<string, unknown>) => ({ ...g, target_value: num(g.target_value), current_value: num(g.current_value) })

/**
 * GET /api/goals — the user's goals. Fails any whose deadline has passed first
 * (applying the HP penalty), so the list is always up to date.
 */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const today = todayIn(await getUserTimezone(db, user.id))
  await failExpiredGoals(db, user.id, today)

  const { data, error } = await db
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('status', { ascending: true })
    .order('deadline', { ascending: true })
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, data: (data ?? []).map(toNumbers), today })
}

/** POST /api/goals — create a goal with a strict deadline (today or later). */
async function handlePOST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid goal' }, { status: 400 })
  }
  const input = parsed.data

  const today = todayIn(await getUserTimezone(db, user.id))
  if (input.deadline < today) {
    return NextResponse.json({ success: false, error: 'The deadline must be today or later' }, { status: 400 })
  }

  const reward = GOAL_REWARDS[input.difficulty]
  const { data, error } = await db
    .from('goals')
    .insert({
      ...clientId(input.id),
      user_id: user.id,
      title: input.title,
      description: input.description || null,
      target_value: input.target_value,
      unit: input.unit || null,
      deadline: input.deadline,
      difficulty: input.difficulty,
      xp_reward: reward.xp,
      hp_penalty: reward.hpPenalty,
    })
    .select()
    .single()

  if (error) {
    const existing = await existingOnDuplicate(db, 'goals', error, input.id, user.id)
    if (existing) return NextResponse.json({ success: true, data: toNumbers(existing) })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: toNumbers(data) })
}

export const POST = idempotent(handlePOST)
