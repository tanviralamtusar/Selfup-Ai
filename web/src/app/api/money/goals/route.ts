import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

/** GET /api/money/goals — savings goals. */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const { data, error } = await db
    .from('money_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('is_achieved', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    success: true,
    data: (data ?? []).map((g) => ({ ...g, target_amount: num(g.target_amount), current_amount: num(g.current_amount) })),
  })
}

/** POST /api/money/goals — create a savings goal. */
export async function POST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const body = await req.json()

  const { name, target_amount, current_amount = 0, target_date = null, currency = 'USD', color, icon } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const target = num(target_amount)
  if (!(target > 0)) return NextResponse.json({ error: 'Target must be greater than 0' }, { status: 400 })

  const current = num(current_amount)
  const { data, error } = await db
    .from('money_goals')
    .insert({
      user_id: user.id,
      name: name.trim(),
      target_amount: target,
      current_amount: current,
      target_date,
      currency,
      color: color || undefined,
      icon: icon || undefined,
      is_achieved: current >= target,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { ...data, target_amount: num(data.target_amount), current_amount: num(data.current_amount) } })
}
