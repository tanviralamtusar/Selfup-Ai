import { SupabaseClient } from '@supabase/supabase-js'
import { xpToNextLevel } from '@/constants/gamification'

interface LevelUpInfo {
  newLevel: number
  totalXp: number
  coinsRewarded: number
}

const STREAK_FREEZE_COST = 100 // AiCoins per freeze

export class GamificationService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  /**
   * Adds XP to a user and handles level-ups automatically.
   * Note: This assumes `this.supabase` is initialized with the authenticated user context or as an admin.
   */
  async addXp(userId: string, xpAmount: number): Promise<{ leveledUp: boolean, details?: LevelUpInfo }> {
    if (xpAmount <= 0) return { leveledUp: false }

    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('level, xp, total_xp, ai_coins')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Failed to fetch profile for XP addition:', error)
      return { leveledUp: false }
    }

    let { level, xp, total_xp, ai_coins } = profile
    
    total_xp += xpAmount
    xp += xpAmount
    let leveledUp = false
    let coinsRewarded = 0

    // Handle multiple level ups if XP is massive
    while (xp >= xpToNextLevel(level)) {
      leveledUp = true
      xp -= xpToNextLevel(level)
      level += 1
      
      // Reward 50 AiCoins per level up
      coinsRewarded += 50
      ai_coins += 50
    }

    // Update the profile
    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({
        level,
        xp,
        xp_to_next_level: xpToNextLevel(level),
        total_xp,
        ai_coins
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update profile XP:', updateError)
      return { leveledUp: false }
    }

    // If leveled up, log a coin transaction
    if (leveledUp && coinsRewarded > 0) {
      await this.supabase.from('ai_coin_transactions').insert({
        user_id: userId,
        amount: coinsRewarded,
        reason: `Level up to Level ${level}`,
        balance_after: ai_coins
      })

      // We could also notify the user with the notifications system
      await this.supabase.from('notifications').insert({
        user_id: userId,
        type: 'level_up',
        title: `Level Up! You are now Level ${level}`,
        body: `Congratulations! You've earned ${coinsRewarded} AiCoins.`,
        data: { newLevel: level, coinsRewarded }
      })
    }

    return {
      leveledUp,
      details: leveledUp ? { newLevel: level, totalXp: total_xp, coinsRewarded } : undefined
    }
  }

  /**
   * Updates the user's overall streak.
   * - If streak_last_date == today: no change (already counted).
   * - If streak_last_date == yesterday: increment streak.
   * - If older: check for streak freeze, otherwise reset to 1.
   * Returns the new streak value and whether a freeze was consumed.
   */
  async updateOverallStreak(userId: string): Promise<{ streak: number, freezeUsed: boolean }> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('streak_overall, streak_best, streak_last_date, streak_freeze_count')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Failed to fetch profile for streak update:', error)
      return { streak: 0, freezeUsed: false }
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Already counted today — do nothing but return current
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
      // Perfect continuity — extend streak
      newStreak = (profile.streak_overall ?? 0) + 1
    } else if (profile.streak_last_date && freezeCount > 0) {
      // Missed a day (or more), check if we can use a freeze
      const lastDate = new Date(profile.streak_last_date)
      const diffTime = Math.abs(now.getTime() - lastDate.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      // We only allow a freeze to bridge a 1-day gap (diffDays would be 2 if yesterday was missed)
      if (diffDays <= 2) {
        newStreak = (profile.streak_overall ?? 0) + 1
        freezeCount -= 1
        freezeUsed = true
        console.log(`[Streak] Freeze consumed for user ${userId}. New streak: ${newStreak}`)
      } else {
        console.log(`[Streak] Too many days missed (${diffDays}). Resetting streak for user ${userId}`)
      }
    } else {
      console.log(`[Streak] Missed day and no freezes. Resetting for user ${userId}`)
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

    return { streak: newStreak, freezeUsed }
  }

  /**
   * Purchase a streak freeze using AiCoins.
   * Returns true if purchase was successful.
   */
  async purchaseStreakFreeze(userId: string): Promise<{ success: boolean, newBalance?: number, newFreezeCount?: number }> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('ai_coins, streak_freeze_count')
      .eq('id', userId)
      .single()

    if (error || !profile) return { success: false }

    if (profile.ai_coins < STREAK_FREEZE_COST) {
      return { success: false } // Insufficient funds
    }

    const newBalance = profile.ai_coins - STREAK_FREEZE_COST
    const newFreezeCount = (profile.streak_freeze_count ?? 0) + 1

    const { error: updateErr } = await this.supabase
      .from('user_profiles')
      .update({
        ai_coins: newBalance,
        streak_freeze_count: newFreezeCount,
      })
      .eq('id', userId)

    if (updateErr) return { success: false }

    // Record transaction
    await this.supabase.from('ai_coin_transactions').insert({
      user_id: userId,
      amount: -STREAK_FREEZE_COST,
      type: 'spend',
      reason: 'Purchased Streak Freeze',
      balance_after: newBalance,
    })

    return { success: true, newBalance, newFreezeCount }
  }

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
    if (newBalance < 0) return false // Insufficient funds

    // Use RPC or simply chained await (RPC is better for concurrency, but doing chained for simplicity)
    const { error: updateErr } = await this.supabase
      .from('user_profiles')
      .update({ ai_coins: newBalance })
      .eq('id', userId)

    if (updateErr) return false

    // Record transaction
    await this.supabase.from('ai_coin_transactions').insert({
      user_id: userId,
      amount,
      reason,
      balance_after: newBalance
    })

    return true
  }

  /**
   * Gets the activity status for the current week.
   * Returns an array of 7 booleans [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
   */
  async getWeeklyActivity(userId: string): Promise<boolean[]> {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 is Sunday, 1 is Monday...
    
    // Calculate Monday of the current week
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    // Fetch all logs between Monday and Sunday
    const { data: logs } = await this.supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', monday.toISOString().split('T')[0])
      .lte('completed_at', sunday.toISOString().split('T')[0])

    const activityMap = new Array(7).fill(false)
    const completedDays = new Set(logs?.map(l => l.completed_at))

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
