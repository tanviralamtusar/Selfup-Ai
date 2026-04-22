import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { supabase as adminClient } from '@/lib/supabase'
import { GamificationService } from '@/lib/gamification.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questId } = await params
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Get the user_quest record
  const { data: userQuest, error: uqErr } = await db
    .from('user_quests')
    .select('id, status, current_value, target_value')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .single()

  if (uqErr || !userQuest) return NextResponse.json({ error: 'Quest not accepted' }, { status: 404 })
  if (userQuest.status === 'completed') return NextResponse.json({ error: 'Quest already completed' }, { status: 409 })
  if (userQuest.status === 'expired') return NextResponse.json({ error: 'Quest has expired' }, { status: 410 })

  // Validate progress — must have reached target (or allow manual complete for target=1 quests)
  if (userQuest.target_value > 1 && userQuest.current_value < userQuest.target_value) {
    return NextResponse.json({
      error: 'Quest not yet complete',
      current_value: userQuest.current_value,
      target_value: userQuest.target_value,
    }, { status: 400 })
  }

  // Mark complete
  const { error: markErr } = await db
    .from('user_quests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      current_value: userQuest.target_value, // Ensure it shows as 100%
    })
    .eq('id', userQuest.id)

  if (markErr) return NextResponse.json({ error: markErr.message }, { status: 500 })

  // Get quest rewards (use admin client since quests table might have restricted RLS)
  const { data: quest } = await adminClient
    .from('quests')
    .select('xp_reward, coin_reward, title')
    .eq('id', questId)
    .single()

  const xpReward = quest?.xp_reward || 50
  const coinReward = quest?.coin_reward || 0

  // Use GamificationService for rewards
  const gService = new GamificationService(db)
  const { leveledUp, details: levelUpDetails } = await gService.addXp(user.id, xpReward)
  
  // If coins are rewarded by the quest itself (separate from level up bonus)
  if (coinReward > 0) {
    await gService.addCoins(user.id, coinReward, `Completed quest: ${quest?.title}`)
  }

  // Update overall streak
  const { streak } = await gService.updateOverallStreak(user.id)

  return NextResponse.json({ 
    success: true, 
    xpReward, 
    coinReward,
    leveledUp,
    levelUpDetails,
    streak,
  })
}
