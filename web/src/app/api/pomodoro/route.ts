import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { QuestService } from '@/lib/quest.service'
import { TaskEconomyService } from '@/lib/task-economy.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// POST: Start a new pomodoro session
export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const { task_id, skill_id, duration_minutes = 25, break_minutes = 5 } = await req.json()

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Cancel any existing active sessions first
  await db
    .from('pomodoro_sessions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'active')

  const { data, error: dbErr } = await db
    .from('pomodoro_sessions')
    .insert({
      user_id: user.id,
      task_id: task_id || null,
      skill_id: skill_id || null,
      duration_minutes,
      break_minutes,
      status: 'active',
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH: Complete or cancel active session
export async function PATCH(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const { session_id, action } = await req.json() // action: 'complete' | 'cancel'
  if (!session_id || !action) return NextResponse.json({ error: 'session_id and action required' }, { status: 400 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const newStatus = action === 'complete' ? 'completed' : 'cancelled'

  const { data: session, error: dbErr } = await db
    .from('pomodoro_sessions')
    .update({ status: newStatus, completed_at: new Date().toISOString() })
    .eq('id', session_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  let xpEarned = 0
  if (action === 'complete') {
    // XP = 1 per minute + 5 completion bonus, deduped via xp_transactions
    xpEarned = (session?.duration_minutes || 25) + 5
    const economy = new TaskEconomyService(db)
    await economy.awardXp(
      user.id,
      'todo',
      `pomodoro:${session_id}`,
      xpEarned,
      `Completed pomodoro session (${session?.duration_minutes || 25}m)`
    )

    // Track quest progress for pomodoro-related quests
    const questService = new QuestService(db)
    await questService.checkAndUpdateProgress(user.id, 'pomodoro', 1)
  }

  return NextResponse.json({ session, xpEarned })
}

// GET: Fetch today's completed sessions for history
export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error: dbErr } = await db
    .from('pomodoro_sessions')
    .select('*, task:todos(title)')
    .eq('user_id', user.id)
    .gte('started_at', todayStart.toISOString())
    .order('started_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
