import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'
import { GamificationService } from '@/lib/gamification.service'
import { AttributeService } from '@/lib/attribute.service'
import { DungeonService } from '@/lib/dungeon.service'
import { BadgeService } from '@/lib/badge.service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getDb(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const db = getDb(req)
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'stats') {
    const gService = new GamificationService(db)
    const weeklyActivity = await gService.getWeeklyActivity(user.id)
    return NextResponse.json({ success: true, data: { weeklyActivity } })
  }

  if (type === 'attributes') {
    const attrService = new AttributeService(db)
    const progress = await attrService.getAttributeProgress(user.id)
    return NextResponse.json({ success: true, data: { attributes: progress } })
  }

  if (type === 'dungeons') {
    const dungeonService = new DungeonService(db)
    // Expire stale dungeons first
    await dungeonService.expireUserDungeons(user.id)
    const dungeons = await dungeonService.getActiveDungeons(user.id)
    return NextResponse.json({ success: true, data: { dungeons } })
  }

  if (type === 'badges') {
    const badgeService = new BadgeService(db)
    const badges = await badgeService.getUserBadges(user.id)
    return NextResponse.json({ success: true, data: badges })
  }

  return NextResponse.json({ success: true, data: { message: 'gamification route works!' } })
}

export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const db = getDb(req)
  const body = await req.json()
  const { action } = body

  if (action === 'allocate_stat') {
    const { attribute } = body
    if (!attribute || !['str', 'int', 'agi', 'vit', 'cha'].includes(attribute)) {
      return NextResponse.json({ success: false, error: 'Invalid attribute' }, { status: 400 })
    }

    const gService = new GamificationService(db)
    const result = await gService.allocateStatPoint(user.id, attribute)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  }

  if (action === 'spawn_dungeon') {
    const dungeonService = new DungeonService(db)
    const dungeon = await dungeonService.spawnDailyDungeon(user.id)
    if (!dungeon) {
      return NextResponse.json({ success: false, error: 'Dungeon already spawned or no templates available' }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: dungeon })
  }

  if (action === 'purchase_freeze') {
    const gService = new GamificationService(db)
    const result = await gService.purchaseStreakFreeze(user.id)
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Insufficient AiCoins' }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: result })
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}
