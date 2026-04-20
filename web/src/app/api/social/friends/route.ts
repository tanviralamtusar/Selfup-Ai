import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data, error: dbErr } = await db
    .from('friendships')
    .select('id, status, created_at, friend_id, user_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Collect all other user IDs
  const otherIds = [...new Set((data || []).map((f: any) => f.user_id === user.id ? f.friend_id : f.user_id))]

  let profiles: any[] = []
  if (otherIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, avatar_url, level, xp, streak_overall')
      .in('id', otherIds)
    profiles = profilesData || []
  }

  const enriched = (data || []).map((f: any) => {
    const otherId = f.user_id === user.id ? f.friend_id : f.user_id
    const profile = profiles.find(p => p.id === otherId)
    return { ...f, profile, direction: f.user_id === user.id ? 'sent' : 'received' }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const { username } = await req.json()
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

  // Find target user
  const { data: target } = await supabase
    .from('user_profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .single()

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.id === user.id) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Check if friendship already exists
  const { data: existing } = await db
    .from('friendships')
    .select('id, status')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Friend request already exists', existing }, { status: 409 })

  const { data, error: dbErr } = await db
    .from('friendships')
    .insert({ user_id: user.id, friend_id: target.id, status: 'pending' })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ friendship: data, target })
}
