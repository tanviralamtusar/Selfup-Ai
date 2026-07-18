import { SupabaseClient } from '@supabase/supabase-js'
import { GamificationService } from './gamification.service'
import { applyAttributeXpBonus } from '@/constants/gamification'

// ── XP Reward Tables (from §5.1) ──

const DAILY_XP_REWARD: Record<string, number> = {
  low: 5,
  medium: 10,
  high: 20,
  critical: 35,
}

const DAILY_XP_PENALTY: Record<string, number> = {
  low: 3,
  medium: 5,
  high: 10,
  critical: 50,
}

const TODO_XP_REWARD: Record<string, number> = {
  low: 5,
  medium: 10,
  high: 20,
  critical: 35,
}

const TODO_XP_PENALTY: Record<string, number> = {
  low: 5,
  medium: 10,
  high: 20,
  critical: 30,
}

const HABIT_XP_REWARD = 10

// ── HP Penalty Tables (from §5.2) ──

const HABIT_HP_PENALTY: Record<string, number> = {
  daily: 5,
  weekly: 10,
  monthly: 15,
}

// ── Types ──

type TaskType = 'daily' | 'habit' | 'todo'
type Priority = 'low' | 'medium' | 'high' | 'critical'
type ResetType = 'daily' | 'weekly' | 'monthly'
type SourceType = 'daily' | 'habit' | 'todo' | 'quest' | 'dungeon' | 'streak' | 'penalty'

interface UserAttributes {
  attr_str: number
  attr_int: number
  attr_agi: number
  attr_vit: number
  attr_cha: number
}

// ── Public API ──

export class TaskEconomyService {
  private db: SupabaseClient
  private gamification: GamificationService

  constructor(db: SupabaseClient) {
    this.db = db
    this.gamification = new GamificationService(db)
  }

  /**
   * Get XP reward amount for completing a task
   */
  getXpReward(taskType: TaskType, priority?: Priority): number {
    if (taskType === 'habit') return HABIT_XP_REWARD
    if (taskType === 'daily') return DAILY_XP_REWARD[priority || 'medium'] || 10
    if (taskType === 'todo') return TODO_XP_REWARD[priority || 'medium'] || 10
    return 0
  }

  /**
   * Get XP penalty amount for missing/overdue task
   */
  getXpPenalty(taskType: TaskType, priority?: Priority): number {
    if (taskType === 'habit') return 0 // habits use HP penalty instead
    if (taskType === 'daily') return DAILY_XP_PENALTY[priority || 'medium'] || 5
    if (taskType === 'todo') return TODO_XP_PENALTY[priority || 'medium'] || 10
    return 0
  }

  /**
   * Get HP penalty for a missed habit based on reset type
   */
  getHpPenalty(resetType: ResetType): number {
    return HABIT_HP_PENALTY[resetType] || 5
  }

  /**
   * Apply attribute multiplier to base XP.
   *
   * @deprecated Pass `category` to `awardXp` instead — it applies the bonus via
   * GamificationService. Kept so existing callers keep type-checking; it now
   * uses the shared constant rather than a second, smaller rate.
   */
  applyAttributeMultiplier(
    baseXp: number,
    category: string,
    attributes: UserAttributes
  ): number {
    return applyAttributeXpBonus(baseXp, category, {
      str: attributes.attr_str,
      int: attributes.attr_int,
      agi: attributes.attr_agi,
      vit: attributes.attr_vit,
      cha: attributes.attr_cha,
    })
  }

