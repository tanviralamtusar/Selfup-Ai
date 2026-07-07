import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  for (const f of ['name', 'type', 'cadence', 'next_due', 'account_id', 'category_id', 'currency', 'auto_post', 'is_active']) {
    if (body[f] !== undefined) updates[f] = body[f]
  }
  if (body.amount !== undefined) updates.amount = num(body.amount)

  const { data, error } = await db
    .from('money_recurring')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, category:money_categories(id,name,icon,color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: { ...data, amount: num(data.amount) } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params

  const { error } = await db.from('money_recurring').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
