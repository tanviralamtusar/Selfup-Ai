import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { QuestService } from '@/lib/quest.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: skillId } = await params
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { durationMinutes, notes } = await req.json()
    if (!durationMinutes) return NextResponse.json({ error: 'Duration is required' }, { status: 400 })

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const xpEarned = durationMinutes // 1 XP per minute

    // 1. Log the session
    const { data: session, error: sessionError } = await authSupabase
      .from('skill_sessions')
      .insert({
        skill_id: skillId,
        user_id: user.id,
        duration_minutes: durationMinutes,
        notes,
        xp_earned: xpEarned,
        session_date: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // 2. Update Skill Total Hours & potentially level
    const { data: skill } = await authSupabase.from('skills').select('total_hours').eq('id', skillId).single()
    if (skill) {
      const newTotalHours = Number(skill.total_hours || 0) + (durationMinutes / 60)
      await authSupabase.from('skills').update({ total_hours: newTotalHours }).eq('id', skillId)
    }

    // 3. Award Global XP
    const { data: profile } = await authSupabase.from('user_profiles').select('xp').eq('id', user.id).single()
    if (profile) {
      const { error: profileError } = await authSupabase
        .from('user_profiles')
        .update({ xp: profile.xp + xpEarned })
        .eq('id', user.id)
      
      if (profileError) console.error('[API] Session XP update failed:', profileError)
    }

    // Track quest progress for skill-related quests
    const questService = new QuestService(authSupabase)
    await questService.checkAndUpdateProgress(user.id, 'skill_session', 1)

    return NextResponse.json({ session, xpEarned })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: skillId } = await params
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: sessions, error } = await authSupabase
      .from('skill_sessions')
      .select('*')
      .eq('skill_id', skillId)
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(sessions)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
