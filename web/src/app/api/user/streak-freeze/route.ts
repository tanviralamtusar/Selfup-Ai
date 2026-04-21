import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { GamificationService } from '@/lib/gamification.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const gService = new GamificationService(db)
  const result = await gService.purchaseStreakFreeze(user.id)

  if (!result.success) {
    return NextResponse.json({ error: 'Insufficient AiCoins (100 required)' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    newBalance: result.newBalance,
    newFreezeCount: result.newFreezeCount,
  })
}
