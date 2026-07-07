import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const f of ['name', 'type', 'currency', 'color', 'icon', 'is_active', 'sort_order']) {
    if (body[f] !== undefined) updates[f] = body[f]
  }
  if (body.opening_balance !== undefined) updates.opening_balance = num(body.opening_balance)

  const { data, error } = await db
    .from('money_accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params

  const { error } = await db.from('money_accounts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
