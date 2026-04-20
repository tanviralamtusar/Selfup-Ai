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
      .single()

    if (error) {
      // If no roadmap found, return empty structure instead of 404 to allow UI to show "Generating..."
      return NextResponse.json({ milestones: [] })
    }

    // Sort milestones by order_index
    if (roadmap?.skill_milestones) {
      roadmap.skill_milestones.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }

    return NextResponse.json(roadmap)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
