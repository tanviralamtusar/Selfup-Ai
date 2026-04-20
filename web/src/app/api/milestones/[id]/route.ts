import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { isCompleted } = await req.json()
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // 1. Update the milestone
    const { data: milestone, error: updateError } = await authSupabase
      .from('skill_milestones')
      .update({ 
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select('*, roadmap:skill_roadmaps(skill:skills(user_id))')
      .single()

    if (updateError) throw updateError

    // 2. Award XP if completed
    if (isCompleted) {
      const { data: profile } = await authSupabase
        .from('user_profiles')
        .select('xp')
        .eq('id', user.id)
        .single()

      if (profile) {
        const bonusXP = 100 // Proposed in plan
        const { error: profileError } = await authSupabase
          .from('user_profiles')
          .update({ xp: profile.xp + bonusXP })
          .eq('id', user.id)
        
        if (profileError) throw profileError
      }
    }

    return NextResponse.json(milestone)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
