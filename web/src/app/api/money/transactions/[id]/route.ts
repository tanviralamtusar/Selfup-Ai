import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  for (const f of ['account_id', 'to_account_id', 'category_id', 'type', 'currency', 'note', 'occurred_at']) {
    if (body[f] !== undefined) updates[f] = body[f]
  }
  if (body.amount !== undefined) {
    const amt = num(body.amount)
    if (!(amt > 0)) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    updates.amount = amt
  }

  const { data, error } = await db
    .from('money_transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, category:money_categories(id,name,kind,icon,color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { ...data, amount: num(data.amount) } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params

  const { error } = await db.from('money_transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
