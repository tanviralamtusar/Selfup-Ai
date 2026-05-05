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

    return NextResponse.json({ 
      success: true,
      status: 'completed',
      result: result
    })

  } catch (err: any) {
    console.error('[AI Direct Error]:', err)
    return NextResponse.json({ error: err.message, status: 'failed' }, { status: 500 })
  }
}
