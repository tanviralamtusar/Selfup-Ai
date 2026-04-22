import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { QuestService } from '@/lib/quest.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/quests/[id]/progress
 * Manually increment progress on a quest.
 * Body: { increment?: number } (defaults to 1)
 */
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

  const body = await req.json().catch(() => ({}))
  const increment = body.increment || 1

  // Get user_quest
  const { data: userQuest, error: uqErr } = await db
    .from('user_quests')
    .select('id, current_value, target_value, status, quest_id')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .single()

  if (uqErr || !userQuest) {
    return NextResponse.json({ error: 'Quest not found or not accepted' }, { status: 404 })
  }

  if (userQuest.status === 'completed') {
    return NextResponse.json({ error: 'Quest already completed' }, { status: 409 })
  }

  if (userQuest.status === 'expired') {
    return NextResponse.json({ error: 'Quest has expired' }, { status: 410 })
  }

  const newValue = Math.min(userQuest.current_value + increment, userQuest.target_value)
  const completed = newValue >= userQuest.target_value

  const updateData: Record<string, unknown> = { current_value: newValue }
  if (completed) {
    updateData.status = 'completed'
    updateData.completed_at = new Date().toISOString()
  }

  await db.from('user_quests').update(updateData).eq('id', userQuest.id)

  // If completed, award rewards
  let xpReward = 0
  let coinReward = 0
  let leveledUp = false
  let levelUpDetails = null

  if (completed) {
    const { data: quest } = await db
      .from('quests')
      .select('xp_reward, coin_reward, title')
      .eq('id', questId)
      .single()

    xpReward = quest?.xp_reward || 50
    coinReward = quest?.coin_reward || 0

    const { GamificationService } = await import('@/lib/gamification.service')
    const gService = new GamificationService(db)
    const result = await gService.addXp(user.id, xpReward)
    leveledUp = result.leveledUp
    levelUpDetails = result.details

    if (coinReward > 0) {
      await gService.addCoins(user.id, coinReward, `Quest completed: ${quest?.title}`)
    }
  }

  return NextResponse.json({
    current_value: newValue,
    target_value: userQuest.target_value,
    completed,
    xpReward,
    coinReward,
    leveledUp,
    levelUpDetails,
  })
}
