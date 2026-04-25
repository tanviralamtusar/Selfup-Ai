import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'

interface Activity {
  id: string
  type: 'habit' | 'workout' | 'skill' | 'task' | 'badge' | 'quest'
  title: string
  pillar: string | null
  xp_earned: number
  timestamp: string
  user_id: string
  username: string
  avatar_url: string | null
  metadata?: Record<string, any>
}

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const activities: Activity[] = []

  // Fetch recent habit logs across all users
  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select(`
      id, 
      created_at, 
      user_id,
      habits(name, pillar),
      user_profiles:user_id(username, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (habitLogs) {
    habitLogs.forEach((log: any) => {
      const habit = log.habits
      const profile = Array.isArray(log.user_profiles) ? log.user_profiles[0] : log.user_profiles
      activities.push({
        id: log.id,
        type: 'habit',
        title: `Completed "${habit?.name ?? 'Habit'}"`,
        pillar: habit?.pillar ?? 'general',
        xp_earned: 10,
        timestamp: log.created_at,
        user_id: log.user_id,
        username: profile?.username ?? 'Unknown',
        avatar_url: profile?.avatar_url
      })
    })
  }

  // Fetch recent workout logs
  const { data: workoutLogs } = await supabase
    .from('workout_logs')
    .select(`
      id, 
      duration_minutes, 
      xp_earned, 
      completed_at, 
      user_id,
      user_profiles:user_id(username, avatar_url)
    `)
    .order('completed_at', { ascending: false })
    .limit(10)

  if (workoutLogs) {
    workoutLogs.forEach((log: any) => {
      const profile = Array.isArray(log.user_profiles) ? log.user_profiles[0] : log.user_profiles
      activities.push({
        id: log.id,
        type: 'workout',
        title: `Workout Session — ${log.duration_minutes} min`,
        pillar: 'fitness',
        xp_earned: log.xp_earned ?? 0,
        timestamp: log.completed_at,
        user_id: log.user_id,
        username: profile?.username ?? 'Unknown',
        avatar_url: profile?.avatar_url
      })
    })
  }

  // Fetch recent earned badges
  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select(`
      id, 
      earned_at, 
      user_id,
      badges(name, icon, category, rarity),
      user_profiles:user_id(username, avatar_url)
    `)
    .order('earned_at', { ascending: false })
    .limit(10)

  if (earnedBadges) {
    earnedBadges.forEach((ub: any) => {
      const badge = ub.badges
      const profile = Array.isArray(ub.user_profiles) ? ub.user_profiles[0] : ub.user_profiles
      activities.push({
        id: ub.id,
        type: 'badge',
        title: `Earned "${badge?.name ?? 'Badge'}"`,
        pillar: badge?.category ?? 'general',
        xp_earned: 0,
        timestamp: ub.earned_at,
        user_id: ub.user_id,
        username: profile?.username ?? 'Unknown',
        avatar_url: profile?.avatar_url,
        metadata: { icon: badge?.icon, rarity: badge?.rarity }
      })
    })
  }

  // Sort and limit
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  return NextResponse.json(activities.slice(0, 25))
}
