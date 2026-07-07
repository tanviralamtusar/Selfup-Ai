import { NextRequest, NextResponse } from 'next/server'
import { authed } from '@/lib/money/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  for (const f of ['name', 'kind', 'icon', 'color', 'is_active']) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  // RLS blocks editing global (user_id IS NULL) rows via the modify policy.
  const { data, error } = await db
    .from('money_categories')
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

  const { error } = await db.from('money_categories').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
