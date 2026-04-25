import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { supabaseServer } from '@/lib/supabase-server'

/**
 * GET /api/ai/memory
 * Fetches all memory entries for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const supabase = await supabaseServer()
    const { data: memories, error } = await supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(memories)
  } catch (err: any) {
    console.error('[AI Memory API GET Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/ai/memory?key=...
 * Deletes a specific memory entry by key.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Memory key is required' }, { status: 400 })
    }

    const supabase = await supabaseServer()
    const { error } = await supabase
      .from('ai_memory')
      .delete()
      .eq('user_id', user.id)
      .eq('memory_key', key)

    if (error) throw error

    return NextResponse.json({ success: true, message: `Memory '${key}' purged from core cognition.` })
  } catch (err: any) {
    console.error('[AI Memory API DELETE Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
