import { SupabaseClient } from '@supabase/supabase-js'
import {
  ATTRIBUTE_MAX,
  ATTRIBUTE_GAIN_THRESHOLDS,
  type AttributeKey,
  calculateMaxHp,
} from '@/constants/gamification'

// ─── Interfaces ─────────────────────────────────

interface AttributeProgress {
  key: AttributeKey
  current: number
  max: number
  /** How many qualifying actions the user has done toward the next point */
  actionsCompleted: number
  /** How many qualifying actions are needed for the next point */
  actionsRequired: number
  /** 0–100 percent toward next point */
  progressPercent: number
}

interface AttributeGainResult {
  gained: boolean
  attribute?: AttributeKey
  newValue?: number
}

// ─── Service ────────────────────────────────────

export class AttributeService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  /**
   * Check if a user has earned an automatic attribute point
   * based on their qualifying actions.
   * 
   * Called after: workout logs, skill sessions, streak updates,
   * water/sleep logs, guild activities.
   */
  async checkAttributeGain(
    userId: string,
    actionType: 'workout' | 'skill_session' | 'streak_7day' | 'water_sleep_log' | 'guild_activity'
  ): Promise<AttributeGainResult> {
    const attrMap: Record<string, AttributeKey> = {
      workout: 'str',
      skill_session: 'int',
      streak_7day: 'agi',
      water_sleep_log: 'vit',
      guild_activity: 'cha',
    }

    const attribute = attrMap[actionType]
    if (!attribute) return { gained: false }

    const attrColumn = `attr_${attribute}`
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select(`${attrColumn}, max_hp`)
      .eq('id', userId)
      .single()

    if (error || !profile) return { gained: false }

    const currentValue = (profile as any)[attrColumn] ?? 0
    if (currentValue >= ATTRIBUTE_MAX) return { gained: false }

    // Count qualifying actions
    const actionCount = await this.countQualifyingActions(userId, actionType)
    const threshold = ATTRIBUTE_GAIN_THRESHOLDS[attribute]
    const expectedPoints = Math.floor(actionCount / threshold.perPoint)

    // If expected points > current value, they've earned another point
    if (expectedPoints > currentValue) {
      const newValue = Math.min(expectedPoints, ATTRIBUTE_MAX)

      const updates: Record<string, unknown> = { [attrColumn]: newValue }

      // Recalculate max_hp if VIT changed
      if (attribute === 'vit') {
        updates.max_hp = calculateMaxHp(newValue)
      }

      await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)

      // Notify
      await this.supabase.from('notifications').insert({
        user_id: userId,
        type: 'attribute_gain',
        title: `${attribute.toUpperCase()} Increased!`,
        body: `Your ${attribute.toUpperCase()} attribute has risen to ${newValue}.`,
        data: { attribute, newValue },
      })

      return { gained: true, attribute, newValue }
    }

    return { gained: false }
  }

  /**
   * Get progress toward the next attribute point for all attributes.
   */
  async getAttributeProgress(userId: string): Promise<AttributeProgress[]> {
    const { data: profile, error } = await this.supabase
      .from('user_profiles')
      .select('attr_str, attr_int, attr_agi, attr_vit, attr_cha')
      .eq('id', userId)
      .single()

    if (error || !profile) return []

    const attrs: AttributeKey[] = ['str', 'int', 'agi', 'vit', 'cha']
    const progress: AttributeProgress[] = []

    for (const attr of attrs) {
      const current = (profile as any)[`attr_${attr}`] ?? 0
      const threshold = ATTRIBUTE_GAIN_THRESHOLDS[attr]

      let actionsCompleted = 0
      try {
        actionsCompleted = await this.countQualifyingActions(userId, this.getActionTypeForAttribute(attr))
      } catch {
        // Silently handle if counting fails
      }

      const actionsForCurrentLevel = current * threshold.perPoint
      const actionsTowardNext = actionsCompleted - actionsForCurrentLevel
      const progressPercent = current >= ATTRIBUTE_MAX
        ? 100
        : Math.min(100, Math.floor((actionsTowardNext / threshold.perPoint) * 100))

      progress.push({
        key: attr,
        current,
        max: ATTRIBUTE_MAX,
        actionsCompleted: actionsTowardNext,
        actionsRequired: threshold.perPoint,
        progressPercent,
      })
    }

    return progress
  }

  // ─── Helpers ──────────────────────────────────

  private getActionTypeForAttribute(attr: AttributeKey): string {
    const map: Record<AttributeKey, string> = {
      str: 'workout',
      int: 'skill_session',
      agi: 'streak_7day',
      vit: 'water_sleep_log',
      cha: 'guild_activity',
    }
    return map[attr]
  }

  private async countQualifyingActions(userId: string, actionType: string): Promise<number> {
    switch (actionType) {
      case 'workout': {
        const { count } = await this.supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
        return count ?? 0
      }
      case 'skill_session': {
        // Count total skill hours (sessions * duration / 60)
        const { data } = await this.supabase
          .from('skill_sessions')
          .select('duration_minutes')
          .eq('user_id', userId)
        const totalHours = (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60
        return Math.floor(totalHours)
      }
      case 'streak_7day': {
        // Count how many times streak_overall has crossed a 7-day boundary
        // Simplified: use current best streak / 7
        const { data: profile } = await this.supabase
          .from('user_profiles')
          .select('streak_best')
          .eq('id', userId)
          .single()
        return Math.floor((profile?.streak_best ?? 0) / 7)
      }
      case 'water_sleep_log': {
        // Count distinct days with water logs
        const { count } = await this.supabase
          .from('water_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
        return Math.floor((count ?? 0) / 2) // Rough proxy: water+sleep combined
      }
      case 'guild_activity': {
        // Count challenge participations
        const { count } = await this.supabase
          .from('challenges')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', userId)
        return count ?? 0
      }
      default:
        return 0
    }
  }
}
