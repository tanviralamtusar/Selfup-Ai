import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { QuestService } from '@/lib/quest.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Note: RLS handles the filtering by user_id
  const { data, error: fetchErr } = await supabase
    .from('outfit_logs')
    .select('*')
    .order('log_date', { ascending: false })

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { log_date, description, rating, tags, notes } = body

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data, error: insertErr } = await supabase
      .from('outfit_logs')
      .insert({
        user_id: user.id,
        log_date: log_date || new Date().toISOString().split('T')[0],
        description,
        rating,
        tags: tags || [],
        notes
      })
      .select()
      .single()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Track quest progress for outfit-related quests
    const questService = new QuestService(supabase)
    await questService.checkAndUpdateProgress(user.id, 'outfit_log', 1)

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
