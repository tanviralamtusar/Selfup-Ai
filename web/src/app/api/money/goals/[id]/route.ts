import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'
import { GamificationService } from '@/lib/gamification.service'

const XP_PER_CONTRIBUTION = 8

/**
 * PATCH /api/money/goals/[id]
 * Edit fields, or pass { contribute: <amount> } to add to current_amount (awards XP).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params
  const body = await req.json()

  const { data: goal, error: gErr } = await db
    .from('money_goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (gErr || !goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const f of ['name', 'target_date', 'currency', 'color', 'icon']) {
    if (body[f] !== undefined) updates[f] = body[f]
  }
  if (body.target_amount !== undefined) updates.target_amount = num(body.target_amount)

  let contributed = false
  let current = num(goal.current_amount)
  if (body.contribute !== undefined) {
    current = Math.max(0, current + num(body.contribute))
    updates.current_amount = current
    contributed = num(body.contribute) > 0
  } else if (body.current_amount !== undefined) {
    current = Math.max(0, num(body.current_amount))
    updates.current_amount = current
  }

  const target = updates.target_amount !== undefined ? (updates.target_amount as number) : num(goal.target_amount)
  const wasAchieved = goal.is_achieved
  updates.is_achieved = current >= target

  const { data, error } = await db
    .from('money_goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let leveledUp = false
  let levelUpDetails
  if (contributed) {
    const g = new GamificationService(db)
    const justAchieved = !wasAchieved && (updates.is_achieved as boolean)
    const result = await g.addXp(user.id, XP_PER_CONTRIBUTION + (justAchieved ? 25 : 0), { actionType: 'money' })
    leveledUp = result.leveledUp
    levelUpDetails = result.details
  }

  return NextResponse.json({
    success: true,
    data: { ...data, target_amount: num(data.target_amount), current_amount: num(data.current_amount) },
    leveledUp,
    levelUpDetails,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params

  const { error } = await db.from('money_goals').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
