import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { TaskEconomyService } from '@/lib/task-economy.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

/**
 * PATCH /api/dailies/[id] — update a daily
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

  // Only allow updating specific fields
  const allowedFields = [
    'title', 'description', 'priority', 'category', 'repeat_type',
    'repeat_days', 'scheduled_time', 'expires_on', 'subtasks',
    'require_all_subtasks'
  ]
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  // Recalculate XP if priority changed
  if (updates.priority) {
    const { calculateTaskXp } = await import('@/lib/task-economy.service')
    const { xp_reward, xp_penalty } = calculateTaskXp('daily', updates.priority as 'low' | 'medium' | 'high' | 'critical')
    updates.xp_reward = xp_reward
    updates.xp_penalty = xp_penalty
  }

  const { data, error: dbErr } = await db
    .from('dailies')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  if (!data) return NextResponse.json({ success: false, error: 'Daily not found' }, { status: 404 })

  return NextResponse.json({ success: true, data })
}

/**
 * DELETE /api/dailies/[id] — delete a daily
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
    .from('dailies')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
