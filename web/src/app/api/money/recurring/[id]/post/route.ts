import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

/** Advance a date by one cadence step. */
function advance(dateIso: string, cadence: string): string {
  const d = new Date(dateIso + 'T00:00:00Z')
  if (cadence === 'weekly') d.setUTCDate(d.getUTCDate() + 7)
  else if (cadence === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * POST /api/money/recurring/[id]/post
 * Posts the recurring rule as a transaction now and advances next_due.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params

  const { data: rule, error: rErr } = await db
    .from('money_recurring')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (rErr || !rule) return NextResponse.json({ error: 'Recurring rule not found' }, { status: 404 })

  const today = new Date().toISOString().slice(0, 10)

  const { data: txn, error: tErr } = await db
    .from('money_transactions')
    .insert({
      user_id: user.id,
      account_id: rule.account_id,
      category_id: rule.category_id,
      type: rule.type,
      amount: num(rule.amount),
      currency: rule.currency,
      note: rule.name,
      occurred_at: today,
      recurring_id: rule.id,
    })
    .select('*, category:money_categories(id,name,kind,icon,color)')
    .single()
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  const { data: updated, error: uErr } = await db
    .from('money_recurring')
    .update({ next_due: advance(rule.next_due, rule.cadence), last_posted_at: today })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, category:money_categories(id,name,icon,color)')
    .single()
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  return NextResponse.json({ success: true, data: { transaction: { ...txn, amount: num(txn.amount) }, recurring: { ...updated, amount: num(updated.amount) } } })
}
