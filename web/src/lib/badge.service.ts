import { SupabaseClient } from '@supabase/supabase-js'

// ─── Interfaces ─────────────────────────────────

interface BadgeInfo {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  isSecret: boolean
  earnedAt?: string
}

// ─── Service ────────────────────────────────────

export class BadgeService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  /**
   * Get all badges for a user — earned ones with full info,
   * unearned ones with masking for secret badges.
   */
  async getUserBadges(userId: string): Promise<{ earned: BadgeInfo[]; unearned: BadgeInfo[] }> {
    // Get all badges
    const { data: allBadges } = await this.supabase
      .from('badges')
      .select('id, slug, name, description, icon, category, rarity, is_secret')
      .order('created_at', { ascending: true })

    // Get user's earned badges
    const { data: earnedRaw } = await this.supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId)

    const earnedMap = new Map(
      (earnedRaw || []).map((ub) => [ub.badge_id, ub.earned_at])
    )

    const earned: BadgeInfo[] = []
    const unearned: BadgeInfo[] = []

    for (const badge of allBadges || []) {
      const earnedAt = earnedMap.get(badge.id)

      if (earnedAt) {
        earned.push({
          id: badge.id,
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          isSecret: badge.is_secret,
          earnedAt,
        })
      } else {
        // Mask secret badge details if not earned
        unearned.push({
          id: badge.id,
          slug: badge.is_secret ? '???' : badge.slug,
          name: badge.is_secret ? '???' : badge.name,
          description: badge.is_secret
            ? 'This badge cannot be identified. It must be found.'
            : badge.description,
          icon: badge.is_secret ? '❓' : badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          isSecret: badge.is_secret,
        })
      }
    }

    return { earned, unearned }
  }

  /**
   * Award a badge to a user by slug.
   * Returns true if newly awarded, false if already had.
   */
  async awardBadge(userId: string, badgeSlug: string): Promise<boolean> {
    // Find badge by slug
    const { data: badge, error: badgeErr } = await this.supabase
      .from('badges')
      .select('id, name, icon, rarity')
      .eq('slug', badgeSlug)
      .single()

    if (badgeErr || !badge) {
      console.error(`[Badge] Badge not found: ${badgeSlug}`)
      return false
    }

    // Check if already earned
    const { data: existing } = await this.supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single()

    if (existing) return false // Already has it

    // Award
    const { error: insertErr } = await this.supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badge.id,
      earned_at: new Date().toISOString(),
    })

    if (insertErr) {
      console.error('[Badge] Failed to award:', insertErr)
      return false
    }

    // Notification
    await this.supabase.from('notifications').insert({
      user_id: userId,
      type: 'badge_earned',
      title: `${badge.icon} Badge Earned: ${badge.name}`,
      body: `You've unlocked a ${badge.rarity} badge!`,
      data: { badgeSlug, badgeName: badge.name, rarity: badge.rarity },
    })

    return true
  }

  /**
   * Check common badge unlock conditions after an action.
   * Call this after habit logs, task completions, workout logs, etc.
   */
  async checkBadgeUnlocks(
    userId: string,
    context: {
      action: string
      streak?: number
      level?: number
      rank?: string
      workoutCount?: number
      taskCount?: number
      questCount?: number
      skillCount?: number
      pomodoroCount?: number
      attributes?: Record<string, number>
    }
  ): Promise<string[]> {
    const awarded: string[] = []

    // Streak badges
    if (context.streak) {
      const streakBadges = [
        { days: 3, slug: 'hot_start' },
        { days: 7, slug: 'week_warrior' },
        { days: 14, slug: 'two_weeks_strong' },
        { days: 30, slug: 'monthly_master' },
        { days: 60, slug: 'dedication' },
        { days: 100, slug: 'century' },
      ]
      for (const sb of streakBadges) {
        if (context.streak >= sb.days) {
          const result = await this.awardBadge(userId, sb.slug)
          if (result) awarded.push(sb.slug)
        }
      }
    }

    // Level badges
    if (context.level) {
      if (context.level >= 10) {
        const r = await this.awardBadge(userId, 'rising_star')
        if (r) awarded.push('rising_star')
      }
      if (context.level >= 25) {
        const r = await this.awardBadge(userId, 'elite_player')
        if (r) awarded.push('elite_player')
      }
      if (context.level >= 50) {
        const r = await this.awardBadge(userId, 'legend')
        if (r) awarded.push('legend')
      }
    }

    // Workout badges
    if (context.workoutCount) {
      if (context.workoutCount >= 1) {
        const r = await this.awardBadge(userId, 'first_workout')
        if (r) awarded.push('first_workout')
      }
      if (context.workoutCount >= 50) {
        const r = await this.awardBadge(userId, 'gym_rat')
        if (r) awarded.push('gym_rat')
      }
      if (context.workoutCount >= 100) {
        const r = await this.awardBadge(userId, 'iron_will')
        if (r) awarded.push('iron_will')
      }
    }

    // Task badges
    if (context.taskCount && context.taskCount >= 100) {
      const r = await this.awardBadge(userId, 'task_master')
      if (r) awarded.push('task_master')
    }

    // Quest badges
    if (context.questCount && context.questCount >= 20) {
      const r = await this.awardBadge(userId, 'quest_hero')
      if (r) awarded.push('quest_hero')
    }

    // Pomodoro badges
    if (context.pomodoroCount && context.pomodoroCount >= 50) {
      const r = await this.awardBadge(userId, 'pomodoro_pro')
      if (r) awarded.push('pomodoro_pro')
    }

    // Attribute badges
    if (context.attributes) {
      const attrBadges: { attr: string; value: number; slug: string }[] = [
        { attr: 'vit', value: 20, slug: 'vessel_mastery' },
        { attr: 'int', value: 20, slug: 'scholar_supreme' },
        { attr: 'agi', value: 20, slug: 'tactician_supreme' },
      ]
      for (const ab of attrBadges) {
        if ((context.attributes[ab.attr] ?? 0) >= ab.value) {
          const r = await this.awardBadge(userId, ab.slug)
          if (r) awarded.push(ab.slug)
        }
      }
    }

    // Rank badges
    if (context.rank === 'S') {
      const r = await this.awardBadge(userId, 'rank_s')
      if (r) awarded.push('rank_s')
    }
    if (context.rank === 'SSS') {
      const r = await this.awardBadge(userId, 'system_architect')
      if (r) awarded.push('system_architect')
    }

    return awarded
  }
}
