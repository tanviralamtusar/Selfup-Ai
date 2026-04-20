import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { addAiTask } from '@/lib/queue'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const [recsRes, profileRes] = await Promise.all([
    db.from('style_recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    db.from('style_profiles').select('*').eq('user_id', user.id).maybeSingle()
  ])

  return NextResponse.json({
    recommendations: recsRes.data || [],
    styleProfile: profileRes.data || null
  })
}

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const { occasion, body_type, style_preferences, budget_range } = await req.json()

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Upsert style profile
  await db.from('style_profiles').upsert({
    user_id: user.id,
    body_type,
    style_preferences: style_preferences || [],
    budget_range: budget_range || 'medium',
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })

  // Queue AI generation
  const { data: queueRow } = await db.from('ai_queue').insert({
    user_id: user.id,
    action_type: 'style_recommendation',
    payload: { occasion, body_type, style_preferences, budget_range },
    status: 'pending'
  }).select().single()

  if (queueRow) {
    try {
      await addAiTask({ userId: user.id, type: 'style_advice', queueId: queueRow.id, payload: { occasion, body_type, style_preferences, budget_range } })
    } catch { /* worker may not be running */ }
  }

  return NextResponse.json({ queued: true, message: 'Nova is crafting your look. Check back in a moment!' })
}
