import { NextRequest, NextResponse } from 'next/server'
import { authed } from '@/lib/money/server'

/** GET /api/money/categories — global + user categories. */
export async function GET(req: NextRequest) {
  const { db, res } = await authed(req)
  if (res) return res

  // RLS already limits to (user_id IS NULL OR own). Order income first, then name.
  const { data, error } = await db
    .from('money_categories')
    .select('*')
    .eq('is_active', true)
    .order('kind', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: data ?? [] })
}

/** POST /api/money/categories — create a custom category. */
export async function POST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const body = await req.json()
  const { name, kind = 'expense', icon, color } = body
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }
  if (!['income', 'expense'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }

  const { data, error } = await db
    .from('money_categories')
    .insert({ user_id: user.id, name: name.trim(), kind, icon: icon || undefined, color: color || undefined })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
