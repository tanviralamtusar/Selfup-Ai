import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { addAiTask } from '@/lib/queue'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Fetch skills with roadmap + milestone stats; order roadmaps newest-first so [0] is the active one
    const { data: skills, error } = await authSupabase
      .from('skills')
      .select(`
        *,
        skill_roadmaps (
          id,
          title,
          status,
          plan_type,
          difficulty,
          daily_study_minutes,
          created_at,
          skill_phases (
            id,
            skill_milestones (
              id,
              is_completed
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .is('is_active', true)
      .eq('skill_roadmaps.status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform for the frontend
    const results = skills.map(skill => {
      const roadmap = skill.skill_roadmaps?.[0]
      const milestones = roadmap?.skill_phases?.flatMap((p: any) => p.skill_milestones || []) || []
      const completed = milestones.filter((m: any) => m.is_completed).length
      const total = milestones.length
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        ...skill,
        activeRoadmap: roadmap ? {
          id: roadmap.id,
          title: roadmap.title,
          status: roadmap.status,
          plan_type: roadmap.plan_type,
          difficulty: roadmap.difficulty,
          daily_study_minutes: roadmap.daily_study_minutes,
        } : null,
        milestoneStats: {
          completed,
          total,
          progress
        }
      }
    })

    return NextResponse.json({ success: true, data: results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, category, interviewData } = body
    if (!name) return NextResponse.json({ error: 'Skill name is required' }, { status: 400 })

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // 1. Create the skill
    const { data: skill, error: skillError } = await authSupabase
      .from('skills')
      .insert({
        user_id: user.id,
        name,
        category,
        current_level: 'Novice',
        total_hours: 0,
        is_active: true
      })
      .select()
      .single()

    if (skillError) throw skillError

    // 2. If interview data provided, generate roadmap synchronously.
    // On failure, rollback the skill row so no orphaned skills are left.
    if (interviewData) {
      try {
        await addAiTask({
          userId: user.id,
          type: 'skill_roadmap',
          payload: {
            skillId: skill.id,
            interviewData: {
              skill_name: name,
              ...interviewData
            }
          }
        })
      } catch (taskError: any) {
        await authSupabase.from('skills').delete().eq('id', skill.id)
        return NextResponse.json(
          { error: `Roadmap generation failed: ${taskError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, data: skill })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
