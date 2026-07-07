import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'
import { monthKey } from '@/lib/money/format'

/**
 * GET /api/money/budgets?month=YYYY-MM-01
 * Returns budgets for the month with the amount already spent per category.
 */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const month = req.nextUrl.searchParams.get('month') || monthKey()

  const start = new Date(month + 'T00:00:00Z')
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)

  const [{ data: budgets, error: bErr }, { data: txns, error: tErr }] = await Promise.all([
    db
      .from('money_budgets')
      .select('*, category:money_categories(id,name,kind,icon,color)')
      .eq('user_id', user.id)
      .eq('month', month),
    db
      .from('money_transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('occurred_at', start.toISOString().slice(0, 10))
      .lt('occurred_at', end.toISOString().slice(0, 10)),
  ])
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  const spent = new Map<string, number>()
  for (const t of txns ?? []) {
    if (t.category_id) spent.set(t.category_id, (spent.get(t.category_id) ?? 0) + num(t.amount))
  }

  const data = (budgets ?? []).map((b) => ({
    ...b,
    limit_amount: num(b.limit_amount),
    spent: spent.get(b.category_id) ?? 0,
  }))

  return NextResponse.json({ success: true, data })
}

/** POST /api/money/budgets — upsert a category budget for a month. */
export async function POST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const body = await req.json()
  const { category_id, limit_amount } = body
  const month = body.month || monthKey()

  if (!category_id) return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
  const limit = num(limit_amount)
  if (limit < 0) return NextResponse.json({ error: 'Budget cannot be negative' }, { status: 400 })

  const { data, error } = await db
    .from('money_budgets')
    .upsert(
      { user_id: user.id, category_id, month, limit_amount: limit, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,category_id,month' }
    )
    .select('*, category:money_categories(id,name,kind,icon,color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { ...data, limit_amount: num(data.limit_amount), spent: 0 } })
}

/** DELETE /api/money/budgets?id=... */
export async function DELETE(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await db.from('money_budgets').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
