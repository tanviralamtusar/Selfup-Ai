import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Fetch all active quests + user's quest statuses
  const { data: quests, error: questsErr } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .order('type')

  if (questsErr) return NextResponse.json({ error: questsErr.message }, { status: 500 })

  // Fetch user's quests
  const { data: userQuests } = await db
    .from('user_quests')
    .select('*')
    .eq('user_id', user.id)

  // Merge quest status
  const enriched = quests.map((q: any) => {
    const uq = userQuests?.find((uq: any) => uq.quest_id === q.id)
    return {
      ...q,
      user_status: uq?.status || null,
      user_quest_id: uq?.id || null,
      accepted_at: uq?.assigned_at || null,
      completed_at: uq?.completed_at || null
    }
  })

  return NextResponse.json(enriched)
}
