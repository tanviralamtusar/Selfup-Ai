import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

/** GET /api/money/accounts — accounts with computed current balance. */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const [{ data: accounts, error: aErr }, { data: txns, error: tErr }] = await Promise.all([
    db.from('money_accounts').select('*').eq('user_id', user.id).order('sort_order').order('created_at'),
    db.from('money_transactions').select('account_id, to_account_id, type, amount').eq('user_id', user.id),
  ])
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // balance = opening + income - expense (+ transfers in) - (transfers out)
  const delta = new Map<string, number>()
  for (const t of txns ?? []) {
    const amt = num(t.amount)
    if (t.type === 'income' && t.account_id) delta.set(t.account_id, (delta.get(t.account_id) ?? 0) + amt)
    else if (t.type === 'expense' && t.account_id) delta.set(t.account_id, (delta.get(t.account_id) ?? 0) - amt)
    else if (t.type === 'transfer') {
      if (t.account_id) delta.set(t.account_id, (delta.get(t.account_id) ?? 0) - amt)
      if (t.to_account_id) delta.set(t.to_account_id, (delta.get(t.to_account_id) ?? 0) + amt)
    }
  }

  const data = (accounts ?? []).map((a) => ({
    ...a,
    opening_balance: num(a.opening_balance),
    balance: num(a.opening_balance) + (delta.get(a.id) ?? 0),
  }))

  return NextResponse.json({ success: true, data })
}

/** POST /api/money/accounts — create an account. */
export async function POST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const body = await req.json()
  const { name, type = 'cash', currency = 'USD', opening_balance = 0, color, icon } = body
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Account name is required' }, { status: 400 })
  }
  if (!['cash', 'bank', 'card', 'investment', 'other'].includes(type)) {
    return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
  }

  const { data, error } = await db
    .from('money_accounts')
    .insert({
      user_id: user.id,
      name: name.trim(),
      type,
      currency,
      opening_balance: num(opening_balance),
      color: color || undefined,
      icon: icon || undefined,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { ...data, balance: num(data.opening_balance) } })
}
