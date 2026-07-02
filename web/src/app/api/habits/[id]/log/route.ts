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
 * POST /api/habits/[id]/log — mark habit as completed this cycle
 * Awards 10 XP, increments streak, updates longest_streak
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const { id: habitId } = await params
  const db = getDb(req)
  const body = await req.json().catch(() => ({}))
  const notes: string | undefined = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : undefined

  // Fetch the habit
  const { data: habit, error: fetchErr } = await db
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !habit) {
    return NextResponse.json({ success: false, error: 'Habit not found' }, { status: 404 })
  }

  if (habit.is_completed_this_cycle) {
    return NextResponse.json({
      success: false,
      error: 'Already completed this cycle',
      alreadyDone: true,
    }, { status: 409 })
  }

  // Mark as completed this cycle, increment streaks
  const newStreak = (habit.current_streak || 0) + 1
  const longestStreak = Math.max(newStreak, habit.longest_streak || 0)

  const { error: updateErr } = await db
    .from('habits')
    .update({
      is_completed_this_cycle: true,
      completed_at: new Date().toISOString(),
      current_streak: newStreak,
      longest_streak: longestStreak,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .eq('user_id', user.id)

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  // Also log in habit_logs for historical tracking
  const today = new Date().toISOString().split('T')[0]
  const logRow: Record<string, unknown> = { habit_id: habitId, user_id: user.id, completed_at: today }
  if (notes) logRow.notes = notes
  await db
    .from('habit_logs')
    .insert(logRow)
    .then(() => {}) // ignore if logs table has issues

  // Award XP — idempotent via xp_transactions
  const economy = new TaskEconomyService(db)
  const sourceId = `${habitId}:${today}`

  const xpResult = await economy.awardXp(
    user.id,
    'habit',
    sourceId,
    habit.xp_reward || 10,
    `Completed habit: ${habit.title}`
  )

  return NextResponse.json({
    success: true,
    data: {
      habit_id: habitId,
      current_streak: newStreak,
      longest_streak: longestStreak,
      xp_awarded: xpResult.alreadyAwarded ? 0 : (habit.xp_reward || 10),
      already_awarded: xpResult.alreadyAwarded,
    }
  })
}
