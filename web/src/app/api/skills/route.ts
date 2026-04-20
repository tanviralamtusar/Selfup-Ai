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

    // Fetch skills and join status from milestones (basic logic)
    const { data: skills, error } = await authSupabase
      .from('skills')
      .select(`
        *,
        skill_roadmaps (
          id,
          skill_milestones (
            id,
            is_completed
          )
        )
      `)
      .eq('user_id', user.id)
      .is('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform for the frontend
    const results = skills.map(skill => {
      const roadmap = skill.skill_roadmaps?.[0]
      const milestones = roadmap?.skill_milestones || []
      const completed = milestones.filter((m: any) => m.is_completed).length
      const total = milestones.length
      const progress = total > 0 ? (completed / total) * 100 : 0

      return {
        ...skill,
        milestoneStats: {
          completed,
          total,
          progress
        }
      }
    })

    return NextResponse.json(results)
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

    const { name, category, generateRoadmap } = await req.json()
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

    // 2. If roadmap generation is requested, queue the job
    if (generateRoadmap) {
      // Create DB tracking record for the queue
      const { data: queueItem, error: queueError } = await authSupabase
        .from('ai_queue')
        .insert({
          user_id: user.id,
          action_type: 'roadmap',
          payload: { skillId: skill.id, skillName: name, category },
          status: 'pending'
        })
        .select()
        .single()

      if (queueError) throw queueError

      // Add to BullMQ
      await addAiTask({
        userId: user.id,
        type: 'roadmap',
        payload: { skillId: skill.id, skillName: name, category },
        queueId: queueItem.id
      })
    }

    return NextResponse.json(skill)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
