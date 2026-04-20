import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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
    .select('id, status')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .single()

  if (uqErr || !userQuest) return NextResponse.json({ error: 'Quest not accepted' }, { status: 404 })
  if (userQuest.status === 'completed') return NextResponse.json({ error: 'Quest already completed' }, { status: 409 })

  // Mark complete
  await db
    .from('user_quests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', userQuest.id)

  // Get quest rewards (use admin client since quests are public)
  const { data: quest } = await supabase
    .from('quests')
    .select('xp_reward, coin_reward')
    .eq('id', questId)
    .single()

  const xpReward = quest?.xp_reward || 50
  const coinReward = quest?.coin_reward || 0

  // Award XP and coins
  const { data: profile } = await db.from('user_profiles').select('xp, ai_coins').eq('id', user.id).single()
  if (profile) {
    await db.from('user_profiles').update({
      xp: profile.xp + xpReward,
      ai_coins: profile.ai_coins + coinReward
    }).eq('id', user.id)
  }

  return NextResponse.json({ success: true, xpReward, coinReward })
}
