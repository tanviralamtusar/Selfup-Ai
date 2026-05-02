import { SupabaseClient } from '@supabase/supabase-js'

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

// ── Attribute Multiplier (from §5.3) ──

const ATTRIBUTE_BONUS_PER_POINT = 0.005 // +0.5% per point

const CATEGORY_ATTRIBUTE_MAP: Record<string, string> = {
  fitness: 'attr_str',
  skills: 'attr_int',
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

  constructor(db: SupabaseClient) {
    this.db = db
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
   * Apply attribute multiplier to base XP
   * fitness tasks get STR bonus, skills tasks get INT bonus
   */
  applyAttributeMultiplier(
    baseXp: number,
    category: string,
    attributes: UserAttributes
  ): number {
    const attrKey = CATEGORY_ATTRIBUTE_MAP[category]
    if (!attrKey) return baseXp

    const attrValue = (attributes as unknown as Record<string, number>)[attrKey] || 0
    const multiplier = 1 + ATTRIBUTE_BONUS_PER_POINT * attrValue
    return Math.floor(baseXp * multiplier)
  }

  /**
   * Award XP for a task completion — idempotent via xp_transactions UNIQUE constraint.
   * Returns { success, alreadyAwarded, amount }
   */
  async awardXp(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; alreadyAwarded: boolean; amount: number }> {
    if (amount <= 0) return { success: true, alreadyAwarded: false, amount: 0 }

    // Try to insert — UNIQUE constraint prevents duplicates
    const { error: txError } = await this.db
      .from('xp_transactions')
      .insert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        amount,
        reason: reason || `${sourceType} completion`,
      })

    if (txError) {
      // 23505 = unique_violation (already awarded)
      if (txError.code === '23505') {
        return { success: true, alreadyAwarded: true, amount: 0 }
      }
      throw new Error(`XP award failed: ${txError.message}`)
    }

    // Update user XP
    await this.db.rpc('increment_user_xp', {
      p_user_id: userId,
      p_amount: amount,
    }).then(async (result) => {
      // If RPC doesn't exist, fall back to manual update
      if (result.error) {
        const { data: profile } = await this.db
          .from('user_profiles')
          .select('xp, total_xp, xp_to_next_level, level')
          .eq('id', userId)
          .single()

        if (profile) {
          let newXp = (profile.xp || 0) + amount
          let newTotalXp = (profile.total_xp || 0) + amount
          let level = profile.level || 1
          let xpToNext = profile.xp_to_next_level || 100

          // Check for level up
          while (newXp >= xpToNext) {
            newXp -= xpToNext
            level += 1
            xpToNext = Math.floor(100 * Math.pow(level, 1.5))
          }

          await this.db
            .from('user_profiles')
            .update({
              xp: newXp,
              total_xp: newTotalXp,
              level,
              xp_to_next_level: xpToNext,
            })
            .eq('id', userId)
        }
      }
    })

    return { success: true, alreadyAwarded: false, amount }
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

    // Reduce user XP (but not below 0 for current level)
    const { data: profile } = await this.db
      .from('user_profiles')
      .select('xp')
      .eq('id', userId)
      .single()

    if (profile) {
      const newXp = Math.max(0, (profile.xp || 0) - Math.abs(amount))
      await this.db
        .from('user_profiles')
        .update({ xp: newXp })
        .eq('id', userId)
    }

    return { success: true, alreadyApplied: false }
  }

  /**
   * Apply HP damage for missed habits — with VIT mitigation.
   * Every 3 VIT points = 10% damage reduction.
   */
  async applyHpDamage(
    userId: string,
    baseDamage: number
  ): Promise<{ success: boolean; actualDamage: number; newHp: number }> {
    const { data: profile } = await this.db
      .from('user_profiles')
      .select('hp, max_hp, attr_vit')
      .eq('id', userId)
      .single()

    if (!profile) throw new Error('User not found')

    // VIT mitigation: every 3 VIT = 10% reduction
    const vitReduction = Math.floor((profile.attr_vit || 0) / 3) * 0.1
    const actualDamage = Math.max(1, Math.floor(baseDamage * (1 - vitReduction)))
    const newHp = Math.max(0, (profile.hp || 100) - actualDamage)

    // Determine HP state
    let hpState = 'healthy'
    if (newHp <= 60 && newHp > 30) hpState = 'weakened'
    else if (newHp <= 30 && newHp > 10) hpState = 'critical'
    else if (newHp <= 10 && newHp > 0) hpState = 'collapse'
    else if (newHp === 0) hpState = 'collapse' // Level regression handled separately

    await this.db
      .from('user_profiles')
      .update({ hp: newHp, hp_state: hpState })
      .eq('id', userId)

    return { success: true, actualDamage, newHp }
  }

  /**
   * Recover HP (e.g., from Perfect Day, Recovery Tasks)
   */
  async recoverHp(
    userId: string,
    amount: number
  ): Promise<{ success: boolean; newHp: number }> {
    const { data: profile } = await this.db
      .from('user_profiles')
      .select('hp, max_hp')
      .eq('id', userId)
      .single()

    if (!profile) throw new Error('User not found')

    const newHp = Math.min(profile.max_hp || 100, (profile.hp || 100) + amount)

    let hpState = 'healthy'
    if (newHp <= 60 && newHp > 30) hpState = 'weakened'
    else if (newHp <= 30 && newHp > 10) hpState = 'critical'
    else if (newHp <= 10) hpState = 'collapse'

    await this.db
      .from('user_profiles')
      .update({ hp: newHp, hp_state: hpState })
      .eq('id', userId)

    return { success: true, newHp }
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
