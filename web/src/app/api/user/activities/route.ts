import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Activity {
  id: string
  type: 'habit' | 'workout' | 'skill' | 'task' | 'badge' | 'quest' | 'outfit'
  title: string
  pillar: string | null
  xp_earned: number
  timestamp: string
  metadata?: Record<string, unknown>
}

export async function GET(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const activities: Activity[] = []

  // 1. Habit logs (last 30 days)
  const { data: habitLogs } = await db
    .from('habit_logs')
    .select('id, completed_at, created_at, habits(title, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(15)

  if (habitLogs) {
    for (const log of habitLogs) {
      const habit = log.habits as unknown as { title: string; category: string } | null
      activities.push({
        id: log.id,
        type: 'habit',
        title: `Completed "${habit?.title ?? 'Habit'}"`,
        pillar: habit?.category ?? 'general',
        xp_earned: 10,
        timestamp: log.created_at,
      })
    }
  }

  // 2. Workout logs
  const { data: workoutLogs } = await db
    .from('workout_logs')
    .select('id, duration_minutes, xp_earned, completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(10)

  if (workoutLogs) {
    for (const log of workoutLogs) {
      activities.push({
        id: log.id,
        type: 'workout',
        title: `Workout — ${log.duration_minutes ?? 0} min`,
        pillar: 'fitness',
        xp_earned: log.xp_earned ?? 0,
        timestamp: log.completed_at,
      })
    }
  }

  // 3. Skill sessions
  const { data: skillSessions } = await db
    .from('skill_sessions')
    .select('id, duration_minutes, xp_earned, created_at, skills(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (skillSessions) {
    for (const session of skillSessions) {
      const skill = session.skills as unknown as { name: string } | null
      activities.push({
        id: session.id,
        type: 'skill',
        title: `Practiced "${skill?.name ?? 'Skill'}" — ${session.duration_minutes} min`,
        pillar: 'skills',
        xp_earned: session.xp_earned ?? 0,
        timestamp: session.created_at,
      })
    }
  }

  // 4. Completed todos
  const { data: completedTodos } = await db
    .from('todos')
    .select('id, title, category, xp_reward, completed_at')
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  if (completedTodos) {
    for (const todo of completedTodos) {
      activities.push({
        id: todo.id,
        type: 'task',
        title: `Completed "${todo.title}"`,
        pillar: todo.category ?? 'general',
        xp_earned: todo.xp_reward ?? 0,
        timestamp: todo.completed_at,
      })
    }
  }

  // 4b. Completed dailies
  const { data: completedDailies } = await db
    .from('dailies')
    .select('id, title, category, xp_reward, completed_at')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(5)

  if (completedDailies) {
    for (const daily of completedDailies) {
      activities.push({
        id: daily.id,
        type: 'task',
        title: `Completed daily "${daily.title}"`,
        pillar: daily.category ?? 'general',
        xp_earned: daily.xp_reward ?? 0,
        timestamp: daily.completed_at,
      })
    }
  }

  // 5. Earned badges
  const { data: earnedBadges } = await db
    .from('user_badges')
    .select('id, earned_at, badges(name, icon, category, rarity)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(10)

  if (earnedBadges) {
    for (const ub of earnedBadges) {
      const badge = ub.badges as unknown as { name: string; icon: string; category: string; rarity: string } | null
      activities.push({
        id: ub.id,
        type: 'badge',
        title: `Earned badge "${badge?.name ?? 'Badge'}"`,
        pillar: badge?.category ?? 'general',
        xp_earned: 0,
        timestamp: ub.earned_at,
        metadata: { icon: badge?.icon, rarity: badge?.rarity },
      })
    }
  }

  // 6. Completed quests
  const { data: completedQuests } = await db
    .from('user_quests')
    .select('id, completed_at, quests(title, pillar, xp_reward)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  if (completedQuests) {
    for (const uq of completedQuests) {
      const quest = uq.quests as unknown as { title: string; pillar: string; xp_reward: number } | null
      activities.push({
        id: uq.id,
        type: 'quest',
        title: `Completed quest "${quest?.title ?? 'Quest'}"`,
        pillar: quest?.pillar ?? 'general',
        xp_earned: quest?.xp_reward ?? 0,
        timestamp: uq.completed_at,
      })
    }
  }

  // Sort all activities by timestamp descending, take top 25
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json(activities.slice(0, 25))
}
