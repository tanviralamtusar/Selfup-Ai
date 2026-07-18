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
 * POST /api/todos/[id]/complete — mark a todo as completed
 * Awards XP (with attribute multiplier), one-time only
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const { id } = await params
  const db = getDb(req)

  // Fetch the todo
  const { data: todo, error: fetchErr } = await db
    .from('todos')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !todo) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }

  if (todo.is_completed) {
    return NextResponse.json({ success: false, error: 'Already completed' }, { status: 409 })
  }

  // Check subtask requirement
  if (todo.require_all_subtasks && Array.isArray(todo.subtasks) && todo.subtasks.length > 0) {
    const allComplete = todo.subtasks.every((s: { is_completed: boolean }) => s.is_completed)
    if (!allComplete) {
      return NextResponse.json({
        success: false,
        error: 'All subtasks must be completed first'
      }, { status: 400 })
    }
  }

  // Mark completed
  const { error: updateErr } = await db
    .from('todos')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  // Award XP — idempotent (todo completion is one-time).
  // The attribute multiplier is applied inside awardXp via the category, so it
  // must NOT be pre-applied here or the bonus would compound.
  const economy = new TaskEconomyService(db)

  const xpResult = await economy.awardXp(
    user.id,
    'todo',
    todo.id,
    todo.xp_reward,
    `Completed todo: ${todo.title}`,
    todo.category
  )

  return NextResponse.json({
    success: true,
    data: {
      todo_id: todo.id,
      xp_awarded: xpResult.amount,
      already_awarded: xpResult.alreadyAwarded,
      leveled_up: xpResult.leveledUp,
    }
  })
}
