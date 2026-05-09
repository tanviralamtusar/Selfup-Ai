import { SupabaseClient } from '@supabase/supabase-js'

export interface WeeklyStats {
  period_start: string
  period_end: string
  xp_earned: number
  level_reached: number
  streak_current: number
  hp_avg: number
  completion_rate: number
  fitness: {
    sessions: number
    total_volume: number
  }
  skills: {
    hours_studied: number
    milestones_reached: number
  }
  gamification: {
    dungeons_cleared: number
    quests_completed: number
    coins_earned: number
  }
}

export async function fetchWeeklyStats(
  userId: string,
  supabase: SupabaseClient,
  start: string,
  end: string
): Promise<WeeklyStats> {
  // 1. XP & Level
  const { data: xpData } = await supabase
    .from('xp_transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
  
  const xp_earned = xpData?.reduce((acc, curr) => acc + curr.amount, 0) || 0

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('level, streak_overall, hp')
    .eq('id', userId)
    .single()

  // 2. Habit Completion Rate
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('completed_at', start)
    .lte('completed_at', end)
  
  const { count: totalHabits } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  const completion_rate = totalHabits && totalHabits > 0 
    ? Math.round(((logs?.length || 0) / (totalHabits * 7)) * 100) 
    : 0

  // 3. Fitness
  const { data: workouts } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)

  // 4. Skills
  const { data: skillSessions } = await supabase
    .from('skill_sessions')
    .select('duration_mins')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
  
  const hours_studied = skillSessions?.reduce((acc, curr) => acc + curr.duration_mins, 0) / 60 || 0

  // 5. Gamification
  const { data: coinsData } = await supabase
    .from('ai_coin_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'earn')
    .gte('created_at', start)
    .lte('created_at', end)
  
  const coins_earned = coinsData?.reduce((acc, curr) => acc + curr.amount, 0) || 0

  const { data: quests } = await supabase
    .from('user_quests')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', start)
    .lte('completed_at', end)

  return {
    period_start: start,
    period_end: end,
    xp_earned,
    level_reached: profile?.level || 1,
    streak_current: profile?.streak_overall || 0,
    hp_avg: profile?.hp || 100, // Ideally we'd have a history of HP, but for now current is fine
    completion_rate,
    fitness: {
      sessions: workouts?.length || 0,
      total_volume: 0 // Placeholder
    },
    skills: {
      hours_studied: Math.round(hours_studied * 10) / 10,
      milestones_reached: 0 // Placeholder
    },
    gamification: {
      dungeons_cleared: 0,
      quests_completed: quests?.length || 0,
      coins_earned
    }
  }
}
