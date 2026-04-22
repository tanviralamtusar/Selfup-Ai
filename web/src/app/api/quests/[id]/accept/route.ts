import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { supabase as adminClient } from '@/lib/supabase'
import { QuestService } from '@/lib/quest.service'

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

  // Check if already accepted
  const { data: existing } = await db
    .from('user_quests')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .maybeSingle()

  if (existing && existing.status === 'active') {
    return NextResponse.json({ error: 'Quest already accepted' }, { status: 409 })
  }

  // Get quest details for target_value and expiration
  const { data: quest, error: questErr } = await adminClient
    .from('quests')
    .select('type, requirements, is_active')
    .eq('id', questId)
    .single()

  if (questErr || !quest) {
    return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
  }

  if (!quest.is_active) {
    return NextResponse.json({ error: 'Quest is no longer active' }, { status: 410 })
  }

  const targetValue = QuestService.getTargetValue(quest.requirements)
  const expiresAt = QuestService.computeExpiration(quest.type)

  // If user previously abandoned/expired this quest, update instead of insert
  if (existing) {
    const { data, error: updateErr } = await db
      .from('user_quests')
      .update({
        status: 'active',
        current_value: 0,
        target_value: targetValue,
        expires_at: expiresAt,
        assigned_at: new Date().toISOString(),
        completed_at: null,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Fresh accept
  const { data, error: dbErr } = await db
    .from('user_quests')
    .insert({
      user_id: user.id,
      quest_id: questId,
      status: 'active',
      current_value: 0,
      target_value: targetValue,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
