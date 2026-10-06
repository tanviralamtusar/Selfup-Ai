import { SupabaseClient } from '@supabase/supabase-js'
import { GamificationService } from '@/lib/gamification.service'
import { TaskEconomyService } from '@/lib/task-economy.service'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_value: number
  current_value: number
  unit: string | null
  deadline: string
  difficulty: 'easy' | 'medium' | 'hard'
  xp_reward: number
  hp_penalty: number
  status: 'active' | 'completed' | 'failed'
  completed_at: string | null
  failed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Fail every active goal whose deadline is before `today` (the user's day) and
 * apply its HP penalty. The status update is conditional on `status = 'active'`,
 * so when two requests race only the one that flips the row charges HP.
 */
export async function failExpiredGoals(
  db: SupabaseClient,
  userId: string,
  today: string
): Promise<{ failed: { id: string; title: string }[]; hpLost: number }> {
  const { data: expired } = await db
    .from('goals')
    .select('id, title, hp_penalty')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('deadline', today)

  const failed: { id: string; title: string }[] = []
  let hpLost = 0
  if (!expired?.length) return { failed, hpLost }

  const economy = new TaskEconomyService(db)
  for (const g of expired) {
    const { data: flipped } = await db
      .from('goals')
      .update({ status: 'failed', failed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', g.id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .select('id')
    if (!flipped?.length) continue

    failed.push({ id: g.id, title: g.title })
    if (g.hp_penalty > 0) {
      const r = await economy.applyHpDamage(userId, g.hp_penalty, `Missed goal deadline: ${g.title}`)
      hpLost += r.actualDamage
    }
  }
  return { failed, hpLost }
}

/**
 * Mark a goal completed and award its XP. Like failing, the award only runs for
 * the request that moves the row out of 'active'.
 */
export async function completeGoal(
  db: SupabaseClient,
  userId: string,
  goal: Goal,
  currentValue: number
): Promise<{ goal: Goal | null; xpAwarded: number; leveledUp: boolean }> {
  const { data } = await db
    .from('goals')
    .update({
      current_value: currentValue,
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', goal.id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .select()
    .maybeSingle()

  if (!data) return { goal: null, xpAwarded: 0, leveledUp: false }

  const result = await new GamificationService(db).addXp(userId, goal.xp_reward, { actionType: 'goal' })
  return { goal: data as Goal, xpAwarded: result.xpAwarded, leveledUp: result.leveledUp }
}
