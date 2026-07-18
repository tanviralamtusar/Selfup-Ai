// ─── XP & Level System ──────────────────────────

/**
 * XP required to reach the next level (exponential curve)
 */
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

/**
 * Clamp a level into the valid [1, MAX_LEVEL] range.
 */
export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)))
}

/**
 * Get the title for a given level
 */
export function getLevelTitle(level: number): string {
  if (level <= 5) return 'Beginner'
  if (level <= 10) return 'Apprentice'
  if (level <= 15) return 'Seeker'
  if (level <= 20) return 'Achiever'
  if (level <= 25) return 'Striver'
  if (level <= 30) return 'Warrior'
  if (level <= 35) return 'Champion'
  if (level <= 40) return 'Master'
  if (level <= 45) return 'Legend'
  return 'Ascendant'
}

// ─── Max Level ──────────────────────────────────

export const MAX_LEVEL = 50
export const ATTRIBUTE_MAX = 50

// ─── Rank System ────────────────────────────────

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SSS'

export interface RankInfo {
  rank: Rank
  minLevel: number
  maxLevel: number
  title: string
  description: string
}

export const RANK_TABLE: RankInfo[] = [
  { rank: 'E', minLevel: 1,  maxLevel: 9,  title: 'Awakened',         description: 'App access, basic quests, D-rank Dungeons' },
  { rank: 'D', minLevel: 10, maxLevel: 19, title: 'Pathfinder',       description: 'Guild creation, C-rank Dungeons, friend challenges' },
  { rank: 'C', minLevel: 20, maxLevel: 29, title: 'Vanguard',         description: 'A-rank Dungeons, guild raids, Accountability Pacts' },
  { rank: 'B', minLevel: 30, maxLevel: 39, title: 'Elite',            description: 'Weekly Boss access, advanced AI skills' },
  { rank: 'A', minLevel: 40, maxLevel: 49, title: 'Master',           description: 'S-rank Raids, Guild Master eligibility, leaderboard prestige' },
  { rank: 'S', minLevel: 50, maxLevel: 50, title: 'Ascendant',        description: 'Final known rank. Legendary badge. Permanent profile frame.' },
  { rank: 'SSS', minLevel: 99, maxLevel: 99, title: 'System Architect', description: 'Unknown. Not documented. Discovered in-game only.' },
]

/**
 * Get the rank for a given level
 */
export function getRank(level: number): RankInfo {
  for (let i = RANK_TABLE.length - 1; i >= 0; i--) {
    if (level >= RANK_TABLE[i].minLevel) return RANK_TABLE[i]
  }
  return RANK_TABLE[0]
}

/**
 * Get the rank letter for a given level
 */
export function getRankLetter(level: number): Rank {
  return getRank(level).rank
}

// ─── HP System ──────────────────────────────────

export type HpState = 'healthy' | 'weakened' | 'critical' | 'collapse'

export const HP_BASE = 100
export const HP_PER_VIT = 15

export const HP_STATE_THRESHOLDS: { state: HpState; minPercent: number; maxPercent: number; xpModifier: number; label: string }[] = [
  { state: 'healthy',  minPercent: 61,  maxPercent: 100, xpModifier: 1.0,  label: 'Healthy' },
  { state: 'weakened', minPercent: 31,  maxPercent: 60,  xpModifier: 0.85, label: 'Weakened' },
  { state: 'critical', minPercent: 11,  maxPercent: 30,  xpModifier: 0.70, label: 'Critical' },
  { state: 'collapse', minPercent: 0,   maxPercent: 10,  xpModifier: 0.50, label: 'Collapse' },
]

export const HP_DAMAGE = {
  MISSED_DAILY_HABIT: 5,           // per habit, capped at 20/day
  MISSED_HABIT_DAILY_CAP: 20,
  BROKEN_7DAY_STREAK: 15,
  BROKEN_30DAY_STREAK: 30,
  INACTIVITY_48H: 30,
  INACTIVITY_72H: 50,
} as const

export const HP_RECOVERY = {
  PERFECT_DAY: 20,
  RECOVERY_TASK: 15,
  RECOVERY_QUEST: 35,
  RESTORE_7DAY_STREAK: 25,
  GUILD_HP_GIFT: 10,
  WATER_FULL: 5,
  SLEEP_7PLUS: 5,
} as const

/**
 * Calculate max HP based on VIT attribute
 */
export function calculateMaxHp(vit: number): number {
  return HP_BASE + (HP_PER_VIT * vit)
}

/**
 * Calculate HP damage reduction based on VIT
 * Every 3 VIT points reduces incoming damage by 10%
 */
