import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Fetch all badges
  const { data: allBadges, error: badgesErr } = await supabase
    .from('badges')
    .select('*')

  if (badgesErr) return NextResponse.json({ error: badgesErr.message }, { status: 500 })

  // Fetch user's earned badges
  const { data: userBadges, error: userBadgesErr } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', user.id)

  if (userBadgesErr) return NextResponse.json({ error: userBadgesErr.message }, { status: 500 })

  const earnedIds = new Set(userBadges?.map(b => b.badge_id) || [])

  // Map to a response payload
  const result = allBadges.map(b => {
    const earned = userBadges?.find(ub => ub.badge_id === b.id)
    return {
      ...b,
      is_earned: earnedIds.has(b.id),
      earned_at: earned?.earned_at || null
    }
  })

  return NextResponse.json({ badges: result })
}
