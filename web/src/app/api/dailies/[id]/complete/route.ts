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
 * POST /api/dailies/[id]/complete — mark a daily as completed
 * Awards XP (with attribute multiplier), fires quest completion event
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const { id } = await params
  const db = getDb(req)

  // Fetch the daily
  const { data: daily, error: fetchErr } = await db
    .from('dailies')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !daily) {
    return NextResponse.json({ success: false, error: 'Daily not found' }, { status: 404 })
  }

  if (daily.is_completed) {
    return NextResponse.json({ success: false, error: 'Already completed today' }, { status: 409 })
  }

  // Check subtask requirement
  if (daily.require_all_subtasks && Array.isArray(daily.subtasks) && daily.subtasks.length > 0) {
    const allComplete = daily.subtasks.every((s: { is_completed: boolean }) => s.is_completed)
    if (!allComplete) {
      return NextResponse.json({ 
        success: false, 
        error: 'All subtasks must be completed first' 
      }, { status: 400 })
    }
  }

  // Mark completed
  const { error: updateErr } = await db
    .from('dailies')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  // Award XP with attribute multiplier
  const economy = new TaskEconomyService(db)

  // Fetch user attributes for multiplier calculation
  const { data: profile } = await db
    .from('user_profiles')
    .select('attr_str, attr_int, attr_agi, attr_vit, attr_cha')
    .eq('id', user.id)
    .single()

  let xpAmount = daily.xp_reward
  if (profile) {
    xpAmount = economy.applyAttributeMultiplier(xpAmount, daily.category, profile)
  }

  // Award XP — idempotent via xp_transactions
  // Use daily.id + today's date as source_id so it can be re-awarded tomorrow
  const today = new Date().toISOString().split('T')[0]
  const sourceId = `${daily.id}:${today}`

  const xpResult = await economy.awardXp(
    user.id,
    'daily',
    sourceId,
    xpAmount,
    `Completed daily: ${daily.title}`
  )

  return NextResponse.json({
    success: true,
    data: {
      daily_id: daily.id,
      xp_awarded: xpResult.alreadyAwarded ? 0 : xpAmount,
      already_awarded: xpResult.alreadyAwarded,
    }
  })
}
