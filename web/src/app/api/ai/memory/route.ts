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

/**
 * POST /api/ai/memory
 * Saves a single memory entry.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { memoryKey, memoryValue, source } = await req.json()

    if (!memoryKey || !memoryValue) {
      return NextResponse.json({ error: 'Memory key and value are required' }, { status: 400 })
    }

    const supabase = await supabaseServer()
    const { error } = await supabase.from('ai_memory').upsert(
      {
        user_id: user.id,
        memory_key: memoryKey,
        memory_val: memoryValue,
        source: source || 'system'
      },
      { onConflict: 'user_id,memory_key' }
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[AI Memory API POST Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PUT /api/ai/memory
 * Batch updates memory entries.
 */
export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(req)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const { memories } = await req.json()

    if (!memories || !Array.isArray(memories)) {
      return NextResponse.json({ error: 'Memories array is required' }, { status: 400 })
    }

    const supabase = await supabaseServer()
    const memoryEntries = memories.map(m => ({
      user_id: user.id,
      memory_key: m.key,
      memory_val: m.value,
      source: m.source || 'batch-update'
    }))

    const { error } = await supabase.from('ai_memory').upsert(memoryEntries, { 
      onConflict: 'user_id,memory_key' 
    })

    if (error) throw error

    return NextResponse.json({ success: true, count: memories.length })
  } catch (err: any) {
    console.error('[AI Memory API PUT Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
