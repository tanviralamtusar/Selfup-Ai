import { SupabaseClient } from '@supabase/supabase-js'
import { GamificationService } from './gamification.service'
import { DUNGEON_TIERS, type DungeonTier } from '@/constants/gamification'

// ─── Interfaces ─────────────────────────────────

interface DungeonObjective {
  action: string
  target: number
  label: string
}

interface ActiveDungeon {
  id: string
  dungeonId: string
  tier: DungeonTier
  title: string
  description: string
  objectives: DungeonObjective[]
  progress: Record<string, number>
  xpReward: number
  coinReward: number
  status: 'active' | 'cleared' | 'failed' | 'expired'
  spawnedAt: string
  expiresAt: string
  timeRemainingMs: number
}

// ─── Service ────────────────────────────────────

export class DungeonService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  /**
   * Spawn a daily D-rank dungeon for a user.
   * Picks a random D-rank template and creates a user_dungeon instance.
   */
  async spawnDailyDungeon(userId: string): Promise<ActiveDungeon | null> {
    // Check if user already has an active D-rank dungeon today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: existing } = await this.supabase
      .from('user_dungeons')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('spawned_at', todayStart.toISOString())

    if (existing && existing.length > 0) return null // Already has one today

    // Get a random D-rank template
    const { data: templates, error } = await this.supabase
      .from('dungeons')
      .select('*')
      .eq('tier', 'D')
      .eq('is_template', true)

    if (error || !templates || templates.length === 0) {
      console.error('[Dungeon] No D-rank templates found')
      return null
    }

    const template = templates[Math.floor(Math.random() * templates.length)]

    // Create user dungeon instance
    const expiresAt = new Date()
    expiresAt.setHours(23, 59, 59, 999) // End of today

    const objectives = (template.objectives as DungeonObjective[]) || []
    const initialProgress: Record<string, number> = {}
    objectives.forEach((obj, i) => {
      initialProgress[`obj_${i}`] = 0
    })

    const { data: dungeon, error: insertErr } = await this.supabase
      .from('user_dungeons')
      .insert({
        user_id: userId,
        dungeon_id: template.id,
        status: 'active',
        progress: initialProgress,
        spawned_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .single()

    if (insertErr || !dungeon) {
      console.error('[Dungeon] Failed to spawn:', insertErr)
      return null
    }

    // Send notification
    await this.supabase.from('notifications').insert({
      user_id: userId,
      type: 'dungeon_spawn',
      title: `⚠ Dungeon Gate Detected: ${template.title}`,
      body: `Tier: D-Rank | Reward: ${template.xp_reward} XP + ${template.coin_reward} AiCoins. Gate closes at midnight.`,
      data: { dungeonId: dungeon.id, tier: 'D', title: template.title },
    })

    return this.formatDungeon(dungeon, template)
  }

  /**
   * Check and update dungeon progress when a user completes a qualifying action.
   */
  async checkDungeonProgress(
    userId: string,
    action: string,
    incrementBy: number = 1
  ): Promise<{ cleared: boolean; dungeonTitle?: string; xpReward?: number; coinReward?: number }> {
    // Get all active dungeons for this user
    const { data: activeDungeons, error } = await this.supabase
      .from('user_dungeons')
      .select('*, dungeons!inner(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())

    if (error || !activeDungeons || activeDungeons.length === 0) {
      return { cleared: false }
    }

    for (const ud of activeDungeons) {
      const template = (ud as any).dungeons
      const objectives = (template.objectives as DungeonObjective[]) || []
      const progress = (ud.progress as Record<string, number>) || {}
      let updated = false

      // Update progress for matching objectives
      objectives.forEach((obj, i) => {
        if (obj.action === action) {
          const key = `obj_${i}`
          const current = progress[key] ?? 0
          if (current < obj.target) {
            progress[key] = Math.min(current + incrementBy, obj.target)
            updated = true
          }
        }
      })

      if (!updated) continue

      // Check if all objectives are complete
      const allCleared = objectives.every((obj, i) => {
        return (progress[`obj_${i}`] ?? 0) >= obj.target
      })

      if (allCleared) {
        // Mark as cleared
        await this.supabase
          .from('user_dungeons')
          .update({
            status: 'cleared',
            progress,
            completed_at: new Date().toISOString(),
          })
          .eq('id', ud.id)

        // Award rewards
        const gamService = new GamificationService(this.supabase)
        await gamService.addXp(userId, template.xp_reward || 200)
        if (template.coin_reward > 0) {
          await gamService.addCoins(userId, template.coin_reward, `Dungeon cleared: ${template.title}`)
        }

        // HP recovery from dungeon clear
        await gamService.healHp(userId, 10, 'Dungeon cleared')

        // Notification
        await this.supabase.from('notifications').insert({
          user_id: userId,
          type: 'dungeon_clear',
          title: `✅ Dungeon Cleared: ${template.title}`,
          body: `+${template.xp_reward} XP, +${template.coin_reward} AiCoins earned!`,
          data: { tier: template.tier, title: template.title },
        })

        return {
          cleared: true,
          dungeonTitle: template.title,
          xpReward: template.xp_reward,
          coinReward: template.coin_reward,
        }
      } else {
        // Just update progress
        await this.supabase
          .from('user_dungeons')
          .update({ progress })
          .eq('id', ud.id)
      }
    }

    return { cleared: false }
  }

  /**
   * Get all active dungeons for a user with countdown timers.
   */
  async getActiveDungeons(userId: string): Promise<ActiveDungeon[]> {
    const now = new Date()

    const { data, error } = await this.supabase
      .from('user_dungeons')
      .select('*, dungeons!inner(*)')
      .eq('user_id', userId)
      .in('status', ['active', 'cleared'])
      .gte('expires_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
      .order('spawned_at', { ascending: false })
      .limit(10)

    if (error || !data) return []

    return data.map((ud) => this.formatDungeon(ud, (ud as any).dungeons))
  }

  /**
   * Expire all dungeons past their deadline.
   * Should be called periodically (cron or on user load).
   */
  async expireUserDungeons(userId: string): Promise<number> {
    const now = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('user_dungeons')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .lt('expires_at', now)
      .select('id')

    if (error) {
      console.error('[Dungeon] Failed to expire:', error)
      return 0
    }

    return data?.length ?? 0
  }

  // ─── Helpers ──────────────────────────────────

  private formatDungeon(userDungeon: any, template: any): ActiveDungeon {
    const now = new Date()
    const expiresAt = new Date(userDungeon.expires_at)

    return {
      id: userDungeon.id,
      dungeonId: template.id,
      tier: template.tier as DungeonTier,
      title: template.title,
      description: template.description || '',
      objectives: (template.objectives as DungeonObjective[]) || [],
      progress: (userDungeon.progress as Record<string, number>) || {},
      xpReward: template.xp_reward,
      coinReward: template.coin_reward,
      status: userDungeon.status,
      spawnedAt: userDungeon.spawned_at,
      expiresAt: userDungeon.expires_at,
      timeRemainingMs: Math.max(0, expiresAt.getTime() - now.getTime()),
    }
  }
}
