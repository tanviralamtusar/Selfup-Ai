import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { addAiTask } from '@/lib/queue'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/skills/tests/[testId]/attempt
 * Submit answers for a test attempt
 * Body: { answers: Record<string, string> }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { answers } = await req.json()
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers object is required' }, { status: 400 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Fetch the test and its questions
    const { data: test, error: testError } = await authSupabase
      .from('milestone_tests')
      .select('id, questions, passing_score_pct, roadmap_id')
      .eq('id', testId)
      .single()

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    if (!test.questions || (test.questions as any[]).length === 0) {
      return NextResponse.json({ error: 'Test questions not yet generated. Please generate questions first.' }, { status: 400 })
    }

    // Create the attempt record
    const { data: attempt, error: attemptError } = await authSupabase
      .from('test_attempts')
      .insert({
        test_id: testId,
        roadmap_id: test.roadmap_id,
        user_id: user.id,
        answers,
        score_pct: 0,
        passed: false,
        feedback: {}
      })
      .select()
      .single()

    if (attemptError) throw attemptError

    // Queue evaluation
    await addAiTask({
      userId: user.id,
      type: 'skill_test_evaluate',
      payload: {
        testId,
        attemptId: attempt.id,
        questions: test.questions,
        userAnswers: answers
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: { attemptId: attempt.id },
      message: 'Evaluation queued. Results will be available shortly.'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/skills/tests/[testId]/attempt
 * Get all attempts for a specific test
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: attempts, error } = await authSupabase
      .from('test_attempts')
      .select('*')
      .eq('test_id', testId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: attempts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
