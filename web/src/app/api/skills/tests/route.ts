import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { addAiTask } from '@/lib/queue'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/skills/tests?roadmap_id=xxx
 * Lists all tests for a roadmap
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const roadmapId = url.searchParams.get('roadmap_id')
    if (!roadmapId) {
      return NextResponse.json({ error: 'roadmap_id is required' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: tests, error } = await authSupabase
      .from('milestone_tests')
      .select(`
        *,
        milestone:skill_milestones (
          id,
          title,
          order_index
        ),
        test_attempts (
          id,
          score_pct,
          passed,
          created_at
        )
      `)
      .eq('roadmap_id', roadmapId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: tests })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/skills/tests
 * Generate questions for a test (queues AI job)
 * Body: { testId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { testId } = await req.json()
    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 })
    }

    // Queue generation
    await addAiTask({
      userId: user.id,
      type: 'skill_test_generate',
      payload: { testId }
    })

    return NextResponse.json({ success: true, message: 'Test generation queued' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
