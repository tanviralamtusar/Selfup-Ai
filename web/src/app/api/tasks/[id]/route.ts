import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { QuestService } from '@/lib/quest.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const body = await req.json()
  const { status } = body

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() }
  if (status === 'done') {
    updateData.completed_at = new Date().toISOString()
    updateData.xp_earned = 50 // flat XP for task completion
  }

  const { data, error: dbErr } = await db
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Award XP on completion
  if (status === 'done') {
    const { data: profile } = await db.from('user_profiles').select('xp').eq('id', user.id).single()
    if (profile) {
      await db.from('user_profiles').update({ xp: profile.xp + 50 }).eq('id', user.id)
    }

    // Track quest progress for task-related quests
    const questService = new QuestService(db)
    await questService.checkAndUpdateProgress(user.id, 'task_complete', 1)
  }

  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { error: dbErr } = await db
    .from('tasks')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
