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

    // Fetch roadmap and milestones
    const { data: roadmap, error } = await authSupabase
      .from('skill_roadmaps')
      .select(`
        *,
        skill_milestones (
          *
        )
      `)
      .eq('skill_id', skillId)
      .maybeSingle()

    if (error) throw error

    if (!roadmap) {
      // Check if there is a pending/processing task in the queue
      const { data: queueTask } = await authSupabase
        .from('ai_queue')
        .select('status, error')
        .eq('action_type', 'roadmap')
        .eq('user_id', user.id)
        .contains('payload', { skillId })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json({ 
        roadmap: null, 
        status: queueTask?.status || 'not_started',
        error: queueTask?.error
      })
    }

    // Sort milestones by order_index
    if (roadmap?.skill_milestones) {
      roadmap.skill_milestones.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }

    return NextResponse.json({ 
      roadmap, 
      status: 'completed' 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