export function calculateHpDamageReduction(vit: number): number {
  return Math.floor(vit / 3) * 0.10
}

/**
 * Get HP state based on current HP / max HP ratio
 */
export function getHpState(hp: number, maxHp: number): HpState {
  const percent = maxHp > 0 ? (hp / maxHp) * 100 : 0
  for (const threshold of HP_STATE_THRESHOLDS) {
    if (percent >= threshold.minPercent && percent <= threshold.maxPercent) {
      return threshold.state
    }
  }
  return 'collapse'
}

/**
 * Get the XP modifier for a given HP state
 */
export function getXpModifier(hpState: HpState): number {
  const entry = HP_STATE_THRESHOLDS.find(t => t.state === hpState)
  return entry?.xpModifier ?? 1.0
}

// ─── Attribute System ───────────────────────────

export type AttributeKey = 'str' | 'int' | 'agi' | 'vit' | 'cha'

export interface AttributeInfo {
  key: AttributeKey
  name: string
  domain: string
  primaryBonus: string
  color: string
}

export const ATTRIBUTES: AttributeInfo[] = [
  { key: 'str', name: 'Strength',     domain: 'Physical development',       primaryBonus: '+2% XP from physical actions per point', color: 'text-red-400' },
  { key: 'int', name: 'Intelligence', domain: 'Mental development',         primaryBonus: '+2% XP from learning actions per point', color: 'text-cyan-400' },
  { key: 'agi', name: 'Agility',      domain: 'Discipline & consistency',   primaryBonus: '+1 AiCoin passive regen/day per point',  color: 'text-blue-300' },
  { key: 'vit', name: 'Vitality',     domain: 'Health & recovery',          primaryBonus: '+15 max HP per point',                   color: 'text-green-400' },
  { key: 'cha', name: 'Charisma',     domain: 'Social influence & style',   primaryBonus: '+5% bonus Guild XP per point',           color: 'text-purple-400' },
]

// ─── Attribute XP Bonus ─────────────────────────
//
// Single source of truth. Previously GamificationService used 2%,
// TaskEconomyService used 0.5%, and the docs above claimed 5% — so the
// same action was worth different XP depending on which code path ran.

export const XP_ATTRIBUTE_BONUS_PER_POINT = 0.02

/**
 * Maps an action/category label to the attribute that boosts its XP.
 * Accepts both the `actionType` vocabulary used by GamificationService
 * ('workout', 'skill', 'learning') and the task `category` vocabulary
 * used by TaskEconomyService ('fitness', 'skills').
 */
const XP_ACTION_ATTRIBUTE: Record<string, AttributeKey> = {
  workout: 'str',
  fitness: 'str',
  skill: 'int',
  skills: 'int',
  learning: 'int',
}

export function getAttributeForAction(actionType?: string | null): AttributeKey | null {
  if (!actionType) return null
  return XP_ACTION_ATTRIBUTE[actionType.toLowerCase()] ?? null
}

/**
 * Apply the attribute multiplier to a base XP amount.
 * Returns baseXp unchanged when the action maps to no attribute.
 */
export function applyAttributeXpBonus(
  baseXp: number,
  actionType: string | null | undefined,
  attributes: Partial<Record<AttributeKey, number>>
): number {
  const key = getAttributeForAction(actionType)
  if (!key) return baseXp
  const points = attributes[key] ?? 0
  return Math.floor(baseXp * (1 + points * XP_ATTRIBUTE_BONUS_PER_POINT))
}

/** Attribute auto-gain thresholds */
export const ATTRIBUTE_GAIN_THRESHOLDS = {
  str: { action: 'workout_sessions', perPoint: 10 },
  int: { action: 'skill_session_hours', perPoint: 20 },
  agi: { action: 'streaks_maintained_7day', perPoint: 1 },
  vit: { action: 'water_sleep_logging_days', perPoint: 14 },
  cha: { action: 'guild_or_challenge_activities', perPoint: 5 },
} as const

// ─── Dungeon System ─────────────────────────────

export type DungeonTier = 'D' | 'C' | 'A' | 'S'

export interface DungeonTierInfo {
  tier: DungeonTier
  name: string
  minLevel: number
  durationHours: number
  minHp: number
  xpReward: number
  coinReward: number
  players: string
  frequency: string
}

