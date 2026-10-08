import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { calculateTaskXp } from '@/lib/task-economy.service'
import { getUserTimezone, todayIn, weekdayOf } from '@/lib/user-time'
import { idempotent, clientId, existingOnDuplicate } from '@/lib/idempotency'
import { parseTimeRange } from '@/lib/task-time'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

/**
 * GET /api/dailies — fetch all active dailies for today
 * Filters weekly dailies by repeat_days to only show today's active ones.
 * `?include=all` also returns non-expired dailies that aren't due today, after
 * the due ones; every row then carries `due_today`.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const db = getDb(req)
  // "Today" in the user's own zone, so dailies roll over at their midnight.
  const today = todayIn(await getUserTimezone(db, user.id))
  const todayDay = weekdayOf(today)

  const { data, error: dbErr } = await db
    .from('dailies')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: false }) // critical first (alphabetically: critical > high > medium > low)
    .order('created_at', { ascending: true })

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })

  // Expired dailies are never shown
  const current = (data || []).filter((d: any) => !(d.expires_on && d.expires_on < today))

  // Weekly dailies are only due on their repeat days; daily repeat is always due
  const isDue = (d: any) =>
    !(d.repeat_type === 'weekly' && d.repeat_days) || d.repeat_days.includes(todayDay)

  // Sort by priority order: critical, high, medium, low
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const byPriority = (a: any, b: any) =>
    (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)

  const activeDailies = current.filter(isDue).sort(byPriority)

  if (req.nextUrl.searchParams.get('include') === 'all') {
    const others = current.filter((d: any) => !isDue(d)).sort(byPriority)
    return NextResponse.json({
      success: true,
      data: [
        ...activeDailies.map((d: any) => ({ ...d, due_today: true })),
        ...others.map((d: any) => ({ ...d, due_today: false })),
      ],
    })
  }

  return NextResponse.json({ success: true, data: activeDailies })
}

/**
 * POST /api/dailies — create a new daily
 * Auto-calculates xp_reward and xp_penalty from priority
 */
async function handlePOST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const body = await req.json()
  const {
    title,
    description,
    priority = 'medium',
    category = 'general',
    source = 'user',
    repeat_type = 'daily',
    repeat_days,
    scheduled_time,
    end_time,
    expires_on,
    subtasks,
    require_all_subtasks = false,
  } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
  }
  if (title.length > 100) {
    return NextResponse.json({ success: false, error: 'Title must be 100 characters or less' }, { status: 400 })
  }

  // Validate priority
  if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
    return NextResponse.json({ success: false, error: 'Invalid priority' }, { status: 400 })
  }

  // Weekly repeat requires repeat_days
  if (repeat_type === 'weekly' && (!repeat_days || !Array.isArray(repeat_days) || repeat_days.length === 0)) {
    return NextResponse.json({ success: false, error: 'repeat_days required for weekly dailies' }, { status: 400 })
  }

  // Auto-calculate XP
  const { xp_reward, xp_penalty } = calculateTaskXp('daily', priority)

  const time = parseTimeRange(scheduled_time, end_time)
  if (time.error) return NextResponse.json({ success: false, error: time.error }, { status: 400 })

  const db = getDb(req)
  const { data, error: dbErr } = await db
    .from('dailies')
    .insert({
      ...clientId(body.id),
      user_id: user.id,
      title: title.trim(),
      description: description || null,
      priority,
      category,
      source,
      repeat_type,
      repeat_days: repeat_type === 'weekly' ? repeat_days : null,
      scheduled_time: time.scheduled_time,
      end_time: time.end_time,
      expires_on: expires_on || null,
      subtasks: subtasks || [],
      require_all_subtasks,
      xp_reward,
      xp_penalty,
    })
    .select()
    .single()

  if (dbErr) {
    const existing = await existingOnDuplicate(db, 'dailies', dbErr, body.id, user.id)
    if (existing) return NextResponse.json({ success: true, data: existing })
    return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
}

export const POST = idempotent(handlePOST)
