import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function PATCH(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  try {
    const { updates } = await req.json() // Array of { id, scheduled_start, scheduled_end }

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 })
    }

    // Supabase supports upsert for batch updates if the primary key is included
    // But here we want to update existing rows. 
    // We'll use a transaction-like approach or just multiple updates.
    // For simplicity and speed, we can use the 'upsert' trick with primary keys.
    const { data, error: dbErr } = await db
      .from('tasks')
      .upsert(
        updates.map(u => ({
          id: u.id,
          user_id: user.id, // Security: ensure user owns the task
          scheduled_start: u.scheduled_start,
          scheduled_end: u.scheduled_end,
          updated_at: new Date().toISOString()
        }))
      )
      .select()

    if (dbErr) throw dbErr

    return NextResponse.json({ success: true, count: data?.length })
  } catch (err: any) {
    console.error('Batch update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
