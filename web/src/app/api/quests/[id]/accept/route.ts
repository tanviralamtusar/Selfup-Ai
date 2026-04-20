import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

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

  if (existing) {
    return NextResponse.json({ error: 'Quest already accepted', existing }, { status: 409 })
  }

  const { data, error: dbErr } = await db
    .from('user_quests')
    .insert({ user_id: user.id, quest_id: questId, status: 'active' })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
