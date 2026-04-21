import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch habits with logs from the last 90 days
  const { data: habits, error: dbErr } = await db
    .from('habits')
    .select(`
      *,
      habit_logs(completed_at)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('habit_logs.completed_at', ninetyDaysAgo)
    .order('created_at', { ascending: true })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Mark each habit as completed_today
  const enriched = habits.map((h: any) => ({
    ...h,
    completed_today: h.habit_logs?.some((l: any) => l.completed_at === today) ?? false
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const { name, description, pillar = 'general', frequency = 'daily' } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data, error: dbErr } = await db
    .from('habits')
    .insert({ user_id: user.id, name, description, pillar, frequency })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json(data)
}
