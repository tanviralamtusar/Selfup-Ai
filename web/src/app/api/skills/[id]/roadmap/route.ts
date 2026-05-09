import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

    // Fetch full v2 roadmap hierarchy: roadmap → phases → milestones → topics
    const { data: roadmap, error } = await authSupabase
      .from('skill_roadmaps')
      .select(`
        *,
        skill_phases (
          *,
          skill_milestones (
            *,
            skill_topics (
              *,
              topic_resources (*)
            ),
            milestone_tests (
              id,
              title,
              passing_score_pct,
              xp_on_pass,
              questions
            )
          )
        )
      `)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!roadmap) {
      return NextResponse.json({ 
        success: true,
        data: null, 
        status: 'not_started'
      })
    }

    // Sort phases by phase_number, milestones by order_index, topics by order_index
    if (roadmap?.skill_phases) {
      roadmap.skill_phases.sort((a: any, b: any) => a.phase_number - b.phase_number)
      for (const phase of roadmap.skill_phases) {
        if (phase.skill_milestones) {
          phase.skill_milestones.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          for (const milestone of phase.skill_milestones) {
            if (milestone.skill_topics) {
              milestone.skill_topics.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            }
          }
        }
      }
    }

    // Calculate progress
    const allMilestones = roadmap.skill_phases?.flatMap((p: any) => p.skill_milestones || []) || []
    const completed = allMilestones.filter((m: any) => m.is_completed).length
    const total = allMilestones.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({ 
      success: true,
      data: roadmap,
      progress: { completed, total, percentage: progress },
      status: roadmap.status || 'active'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
