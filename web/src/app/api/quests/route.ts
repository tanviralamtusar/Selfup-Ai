import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { QuestService } from '@/lib/quest.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Parse optional query params
  const { searchParams } = new URL(req.url)
  const typeFilter = searchParams.get('type') // daily | weekly | special
  const statusFilter = searchParams.get('status') // active | completed | expired

  // Expire stale quests first
  const questService = new QuestService(db)
  await questService.expireStaleQuests(user.id)

  // Fetch all active quests (using admin client for unrestricted read)
  let questQuery = supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .order('order_priority', { ascending: true })
    .order('type')

  if (typeFilter) {
    questQuery = questQuery.eq('type', typeFilter)
  }

  const { data: quests, error: questsErr } = await questQuery

  if (questsErr) return NextResponse.json({ error: questsErr.message }, { status: 500 })

  // Fetch user's quest statuses
  let userQuestQuery = db
    .from('user_quests')
    .select('*')
    .eq('user_id', user.id)

  if (statusFilter) {
    userQuestQuery = userQuestQuery.eq('status', statusFilter)
  }

  const { data: userQuests } = await userQuestQuery

  // Merge quest definitions with user status
  const now = new Date()
  const enriched = quests.map((q: any) => {
    const uq = userQuests?.find((uq: any) => uq.quest_id === q.id)

    // Compute time remaining for display
    let timeRemaining: string | null = null
    const expiresAt = uq?.expires_at || q.expires_at
    if (expiresAt && uq?.status === 'active') {
      const expDate = new Date(expiresAt)
      const diffMs = expDate.getTime() - now.getTime()
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        if (hours > 24) {
          const days = Math.floor(hours / 24)
          timeRemaining = `${days}d ${hours % 24}h`
        } else {
          timeRemaining = `${hours}h ${minutes}m`
        }
      } else {
        timeRemaining = 'Expired'
      }
    }

    return {
      ...q,
      user_status: uq?.status || null,
      user_quest_id: uq?.id || null,
      accepted_at: uq?.assigned_at || null,
      completed_at: uq?.completed_at || null,
      current_value: uq?.current_value ?? 0,
      target_value: uq?.target_value ?? QuestService.getTargetValue(q.requirements),
      expires_at: expiresAt || null,
      time_remaining: timeRemaining,
    }
  })

  // If statusFilter is set, only return quests that match
  const filtered = statusFilter
    ? enriched.filter((q: any) => q.user_status === statusFilter)
    : enriched

  return NextResponse.json(filtered)
}
