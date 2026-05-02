import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { calculateTaskXp } from '@/lib/task-economy.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

/**
 * PATCH /api/todos/[id] — update a todo
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
    'title', 'description', 'priority', 'category', 'due_date',
    'scheduled_time', 'subtasks', 'require_all_subtasks'
  ]
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  // Recalculate XP if priority or due_date changed
  if (updates.priority || updates.due_date !== undefined) {
    // Need to fetch current data to know if due_date exists
    const { data: current } = await db
      .from('todos')
      .select('priority, due_date')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (current) {
      const newPriority = (updates.priority || current.priority) as string
      const hasDue = updates.due_date !== undefined ? !!updates.due_date : !!current.due_date
      const { xp_reward, xp_penalty } = calculateTaskXp('todo', newPriority as any, hasDue)
      updates.xp_reward = xp_reward
      updates.xp_penalty = xp_penalty
    }
  }

  const { data, error: dbErr } = await db
    .from('todos')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  if (!data) return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })

  return NextResponse.json({ success: true, data })
}

/**
 * DELETE /api/todos/[id] — delete a todo
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
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
