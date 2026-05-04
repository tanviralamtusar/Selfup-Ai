import { SupabaseClient } from '@supabase/supabase-js'
import { GamificationService } from '@/lib/gamification.service'
import { BadgeService } from '@/lib/badge.service'
import type { WorkoutSessionLogRow } from '@/types/fitness'

/**
 * Session Tracker Service
 * Handles workout session lifecycle: start, log sets, complete, XP awards.
 */

export async function getOrCreateSession(
  userId: string,
  workoutDayId: string,
  planId: string,
  supabase: SupabaseClient
): Promise<WorkoutSessionLogRow> {
  const today = new Date().toISOString().split('T')[0]

  // Check for existing session today
  const { data: existing } = await supabase
    .from('workout_session_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_day_id', workoutDayId)
    .eq('logged_date', today)
    .maybeSingle()

  if (existing) return existing as WorkoutSessionLogRow

  // Create new session
  const { data: session, error } = await supabase
    .from('workout_session_logs')
    .insert({
      user_id: userId,
      workout_day_id: workoutDayId,
      plan_id: planId,
      logged_date: today,
      status: 'partial',
      sets_done: {},
      total_xp_earned: 0,
      session_bonus_xp: 0,
    })
    .select()
    .single()

  if (error) throw new Error(`Session creation failed: ${error.message}`)
  return session as WorkoutSessionLogRow
}

export async function logSetComplete(
  userId: string,
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weightUsed: number | null,
  supabase: SupabaseClient
): Promise<{ xpAwarded: number; totalSetsForExercise: number }> {
  // Fetch current session
  const { data: session, error } = await supabase
    .from('workout_session_logs')
    .select('sets_done, total_xp_earned')
    .eq('id', sessionId)
    .single()

  if (error || !session) throw new Error('Session not found')

  const setsDone = (session.sets_done || {}) as Record<string, { sets_completed: number; weights_used: number[] }>
  if (!setsDone[exerciseId]) {
    setsDone[exerciseId] = { sets_completed: 0, weights_used: [] }
  }

  setsDone[exerciseId].sets_completed = setNumber
  if (weightUsed !== null) {
    setsDone[exerciseId].weights_used.push(weightUsed)
  }

  const xpPerSet = 3
  const newTotalXp = (session.total_xp_earned || 0) + xpPerSet

  await supabase
    .from('workout_session_logs')
    .update({ sets_done: setsDone, total_xp_earned: newTotalXp })
    .eq('id', sessionId)

  // Award XP via gamification
  const gamification = new GamificationService(supabase)
  await gamification.addXp(userId, xpPerSet, { actionType: 'fitness' })

  return { xpAwarded: xpPerSet, totalSetsForExercise: setsDone[exerciseId].sets_completed }
}

export async function completeSession(
  userId: string,
  sessionId: string,
  supabase: SupabaseClient
): Promise<{ totalXp: number; bonusXp: number; badgesAwarded: string[] }> {
  const { data: session } = await supabase
    .from('workout_session_logs')
    .select('*, workout_day_id, plan_id, sets_done, total_xp_earned')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('Session not found')

  const setsDone = session.sets_done as Record<string, { sets_completed: number; weights_used: number[] }>
  const hasWeightLogs = Object.values(setsDone).some(e => e.weights_used?.length > 0)
  const bonusXp = hasWeightLogs ? 75 : 50

  // Check if all exercises are fully completed for the +10 XP per exercise bonus
  const { data: dayExercises } = await supabase
    .from('workout_day_exercises')
    .select('exercise_id, sets, xp_full_exercise')
    .eq('workout_day_id', session.workout_day_id)

  let exerciseBonusXp = 0
  if (dayExercises) {
    for (const ex of dayExercises) {
      const done = setsDone[ex.exercise_id]
      if (done && done.sets_completed >= ex.sets) {
        exerciseBonusXp += (ex.xp_full_exercise || 10)
      }
    }
  }

  const totalXp = (session.total_xp_earned || 0) + bonusXp + exerciseBonusXp

  // Update session
  await supabase
    .from('workout_session_logs')
    .update({
      status: 'complete',
      session_bonus_xp: bonusXp + exerciseBonusXp,
      total_xp_earned: totalXp,
    })
    .eq('id', sessionId)

  // Award bonus XP
  const gamification = new GamificationService(supabase)
  await gamification.addXp(userId, bonusXp + exerciseBonusXp, { actionType: 'fitness' })

  // Check badges
  const badgeService = new BadgeService(supabase)
  const badgesAwarded: string[] = []

  // Count total sessions for badge checks
  const { count: sessionCount } = await supabase
    .from('workout_session_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'complete')

  // first session badge
  if (sessionCount === 1) {
    const r = await badgeService.awardBadge(userId, 'iron_start')
    if (r) badgesAwarded.push('iron_start')
  }

  // General workout badge checks
  const awarded = await badgeService.checkBadgeUnlocks(userId, {
    action: 'workout_complete',
    workoutCount: sessionCount || 0,
  })
  badgesAwarded.push(...awarded)

  return { totalXp, bonusXp: bonusXp + exerciseBonusXp, badgesAwarded }
}
