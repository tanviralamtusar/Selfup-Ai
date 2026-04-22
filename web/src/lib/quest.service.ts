import { SupabaseClient } from '@supabase/supabase-js'
import { GamificationService } from './gamification.service'

/**
 * Action types that can trigger quest progress.
 * Each maps to a `requirements.action` value in the quests table.
 */
export type QuestAction =
  | 'workout'
  | 'pomodoro'
  | 'habit'
  | 'habit_all'
  | 'habit_days'
  | 'task_complete'
  | 'skill_session'
  | 'outfit_log'
  | 'water'
  | 'calories_burned'
  | 'skill_hours'
  | 'first_quest_complete'
  | 'total_tasks'
  | 'reach_level'
  | 'streak_no_freeze'
  | 'pillars_completed'
  | 'workout_days'
  | 'milestones'
  | 'pomodoro_hours'
  | 'first_skill_with_roadmap'

interface ProgressResult {
  questId: string
  questTitle: string
  currentValue: number
  targetValue: number
  completed: boolean
  xpReward?: number
  coinReward?: number
}

export class QuestService {
  private db: SupabaseClient
  private adminDb: SupabaseClient

  constructor(userDb: SupabaseClient, adminDb?: SupabaseClient) {
    this.db = userDb
    this.adminDb = adminDb || userDb
  }

  /**
   * Check all active quests for a user and increment progress
   * for any that match the given action.
   * Called after habit logs, workout completions, pomodoro finishes, etc.
   */
  async checkAndUpdateProgress(
    userId: string,
    action: QuestAction,
    incrementBy: number = 1
  ): Promise<ProgressResult[]> {
    const results: ProgressResult[] = []

    // Expire stale quests first
    await this.expireStaleQuests(userId)

    // Get all active user quests with their quest definitions
    const { data: activeUserQuests, error } = await this.db
      .from('user_quests')
      .select('id, quest_id, current_value, target_value, status, quests(title, requirements, xp_reward, coin_reward)')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error || !activeUserQuests) return results

    for (const uq of activeUserQuests) {
      const quest = (uq as any).quests
      if (!quest?.requirements?.action) continue

      // Check if this quest's action matches
      if (quest.requirements.action !== action) continue

      const newValue = Math.min(uq.current_value + incrementBy, uq.target_value)
      const completed = newValue >= uq.target_value

      // Update progress
      const updateData: Record<string, unknown> = { current_value: newValue }
      if (completed) {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }

      await this.db
        .from('user_quests')
        .update(updateData)
        .eq('id', uq.id)

      // Award rewards on completion
      if (completed) {
        const gService = new GamificationService(this.db)
        await gService.addXp(userId, quest.xp_reward || 0)
        if (quest.coin_reward > 0) {
          await gService.addCoins(userId, quest.coin_reward, `Quest completed: ${quest.title}`)
        }

        // Log activity
        await this.db.from('notifications').insert({
          user_id: userId,
          type: 'quest_complete',
          title: `Quest Complete: ${quest.title}`,
          body: `You earned +${quest.xp_reward} XP${quest.coin_reward > 0 ? ` and +${quest.coin_reward} AiCoins` : ''}!`,
          data: { quest_id: uq.quest_id, xp: quest.xp_reward, coins: quest.coin_reward }
        })
      }

      results.push({
        questId: uq.quest_id,
        questTitle: quest.title,
        currentValue: newValue,
        targetValue: uq.target_value,
        completed,
        xpReward: completed ? quest.xp_reward : undefined,
        coinReward: completed ? quest.coin_reward : undefined,
      })
    }

    return results
  }

  /**
   * Mark any active user_quests as expired if their expires_at has passed.
   */
  async expireStaleQuests(userId: string): Promise<number> {
    const now = new Date().toISOString()

    const { data, error } = await this.db
      .from('user_quests')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now)
      .select('id')

    if (error) {
      console.error('Failed to expire stale quests:', error)
      return 0
    }

    return data?.length ?? 0
  }

  /**
   * Compute the expiration timestamp for a quest based on its type.
   */
  static computeExpiration(questType: string): string | null {
    const now = new Date()

    if (questType === 'daily') {
      // End of today (23:59:59)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return end.toISOString()
    }

    if (questType === 'weekly') {
      // End of the current week (Sunday 23:59:59)
      const end = new Date(now)
      const daysUntilSunday = 7 - end.getDay()
      end.setDate(end.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday))
      end.setHours(23, 59, 59, 999)
      return end.toISOString()
    }

    // Special quests don't expire
    return null
  }

  /**
   * Extract the target value from a quest's requirements JSON.
   */
  static getTargetValue(requirements: Record<string, unknown>): number {
    if (typeof requirements?.target === 'number') return requirements.target
    if (typeof requirements?.count === 'number') return requirements.count
    if (typeof requirements?.min_minutes === 'number') return 1 // binary: did you do it?
    return 1
  }
}
