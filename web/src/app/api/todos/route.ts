import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { calculateTaskXp } from '@/lib/task-economy.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

/**
 * GET /api/todos — fetch todos with overdue status computed
 * Supports ?completed=true/false filter, defaults to showing incomplete
 */
export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const db = getDb(req)
  const showCompleted = req.nextUrl.searchParams.get('completed') === 'true'

  let query = db
    .from('todos')
    .select('*')
    .eq('user_id', user.id)

  if (!showCompleted) {
    query = query.eq('is_completed', false)
  }

  const { data, error: dbErr } = await query
    .order('is_completed', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })

  // Enrich with overdue flag
  const today = new Date().toISOString().split('T')[0]
  const enriched = (data || []).map((t: any) => ({
    ...t,
    is_overdue: !t.is_completed && t.due_date && t.due_date < today,
  }))

  // Sort: overdue first, then by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  enriched.sort((a: any, b: any) => {
    // Overdue items first
    if (a.is_overdue && !b.is_overdue) return -1
    if (!a.is_overdue && b.is_overdue) return 1
    // Then by priority
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  })

  return NextResponse.json({ success: true, data: enriched })
}

/**
 * POST /api/todos — create a new to-do
 * Auto-calculates xp_reward and xp_penalty from priority
 */
export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const body = await req.json()
  const {
    title,
    description,
    priority = 'medium',
    category = 'general',
    source = 'user',
    due_date,
    scheduled_time,
    subtasks,
    require_all_subtasks = false,
  } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ success: false, error: 'Title must be 200 characters or less' }, { status: 400 })
  }

  // Validate priority
  if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
    return NextResponse.json({ success: false, error: 'Invalid priority' }, { status: 400 })
  }

  // Auto-calculate XP
  const { xp_reward, xp_penalty } = calculateTaskXp('todo', priority, !!due_date)

  const db = getDb(req)
  const { data, error: dbErr } = await db
    .from('todos')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description || null,
      priority,
      category,
      source,
      due_date: due_date || null,
      scheduled_time: scheduled_time || null,
      subtasks: subtasks || [],
      require_all_subtasks,
      xp_reward,
      xp_penalty,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