  /**
   * Award XP for a task completion — idempotent via the xp_transactions
   * UNIQUE (user_id, source_type, source_id) constraint.
   *
   * The actual XP application is delegated to GamificationService.addXp so that
   * level-ups grant AiCoins, stat points, rank changes and notifications. The
   * previous inline implementation wrote only `xp`/`level`, so leveling up from
   * a daily silently awarded nothing and left `rank` permanently stale.
   *
   * Pass `category` to get the STR/INT attribute bonus applied.
   */
  async awardXp(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    amount: number,
    reason?: string,
    category?: string
  ): Promise<{ success: boolean; alreadyAwarded: boolean; amount: number; leveledUp: boolean }> {
    if (amount <= 0) return { success: true, alreadyAwarded: false, amount: 0, leveledUp: false }

    // Claim the idempotency key first so concurrent double-submits collapse.
    const { data: txRow, error: txError } = await this.db
      .from('xp_transactions')
      .insert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        amount,
        reason: reason || `${sourceType} completion`,
      })
      .select('id')
      .single()

    if (txError) {
      // 23505 = unique_violation (already awarded)
      if (txError.code === '23505') {
        return { success: true, alreadyAwarded: true, amount: 0, leveledUp: false }
      }
      throw new Error(`XP award failed: ${txError.message}`)
    }

    const result = await this.gamification.addXp(userId, amount, { actionType: category })

    // The profile update failed — release the idempotency key so the award is
    // not permanently lost. Previously the key stayed claimed and the XP was
    // unrecoverable.
    if (result.xpAwarded <= 0) {
      if (txRow?.id) await this.db.from('xp_transactions').delete().eq('id', txRow.id)
      return { success: false, alreadyAwarded: false, amount: 0, leveledUp: false }
    }

    // Record what was actually granted (post HP-state modifier and attribute
    // bonus) rather than the requested base amount.
    if (txRow?.id && result.xpAwarded !== amount) {
      await this.db.from('xp_transactions').update({ amount: result.xpAwarded }).eq('id', txRow.id)
    }

    return {
      success: true,
      alreadyAwarded: false,
      amount: result.xpAwarded,
      leveledUp: result.leveledUp,
    }
  }

  /**
   * Apply XP penalty — idempotent via xp_transactions UNIQUE constraint.
   * sourceId should include date for recurring penalties (e.g., "todo_id:2026-05-02")
   */
  async applyXpPenalty(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; alreadyApplied: boolean }> {
    if (amount <= 0) return { success: true, alreadyApplied: false }

    const { error: txError } = await this.db
      .from('xp_transactions')
      .insert({
        user_id: userId,
        source_type: 'penalty',
        source_id: sourceId,
        amount: -Math.abs(amount),
        reason: reason || `${sourceType} penalty`,
      })

    if (txError) {
      if (txError.code === '23505') {
        return { success: true, alreadyApplied: true }
      }
      throw new Error(`XP penalty failed: ${txError.message}`)
    }

    // Delegate so the penalty cascades through levels and keeps total_xp and
    // rank consistent. The old inline version only clamped `xp` at 0 within the
    // current level, so a large penalty at low XP was silently absorbed.
    await this.gamification.removeXp(userId, Math.abs(amount))

    return { success: true, alreadyApplied: false }
  }

  /**
   * Apply HP damage for missed habits — with VIT mitigation.
   * Every 3 VIT points = 10% damage reduction.
   */
  async applyHpDamage(
    userId: string,
    baseDamage: number,
    reason = 'Missed obligation'
  ): Promise<{ success: boolean; actualDamage: number; newHp: number }> {
    // Delegated. The old inline version derived hp_state from ABSOLUTE hp
    // (60/30/10) rather than a percentage of max_hp, so any user who invested
    // in VIT (max_hp 100 + 15/point) got a wrong state — e.g. 70/250 HP read as
    // "healthy" here while GamificationService correctly called it "weakened".
    const before = await this.db
      .from('user_profiles')
      .select('hp')
      .eq('id', userId)
      .single()

    if (!before.data) throw new Error('User not found')

    const result = await this.gamification.damageHp(userId, baseDamage, reason)

    return {
      success: true,
      actualDamage: Math.max(0, (before.data.hp ?? 0) - result.hp),
      newHp: result.hp,
    }
  }

  /**
   * Recover HP (e.g., from Perfect Day, Recovery Tasks)
   */
  async recoverHp(
    userId: string,
    amount: number,
    reason = 'Recovery'
  ): Promise<{ success: boolean; newHp: number }> {
    const result = await this.gamification.healHp(userId, amount, reason)
    return { success: true, newHp: result.hp }
  }
}

// ── Helper: Auto-calculate XP reward/penalty for a new task ──

export function calculateTaskXp(
  taskType: TaskType,
  priority?: Priority,
  hasDueDate?: boolean
): { xp_reward: number; xp_penalty: number } {
  if (taskType === 'habit') {
    return { xp_reward: HABIT_XP_REWARD, xp_penalty: 0 }
  }
  if (taskType === 'daily') {
    return {
      xp_reward: DAILY_XP_REWARD[priority || 'medium'] || 10,
      xp_penalty: DAILY_XP_PENALTY[priority || 'medium'] || 5,
    }
  }
  if (taskType === 'todo') {
    return {
      xp_reward: TODO_XP_REWARD[priority || 'medium'] || 10,
      xp_penalty: hasDueDate ? (TODO_XP_PENALTY[priority || 'medium'] || 10) : 0,
    }
  }
  return { xp_reward: 0, xp_penalty: 0 }
}

export function calculateHpPenalty(resetType: ResetType): number {
  return HABIT_HP_PENALTY[resetType] || 5
}
