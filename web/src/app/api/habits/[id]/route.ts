import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { calculateHpPenalty } from '@/lib/task-economy.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

/**
 * PATCH /api/habits/[id] — update a habit
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const db = getDb(req)

  const allowedFields = [
    'title', 'description', 'category', 'reset_type',
    'is_indefinite', 'end_date', 'is_active',
    'is_positive', 'is_negative', 'difficulty'
  ]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  // Recalculate HP penalty if reset_type changed
  if (updates.reset_type) {
    updates.hp_penalty = calculateHpPenalty(updates.reset_type as 'daily' | 'weekly' | 'monthly')
  }

  // Recalculate XP reward if difficulty changed
  if (updates.difficulty) {
    const diff = updates.difficulty as string
    updates.xp_reward = diff === 'trivial' ? 5 : diff === 'easy' ? 10 : diff === 'medium' ? 15 : 20
  }

  const { data, error: dbErr } = await db
    .from('habits')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  if (!data) return NextResponse.json({ success: false, error: 'Habit not found' }, { status: 404 })

  return NextResponse.json({ success: true, data })
}

/**
 * DELETE /api/habits/[id] — delete a habit
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const { id } = await params
  const db = getDb(req)

  const { error: dbErr } = await db
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
