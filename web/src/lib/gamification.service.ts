import { SupabaseClient } from '@supabase/supabase-js'
import {
  xpToNextLevel,
  clampLevel,
  getRank,
  getRankLetter,
  calculateMaxHp,
  calculateHpDamageReduction,
  getHpState,
  getXpModifier,
  applyAttributeXpBonus,
  AICOIN_EARN,
  STREAK_MILESTONES,
  HP_DAMAGE,
  HP_RECOVERY,
  STREAK_FREEZE,
  MAX_LEVEL,
  type Rank,
  type HpState,
  type AttributeKey,
  ATTRIBUTE_MAX,
} from '@/constants/gamification'

// ─── Interfaces ─────────────────────────────────

interface LevelUpInfo {
  newLevel: number
  totalXp: number
  coinsRewarded: number
  statPointsAwarded: number
  rankUp?: { oldRank: Rank; newRank: Rank; rankTitle: string }
}

interface HpChangeResult {
  hp: number
  maxHp: number
  hpState: HpState
  levelRegression?: { oldLevel: number; newLevel: number }
}

interface StatAllocationResult {
  success: boolean
  attribute?: AttributeKey
  newValue?: number
  remainingPoints?: number
  error?: string
}

// ─── Service ────────────────────────────────────

export class GamificationService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  // ─── XP & Level ───────────────────────────────

  /**
   * Adds XP to a user with attribute bonuses and HP-state modifier.
   * Handles level-ups, stat point allocation, and rank-up events.
   */
  async addXp(
    userId: string,
    baseXpAmount: number,
    options?: { actionType?: string; skipModifier?: boolean }
  ): Promise<{ leveledUp: boolean; xpAwarded: number; details?: LevelUpInfo }> {
    if (baseXpAmount <= 0) return { leveledUp: false, xpAwarded: 0 }

    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select(
        'level, xp, total_xp, ai_coins, hp_state, attr_str, attr_int, attr_agi, attr_vit, attr_cha, stat_points, rank'
      )
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Failed to fetch profile for XP addition:', error)
      return { leveledUp: false, xpAwarded: 0 }
    }

    // Apply HP-state XP modifier (weakened = -15%, critical = -30%, collapse = -50%)
    let xpAmount = baseXpAmount
    if (!options?.skipModifier) {
      const modifier = getXpModifier(profile.hp_state as HpState)
      xpAmount = Math.floor(baseXpAmount * modifier)
    }

    // Apply attribute bonus (STR for physical, INT for learning)
    xpAmount = applyAttributeXpBonus(xpAmount, options?.actionType, {
      str: profile.attr_str,
      int: profile.attr_int,
      agi: profile.attr_agi,
      vit: profile.attr_vit,
      cha: profile.attr_cha,
    })

    // Modifiers can round a small award down to 0 — never let an award vanish.
    if (xpAmount <= 0) xpAmount = 1

    let { xp, total_xp, ai_coins, stat_points } = profile
    let level = clampLevel(profile.level ?? 1)
    const oldRank = profile.rank as Rank

    total_xp += xpAmount
    xp += xpAmount
    let leveledUp = false
    let coinsRewarded = 0
    let statPointsAwarded = 0

    // Handle multiple level ups, stopping at MAX_LEVEL
    while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
      leveledUp = true
      xp -= xpToNextLevel(level)
      level += 1

      // +50 AiCoins per level up
      coinsRewarded += AICOIN_EARN.LEVEL_UP
      ai_coins += AICOIN_EARN.LEVEL_UP

      // +1 stat point per level up
      statPointsAwarded += 1
      stat_points += 1
    }

    // At max level XP still accrues into total_xp, but the progress bar pins full
    // instead of growing without bound.
    if (level >= MAX_LEVEL) {
      xp = Math.min(xp, xpToNextLevel(MAX_LEVEL))
    }

    // Check rank change
    const newRank = getRankLetter(level)
    const rankChanged = newRank !== oldRank

    // Update profile
    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({
        level,
        xp,
        xp_to_next_level: xpToNextLevel(level),
        total_xp,
        ai_coins,
        stat_points,
        rank: newRank,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update profile XP:', updateError)
      return { leveledUp: false, xpAwarded: 0 }
    }

    // Log coin transaction if leveled up
    if (leveledUp && coinsRewarded > 0) {
      await this.supabase.from('ai_coin_transactions').insert({
        user_id: userId,
        amount: coinsRewarded,
        type: 'earn',
        reason: `Level up to Level ${level}`,
        balance_after: ai_coins,
      })

      // Create level-up notification
      await this.supabase.from('notifications').insert({
        user_id: userId,
        type: 'level_up',
        title: `Level Up! You are now Level ${level}`,
        body: `You earned ${coinsRewarded} AiCoins and ${statPointsAwarded} Stat Point${statPointsAwarded > 1 ? 's' : ''}. Allocate wisely.`,
        data: { newLevel: level, coinsRewarded, statPointsAwarded },
      })
    }

    // Create rank-up notification
    if (rankChanged) {
      const rankInfo = getRank(level)
      await this.supabase.from('notifications').insert({
        user_id: userId,
        type: 'rank_up',
        title: `Rank Up: ${rankInfo.rank} — ${rankInfo.title}`,
        body: `The System has acknowledged your growth. New unlocks: ${rankInfo.description}`,
        data: { oldRank, newRank, rankTitle: rankInfo.title },
      })
    }

    return {
      leveledUp,
      xpAwarded: xpAmount,
      details: leveledUp
        ? {
            newLevel: level,
            totalXp: total_xp,
            coinsRewarded,
            statPointsAwarded,
            rankUp: rankChanged
              ? { oldRank, newRank, rankTitle: getRank(level).title }
              : undefined,
          }
        : undefined,
    }
  }

  /**
   * Removes XP from a user (missed dailies, overdue todos).
   * Unlike a raw `xp` decrement this cascades down through levels, keeps
   * total_xp consistent, and re-derives rank. Level 1 is the floor — a
   * penalty can never drop a user below it, and XP never goes negative.
   */
  async removeXp(userId: string, amount: number): Promise<{ leveledDown: boolean; level: number; xp: number }> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('level, xp, total_xp, rank')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Failed to fetch profile for XP removal:', error)
      return { leveledDown: false, level: 1, xp: 0 }
    }

    const startingLevel = clampLevel(profile.level ?? 1)
    let level = startingLevel
    let xp = profile.xp ?? 0

    // Normalize first. Profiles written by the old TaskEconomy fallback (which
    // seeded its threshold from a possibly-stale xp_to_next_level column) and by
    // the old level regression (which dropped level but kept xp) can hold xp
    // above the current level's threshold. Settle that before subtracting.
    while (level < MAX_LEVEL && xp >= xpToNextLevel(level)) {
      xp -= xpToNextLevel(level)
      level += 1
    }

    xp -= Math.abs(amount)

    // Cascade downward through levels while the deficit remains
    while (xp < 0 && level > 1) {
      level -= 1
      xp += xpToNextLevel(level)
    }
    if (xp < 0) xp = 0 // floored at level 1

    const total_xp = Math.max(0, (profile.total_xp ?? 0) - Math.abs(amount))
    const newRank = getRankLetter(level)

    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({
        level,
        xp,
        xp_to_next_level: xpToNextLevel(level),
        total_xp,
        rank: newRank,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update profile after XP removal:', updateError)
      return { leveledDown: false, level: startingLevel, xp: profile.xp ?? 0 }
    }

    const leveledDown = level < startingLevel

    if (leveledDown) {
      await this.supabase.from('notifications').insert({
        user_id: userId,
        type: 'level_down',
        title: `Level Down: ${startingLevel} → ${level}`,
        body: 'Neglected obligations have eroded your progress. The System does not forget.',
        data: { oldLevel: startingLevel, newLevel: level },
      })
    }

    return { leveledDown, level, xp }
  }

  // ─── Stat Allocation ──────────────────────────

  /**
   * Allocate a stat point to a chosen attribute.
   * Called from the System Window after level-up.
   */
  async allocateStatPoint(userId: string, attribute: AttributeKey): Promise<StatAllocationResult> {
    const attrColumn = `attr_${attribute}` as const

    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select(`stat_points, ${attrColumn}, attr_vit, max_hp`)
      .eq('id', userId)
      .single()

    if (error || !profile) return { success: false, error: 'Profile not found' }
    if ((profile.stat_points ?? 0) <= 0) return { success: false, error: 'No stat points available' }

    const currentValue = (profile as any)[attrColumn] ?? 0
    if (currentValue >= ATTRIBUTE_MAX) return { success: false, error: `${attribute.toUpperCase()} is already at max` }

    const newValue = currentValue + 1
    const updates: Record<string, unknown> = {
      [attrColumn]: newValue,
      stat_points: (profile.stat_points ?? 0) - 1,
    }

    // If VIT was increased, recalculate max_hp
    if (attribute === 'vit') {
      updates.max_hp = calculateMaxHp(newValue)
    }

    const { error: updateErr } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)

    if (updateErr) return { success: false, error: 'Failed to allocate' }

    return {
      success: true,
      attribute,
      newValue,
      remainingPoints: (profile.stat_points ?? 0) - 1,
    }
  }

  // ─── HP System ────────────────────────────────

  /**
   * Apply HP damage to a user. Respects VIT damage reduction.
   * If HP reaches 0, triggers level regression.
   */
  async damageHp(userId: string, rawAmount: number, reason: string): Promise<HpChangeResult> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('hp, max_hp, attr_vit, level, rank')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { hp: 0, maxHp: 100, hpState: 'collapse' }
    }

    // Apply VIT damage reduction
    const reduction = calculateHpDamageReduction(profile.attr_vit ?? 0)
    const actualDamage = Math.max(1, Math.floor(rawAmount * (1 - reduction)))

    let newHp = Math.max(0, (profile.hp ?? 100) - actualDamage)
    let levelRegression: { oldLevel: number; newLevel: number } | undefined

    // Level regression at HP 0
    if (newHp <= 0 && (profile.level ?? 1) > 1) {
      const oldLevel = clampLevel(profile.level ?? 1)
      const newLevel = oldLevel - 1

      await this.supabase
        .from('user_profiles')
        .update({
          level: newLevel,
          // Reset progress into the level too. Without this the retained `xp`
          // still exceeds the (lower) new threshold, so the very next award
          // re-levels the user and the regression is a no-op.
          xp: 0,
          hp: 30, // Reset HP to 30 after regression
          hp_state: 'critical',
          rank: getRankLetter(newLevel),
          xp_to_next_level: xpToNextLevel(newLevel),
        })
        .eq('id', userId)

      // Create dramatic notification
      await this.supabase.from('notifications').insert({
        user_id: userId,
        type: 'level_regression',
        title: 'System Alert: Critical Vessel Failure',
        body: `Accumulated damage has exceeded threshold. Level ${oldLevel} → ${newLevel}. Recovery Quest assigned.`,
        data: { oldLevel, newLevel, reason },
      })

      levelRegression = { oldLevel, newLevel }
      newHp = 30

      return { hp: newHp, maxHp: profile.max_hp ?? 100, hpState: 'critical', levelRegression }
    }

    // Normal damage — update HP and state
    const hpState = getHpState(newHp, profile.max_hp ?? 100)

    await this.supabase
      .from('user_profiles')
      .update({ hp: newHp, hp_state: hpState })
      .eq('id', userId)

    return { hp: newHp, maxHp: profile.max_hp ?? 100, hpState }
  }

  /**
   * Recover HP for a user, up to max_hp.
   */
  async healHp(userId: string, amount: number, reason: string): Promise<HpChangeResult> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('hp, max_hp')
      .eq('id', userId)
      .single()

    if (error || !profile) return { hp: 0, maxHp: 100, hpState: 'collapse' }

    const maxHp = profile.max_hp ?? 100
    const newHp = Math.min(maxHp, (profile.hp ?? 0) + amount)
    const hpState = getHpState(newHp, maxHp)

    await this.supabase
      .from('user_profiles')
      .update({ hp: newHp, hp_state: hpState })
      .eq('id', userId)

    return { hp: newHp, maxHp, hpState }
  }

  // ─── Streak System ────────────────────────────

  /**
   * Updates the user's overall streak and category-specific streaks.
   * Returns the new streak value and whether a freeze was consumed.
   */
  async updateOverallStreak(userId: string): Promise<{ streak: number; freezeUsed: boolean }> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('streak_overall, streak_best, streak_last_date, streak_freeze_count, is_pro')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Failed to fetch profile for streak update:', error)
      return { streak: 0, freezeUsed: false }
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Already counted today
    if (profile.streak_last_date === todayStr) {
      return { streak: profile.streak_overall ?? 0, freezeUsed: false }
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak = 1
    let freezeUsed = false
    let freezeCount = profile.streak_freeze_count ?? 0

    if (profile.streak_last_date === yesterdayStr) {
      newStreak = (profile.streak_overall ?? 0) + 1
    } else if (profile.streak_last_date && freezeCount > 0) {
      const lastDate = new Date(profile.streak_last_date)
      const diffTime = Math.abs(now.getTime() - lastDate.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 2) {
        newStreak = (profile.streak_overall ?? 0) + 1
        freezeCount -= 1
        freezeUsed = true
        console.log(`[Streak] Freeze consumed for user ${userId}. New streak: ${newStreak}`)
      } else {
        console.log(`[Streak] Too many days missed (${diffDays}). Resetting for ${userId}`)
      }
    } else {
      console.log(`[Streak] Missed day and no freezes. Resetting for ${userId}`)
    }

    const newBest = Math.max(newStreak, profile.streak_best ?? 0)

    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({
        streak_overall: newStreak,
        streak_best: newBest,
        streak_last_date: todayStr,
        streak_freeze_count: freezeCount,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update streak:', updateError)
    }

    // Check streak milestones
    for (const milestone of STREAK_MILESTONES) {
      if (newStreak === milestone.days) {
        // Award milestone rewards
        if (milestone.xpReward > 0) {
          await this.addXp(userId, milestone.xpReward, { skipModifier: true })
        }
        if (milestone.coinReward > 0) {
          await this.addCoins(userId, milestone.coinReward, `Streak milestone: ${milestone.name}`)
        }

        // Notification
        await this.supabase.from('notifications').insert({
          user_id: userId,
          type: 'streak_milestone',
          title: `🔥 ${milestone.name}! ${milestone.days}-Day Streak`,
          body: `You earned +${milestone.xpReward} XP and +${milestone.coinReward} AiCoins!`,
          data: { days: milestone.days, badgeSlug: milestone.badgeSlug },
        })

        break // Only one milestone per update
      }
    }

    return { streak: newStreak, freezeUsed }
  }

  /**
   * Purchase a streak freeze using AiCoins.
   */
  async purchaseStreakFreeze(userId: string): Promise<{ success: boolean; newBalance?: number; newFreezeCount?: number }> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('ai_coins, streak_freeze_count')
      .eq('id', userId)
      .single()

    if (error || !profile) return { success: false }
    if (profile.ai_coins < STREAK_FREEZE.EXTRA_COST) return { success: false }

    const newBalance = profile.ai_coins - STREAK_FREEZE.EXTRA_COST
    const newFreezeCount = (profile.streak_freeze_count ?? 0) + 1

    const { error: updateErr } = await this.supabase
      .from('user_profiles')
      .update({
        ai_coins: newBalance,
        streak_freeze_count: newFreezeCount,
      })
      .eq('id', userId)

    if (updateErr) return { success: false }

    await this.supabase.from('ai_coin_transactions').insert({
      user_id: userId,
      amount: -STREAK_FREEZE.EXTRA_COST,
      type: 'spend',
      reason: 'Purchased Streak Freeze',
      balance_after: newBalance,
    })

    return { success: true, newBalance, newFreezeCount }
  }

  // ─── AiCoin System ────────────────────────────

  /**
   * Adds or deducts AiCoins for a specific reason.
   */
  async addCoins(userId: string, amount: number, reason: string): Promise<boolean> {
    if (amount === 0) return true

    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('ai_coins')
      .eq('id', userId)
      .single()

    if (error || !profile) return false

    const newBalance = profile.ai_coins + amount
    if (newBalance < 0) return false

    const { error: updateErr } = await this.supabase
      .from('user_profiles')
      .update({ ai_coins: newBalance })
      .eq('id', userId)

    if (updateErr) return false

    await this.supabase.from('ai_coin_transactions').insert({
      user_id: userId,
      amount,
      type: amount > 0 ? 'earn' : 'spend',
      reason,
      balance_after: newBalance,
    })

    return true
  }

  // ─── Weekly Activity ──────────────────────────

  /**
   * Gets the activity status for the current week.
   * Returns an array of 7 booleans [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
   */
  async getWeeklyActivity(userId: string): Promise<boolean[]> {
    const now = new Date()
    const dayOfWeek = now.getDay()

    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const { data: logs } = await this.supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', monday.toISOString().split('T')[0])
      .lte('completed_at', sunday.toISOString().split('T')[0])

    const activityMap = new Array(7).fill(false)
    const completedDays = new Set(logs?.map((l) => l.completed_at))

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday)
      current.setDate(monday.getDate() + i)
      const dateStr = current.toISOString().split('T')[0]
      if (completedDays.has(dateStr)) {
        activityMap[i] = true
      }
    }

    return activityMap
  }
}
