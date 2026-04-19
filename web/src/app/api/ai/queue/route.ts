import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { addAiTask } from '@/lib/queue'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET: Check job status in ai_queue table
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { searchParams } = new URL(req.url)
    const queueId = searchParams.get('queueId')

    if (!queueId) return NextResponse.json({ error: 'queueId is required' }, { status: 400 })

    const { data, error } = await authSupabase
      .from('ai_queue')
      .select('*')
      .eq('id', queueId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST: Manually enqueue an AI job (for testing or specific long tasks)
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { type, payload } = await req.json()

    if (!type || !payload) return NextResponse.json({ error: 'type and payload are required' }, { status: 400 })

    // 1. Create record in PostgreSQL ai_queue table
    const { data: queueItem, error: queueError } = await authSupabase
      .from('ai_queue')
      .insert({
        user_id: user.id,
        request_type: type,
        payload: payload,
        status: 'pending'
      })
      .select()
      .single()

    if (queueError) throw queueError

    // 2. Add to BullMQ
    await addAiTask({
      userId: user.id,
      type: type,
      payload: payload,
      queueId: queueItem.id
    })

    return NextResponse.json({ 
      message: 'Job enqueued', 
      queueId: queueItem.id,
      status: 'pending' 
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
