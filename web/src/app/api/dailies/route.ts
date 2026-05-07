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
 * GET /api/dailies — fetch all active dailies for today
 * Filters weekly dailies by repeat_days to only show today's active ones
 */
export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ success: false, error }, { status: 401 })

  const db = getDb(req)
  const today = new Date()
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const todayDay = dayNames[today.getDay()]

  const { data, error: dbErr } = await db
    .from('dailies')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: false }) // critical first (alphabetically: critical > high > medium > low)
    .order('created_at', { ascending: true })

  if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })

  // Filter: only show dailies active today
  const activeDailies = (data || []).filter((d: any) => {
    // Check if expired
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (d.expires_on && new Date(d.expires_on) < todayStart) return false

    // If weekly repeat, check if today is an active day
    if (d.repeat_type === 'weekly' && d.repeat_days) {
      return d.repeat_days.includes(todayDay)
    }

    // Daily repeat — always active
    return true
  })

  // Sort by priority order: critical, high, medium, low
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  activeDailies.sort((a: any, b: any) => 
    (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  )

  return NextResponse.json({ success: true, data: activeDailies })
}

/**
 * POST /api/dailies — create a new daily
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
    repeat_type = 'daily',
    repeat_days,
    scheduled_time,
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

  const db = getDb(req)
  const { data, error: dbErr } = await db
    .from('dailies')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description || null,
      priority,
      category,
      source,
      repeat_type,
      repeat_days: repeat_type === 'weekly' ? repeat_days : null,
      scheduled_time: scheduled_time || null,
      expires_on: expires_on || null,
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
