import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { addAiTask } from '@/lib/queue'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * AI Queue system has been removed. 
 * Tasks are now executed immediately via POST.
 */

/**
 * POST: Execute an AI task immediately (Queue system removed)
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, payload } = await req.json()
    if (!type || !payload) return NextResponse.json({ error: 'type and payload are required' }, { status: 400 })

    console.log(`[AI Direct] Executing ${type} for user ${user.id}`)

    // Execute immediately and return result
    const result = await addAiTask({
      userId: user.id,
      type: type,
      payload: payload
    })

    // For fitness_plan tasks the worker returns { plan, planId }; spread it alongside result
    const extra = typeof result === 'object' && result !== null ? result : {}
    return NextResponse.json({
      success: true,
      status: 'completed',
      result: typeof result === 'string' ? result : undefined,
      ...extra,
    })

  } catch (err: any) {
    console.error('[AI Direct Error]:', err)
    return NextResponse.json({ error: err.message, status: 'failed' }, { status: 500 })
  }
}

/**
 * GET: Fetch recent background tasks from ai_queue
 */
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

    const { data: tasks, error } = await authSupabase
      .from('ai_queue')
      .select('id, action_type, payload, status, error, created_at, processed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[AI Queue GET] Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch background tasks' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: tasks })

  } catch (error) {
    console.error('[AI Queue GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
