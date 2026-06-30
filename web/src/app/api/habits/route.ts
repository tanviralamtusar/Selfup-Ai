import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { calculateHpPenalty } from '@/lib/task-economy.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

/**
 * GET /api/habits — fetch all active habits
 * Groups by reset_type for UI rendering
 */
export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const db = getDb(req)

  const { data, error: dbErr } = await db
    .from('habits')
    .select('*, habit_logs(completed_at)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('reset_type', { ascending: true })
    .order('created_at', { ascending: true })

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })

  return NextResponse.json({ success: true, data: data || [] })
}

/**
 * POST /api/habits — create a new habit
 * Auto-sets hp_penalty from reset_type, xp_reward is always 10
 */
export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const body = await req.json()
  const {
    title,
    description,
    category = 'general',
    source = 'user',
    reset_type = 'daily',
    is_positive = true,
    is_negative = false,
    difficulty = 'medium',
    is_indefinite = true,
    end_date,
  } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
  }
  if (title.length > 100) {
    return NextResponse.json({ success: false, error: 'Title must be 100 characters or less' }, { status: 400 })
  }

  // Validate reset_type
  if (!['daily', 'weekly', 'monthly'].includes(reset_type)) {
    return NextResponse.json({ success: false, error: 'Invalid reset_type' }, { status: 400 })
  }

  // end_date required for finite habits
  if (!is_indefinite && !end_date) {
    return NextResponse.json({ success: false, error: 'end_date required for finite habits' }, { status: 400 })
  }

  const hp_penalty = calculateHpPenalty(reset_type)

  const db = getDb(req)
  const { data, error: dbErr } = await db
    .from('habits')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description || null,
      category,
      source,
      reset_type,
      is_positive,
      is_negative,
      difficulty,
      is_indefinite,
      end_date: is_indefinite ? null : end_date,
      hp_penalty,
      xp_reward: difficulty === 'trivial' ? 5 : difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
