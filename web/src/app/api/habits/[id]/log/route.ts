import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { GamificationService } from '@/lib/gamification.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: habitId } = await params
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const today = new Date().toISOString().split('T')[0]

  // Check if already logged today
  const { data: existing } = await db
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_at', today)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already logged today', alreadyDone: true }, { status: 409 })
  }

  // Log it
  const { data: log, error: logErr } = await db
    .from('habit_logs')
    .insert({ habit_id: habitId, user_id: user.id, completed_at: today })
    .select()
    .single()

  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 })

  // Increment streak on habit
  const { data: habit } = await db.from('habits').select('streak, best_streak').eq('id', habitId).single()
  if (habit) {
    const newStreak = (habit.streak || 0) + 1
    await db.from('habits').update({
      streak: newStreak,
      best_streak: Math.max(newStreak, habit.best_streak || 0)
    }).eq('id', habitId)
  }

  // Award XP: 10 per habit log
  const xpAward = 10
  const gService = new GamificationService(db)
  const { leveledUp, details: levelUpDetails } = await gService.addXp(user.id, xpAward)

  return NextResponse.json({ 
    log, 
    xpEarned: xpAward,
    leveledUp,
    levelUpDetails
  })
}
