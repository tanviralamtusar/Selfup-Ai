import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/quests/[id]/abandon
 * User voluntarily abandons an active quest.
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

  const { data: userQuest, error: uqErr } = await db
    .from('user_quests')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .single()

  if (uqErr || !userQuest) {
    return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
  }

  if (userQuest.status !== 'active') {
    return NextResponse.json({ error: 'Quest is not active' }, { status: 409 })
  }

  const { error: updateErr } = await db
    .from('user_quests')
    .update({ status: 'expired' })
    .eq('id', userQuest.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ success: true, message: 'Quest abandoned' })
}
