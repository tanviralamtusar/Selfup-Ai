import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  // Fetch top 50 users by total_xp - use admin client for public leaderboard
  const { data, error: dbErr } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, level, xp, total_xp, streak_overall, is_public')
    .eq('is_public', true)
    .order('total_xp', { ascending: false })
    .limit(50)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Add current user's own entry if not in list
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: selfProfile } = await db.from('user_profiles').select('id, username, display_name, avatar_url, level, xp, total_xp, streak_overall').eq('id', user.id).single()

  const leaderboard = (data || []).map((p: any, i: number) => ({ ...p, rank: i + 1, isCurrentUser: p.id === user.id }))

  // Check if user is already in list
  const userInList = leaderboard.some(p => p.id === user.id)

  return NextResponse.json({ leaderboard, selfProfile: selfProfile || null, userInList })
}
