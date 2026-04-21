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

  const { data: userBadges, error: badgeErr } = await db
    .from('user_badges')
    .select('id, earned_at, badges(name, icon, category, rarity)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(20)

  if (badgeErr) {
    return NextResponse.json({ error: badgeErr.message }, { status: 500 })
  }

  const badges = (userBadges ?? []).map(ub => {
    const badge = ub.badges as unknown as { name: string; icon: string; category: string; rarity: string } | null
    return {
      id: ub.id,
      name: badge?.name ?? 'Badge',
      icon: badge?.icon ?? '🏅',
      category: badge?.category ?? 'general',
      rarity: badge?.rarity ?? 'common',
      earned_at: ub.earned_at,
    }
  })

  return NextResponse.json(badges)
}
