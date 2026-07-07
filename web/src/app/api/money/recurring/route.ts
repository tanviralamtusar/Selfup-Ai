import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

/** GET /api/money/recurring — active recurring rules, soonest due first. */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const { data, error } = await db
    .from('money_recurring')
    .select('*, category:money_categories(id,name,icon,color)')
    .eq('user_id', user.id)
    .order('is_active', { ascending: false })
    .order('next_due', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: (data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) })
}

/** POST /api/money/recurring — create a recurring bill/income. */
export async function POST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const body = await req.json()

  const { name, type = 'expense', amount, cadence = 'monthly', next_due, account_id = null, category_id = null, currency = 'USD', auto_post = false } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!['income', 'expense'].includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  if (!['weekly', 'monthly', 'yearly'].includes(cadence)) return NextResponse.json({ error: 'Invalid cadence' }, { status: 400 })
  const amt = num(amount)
  if (!(amt > 0)) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  if (!next_due) return NextResponse.json({ error: 'next_due is required' }, { status: 400 })

  const { data, error } = await db
    .from('money_recurring')
    .insert({ user_id: user.id, name: name.trim(), type, amount: amt, cadence, next_due, account_id, category_id, currency, auto_post })
    .select('*, category:money_categories(id,name,icon,color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { ...data, amount: amt } })
}