export const DUNGEON_TIERS: DungeonTierInfo[] = [
  { tier: 'D', name: 'D-Rank Gate',  minLevel: 1,  durationHours: 24,  minHp: 0,  xpReward: 200,  coinReward: 20,  players: 'Solo',              frequency: 'Daily at 6:00 AM' },
  { tier: 'C', name: 'C-Rank Gate',  minLevel: 10, durationHours: 48,  minHp: 50, xpReward: 350,  coinReward: 40,  players: 'Solo or Duo',       frequency: 'Monday & Thursday' },
  { tier: 'A', name: 'A-Rank Gate',  minLevel: 25, durationHours: 72,  minHp: 60, xpReward: 600,  coinReward: 80,  players: 'Guild (3+ members)', frequency: 'Monday' },
  { tier: 'S', name: 'S-Rank Raid',  minLevel: 40, durationHours: 168, minHp: 70, xpReward: 1200, coinReward: 200, players: 'Guild (5+ members)', frequency: '1st of month' },
]

// ─── XP Rewards ─────────────────────────────────

export const XP_REWARDS = {
  // Tasks
  TASK_LOW: 5,
  TASK_MEDIUM: 10,
  TASK_HIGH: 20,
  TASK_CRITICAL: 35,
  // Habits & Fitness
  HABIT: 5,
  WORKOUT_SESSION: 25,
  SKILL_SESSION_PER_30MIN: 15,
  SKILL_MILESTONE: 50,
  BODY_PHOTO: 5,
  OUTFIT_LOG: 5,
  PERFECT_DAY: 50,
  // Quests
  DAILY_QUEST: { min: 50, max: 100 },
  WEEKLY_QUEST: { min: 150, max: 300 },
  MONTHLY_QUEST: { min: 500, max: 1000 },
  // Dungeons
  DUNGEON_D: 200,
  DUNGEON_C: 350,
  DUNGEON_A: 600,
  DUNGEON_S: 1200,
  // Streaks
  STREAK_7: 100,
  STREAK_14: 200,
  STREAK_30: 500,
  STREAK_100: 2000,
  // Social
  GUILD_COOP_BONUS: 0.20, // 20% bonus
  WEEKLY_BOSS: 400,
  CHALLENGE_WIN: 200,
  CHALLENGE_PARTICIPATE: 50,
} as const

// ─── AiCoin Economy ─────────────────────────────

export const AICOIN_EARN = {
  DAILY_LOGIN: 5,
  TASK_LOW: 1,
  TASK_HIGH: 3,
  DAILY_QUEST: { min: 10, max: 20 },
  WEEKLY_QUEST: { min: 25, max: 50 },
  STREAK_7: 20,
  STREAK_30: 100,
  WEEKLY_BOSS_CLEAR: 50,
  WEEKLY_SUMMARY_REVIEW: 5,
  INVITE_FRIEND: 30,
  LEVEL_UP: 50,
} as const

export const AICOIN_SPEND = {
  AI_CHAT_MESSAGE: 1,
  AI_AUTO_SCHEDULE: 5,
  AI_ANALYSIS_REPORT: 10,
  AI_SKILL_ROADMAP: 15,
  DUNGEON_REROLL: 10,
  QUEST_SHIFT: 8,
  GUILD_BUFF: 25,
  STREAK_FREEZE: 15,
} as const

export const AICOIN_DAILY_CAP = {
  FREE: 20,
  PRO: 200,
} as const

// ─── Streak System ──────────────────────────────

export interface StreakMilestone {
  days: number
  name: string
  badgeSlug: string
  xpReward: number
  coinReward: number
  hasSystemCache: boolean
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3,   name: 'Hot Start',         badgeSlug: 'hot_start',         xpReward: 0,    coinReward: 0,   hasSystemCache: false },
  { days: 7,   name: 'Week Warrior',      badgeSlug: 'week_warrior',      xpReward: 100,  coinReward: 20,  hasSystemCache: false },
  { days: 14,  name: 'Two Weeks Strong',   badgeSlug: 'two_weeks_strong',  xpReward: 200,  coinReward: 50,  hasSystemCache: false },
  { days: 30,  name: 'Monthly Master',     badgeSlug: 'monthly_master',    xpReward: 500,  coinReward: 100, hasSystemCache: true },
  { days: 60,  name: 'Dedication',         badgeSlug: 'dedication',        xpReward: 1000, coinReward: 200, hasSystemCache: true },
  { days: 100, name: 'Century',            badgeSlug: 'century',           xpReward: 2000, coinReward: 500, hasSystemCache: true },
]

// ─── Streak Freeze ──────────────────────────────

export const STREAK_FREEZE = {
  FREE_PER_WEEK: 1,
  PRO_PER_WEEK: 3,
  EXTRA_COST: 15, // AiCoins
} as const
