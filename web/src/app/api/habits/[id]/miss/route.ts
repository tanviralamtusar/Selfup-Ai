import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { TaskEconomyService } from '@/lib/task-economy.service'
import { HP_DAMAGE } from '@/constants/gamification'
import { idempotent, actionDate } from '@/lib/idempotency'
import { getUserTimezone } from '@/lib/user-time'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

/**
 * POST /api/habits/[id]/miss — the habit's "−" button: didn't do it today.
 * Deals the habit's HP penalty and resets its streak. Once per user-local day.
 */
async function handlePOST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const { id: habitId } = await params
  const db = getDb(req)
  const body = await req.json().catch(() => ({}))

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

  // Offline clients replay with the day the user actually pressed it.
  const day = actionDate(body.date, await getUserTimezone(db, user.id))

  // Conditional update claims the day, so a double press can't damage twice.
  const { data: claimed, error: updateErr } = await db
    .from('habits')
    .update({
      missed_on: day,
      current_streak: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .eq('user_id', user.id)
    .or(`missed_on.is.null,missed_on.neq.${day}`)
    .select('id')

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'Already marked missed today',
      alreadyMissed: true,
    }, { status: 409 })
  }

  const economy = new TaskEconomyService(db)
  const damage = await economy.applyHpDamage(
    user.id,
    habit.hp_penalty || HP_DAMAGE.MISSED_DAILY_HABIT,
    `Missed habit: ${habit.title}`
  )

  return NextResponse.json({
    success: true,
    data: {
      habit_id: habitId,
      missed_on: day,
      current_streak: 0,
      hp_lost: damage.actualDamage,
      new_hp: damage.newHp,
    }
  })
}

export const POST = idempotent(handlePOST)
