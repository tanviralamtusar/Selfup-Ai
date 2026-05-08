import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/skills/[id]/topics
 * Mark a topic as completed
 * Body: { topicId: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: skillId } = await params
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { topicId } = await req.json()
    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Mark topic complete
    const { data: topic, error: updateError } = await authSupabase
      .from('skill_topics')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', topicId)
      .select('xp_reward')
      .single()

    if (updateError) throw updateError

    // Award XP
    const xpReward = topic?.xp_reward || 10
    const { data: profile } = await authSupabase
      .from('user_profiles')
      .select('xp')
      .eq('id', user.id)
      .single()

    if (profile) {
      await authSupabase
        .from('user_profiles')
        .update({ xp: profile.xp + xpReward })
        .eq('id', user.id)
    }

    // Update total hours on the skill
    if (topic) {
      const { data: skill } = await authSupabase
        .from('skills')
        .select('total_hours')
        .eq('id', skillId)
        .single()

      if (skill) {
        // Use the topic's estimated_minutes, fall back to 15 min
        const { data: topicFull } = await authSupabase
          .from('skill_topics')
          .select('estimated_minutes')
          .eq('id', topicId)
          .single()

        const mins = topicFull?.estimated_minutes || 15
        const newTotalHours = Number(skill.total_hours || 0) + (mins / 60)
        await authSupabase.from('skills').update({ total_hours: newTotalHours }).eq('id', skillId)
      }
    }

    return NextResponse.json({
      success: true,
      data: { topicId, xpEarned: xpReward }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
