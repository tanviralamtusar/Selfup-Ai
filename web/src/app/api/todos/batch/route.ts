import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/todos/batch — batch update todos (scheduling)
 * Expects: { updates: [{ id, scheduled_start, scheduled_end }] }
 */
export async function PATCH(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  try {
    const { updates } = await req.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json({ success: false, error: 'Updates must be an array' }, { status: 400 })
    }

    // Update scheduling fields on existing rows only; upsert would create
    // malformed rows if an ID doesn't match an existing todo.
    const results = await Promise.all(
      updates.map((u: any) =>
        db
          .from('todos')
          .update({
            scheduled_start: u.scheduled_start ?? null,
            scheduled_end: u.scheduled_end ?? null,
          })
          .eq('id', u.id)
          .eq('user_id', user.id)
      )
    )

    const firstError = results.find(r => r.error)?.error
    if (firstError) throw firstError

    return NextResponse.json({ success: true, count: updates.length })
  } catch (err: any) {
    console.error('Batch update error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
