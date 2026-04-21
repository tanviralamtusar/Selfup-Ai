import { SupabaseClient } from '@supabase/supabase-js'
import { xpToNextLevel } from '@/constants/gamification'

interface LevelUpInfo {
  newLevel: number
  totalXp: number
  coinsRewarded: number
}

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
}
