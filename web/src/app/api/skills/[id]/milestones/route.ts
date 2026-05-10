import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { QuestService } from '@/lib/quest.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/skills/[id]/milestones
 * Mark a milestone as complete
 * Body: { milestoneId: string }
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

    const { milestoneId } = await req.json()
    if (!milestoneId) {
      return NextResponse.json({ error: 'milestoneId is required' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Get the milestone and verify it belongs to this skill's roadmap
    const { data: milestone, error: mError } = await authSupabase
      .from('skill_milestones')
      .select('*, roadmap:skill_roadmaps!inner(skill_id, user_id)')
      .eq('id', milestoneId)
      .single()

    if (mError || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    if (milestone.roadmap.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (milestone.roadmap.skill_id !== skillId) {
      return NextResponse.json({ error: 'Milestone does not belong to this skill' }, { status: 400 })
    }

    // Mark milestone complete
    const { error: updateError } = await authSupabase
      .from('skill_milestones')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', milestoneId)

    if (updateError) throw updateError

    // Award XP
    const xpReward = milestone.xp_reward || 50
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

    // Track quest progress
    const questService = new QuestService(authSupabase)
    await questService.checkAndUpdateProgress(user.id, 'milestones', 1)

    return NextResponse.json({
      success: true,
      data: { milestoneId, xpEarned: xpReward }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/skills/[id]/milestones
 * List milestones for a specific skill's active roadmap
 */
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

    // Get the roadmap for this skill
    const { data: roadmap } = await authSupabase
      .from('skill_roadmaps')
      .select('id')
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!roadmap) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data: milestones, error } = await authSupabase
      .from('skill_milestones')
      .select(`
        *,
        skill_topics (
          id, title, type, is_completed, estimated_minutes
        ),
        milestone_tests (
          id, title, passing_score_pct
        )
      `)
      .eq('roadmap_id', roadmap.id)
      .order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: milestones })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
