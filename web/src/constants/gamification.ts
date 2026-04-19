// ─── XP & Level System ──────────────────────────

/**
 * XP required to reach the next level (exponential curve)
 */
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
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

// ─── XP Rewards ─────────────────────────────────

export const XP_REWARDS = {
  TASK_LOW: 5,
  TASK_MEDIUM: 10,
  TASK_HIGH: 20,
  TASK_CRITICAL: 35,
  HABIT: 5,
  WORKOUT_SESSION: 25,
  SKILL_SESSION_PER_30MIN: 15,
  SKILL_MILESTONE: 50,
  BODY_PHOTO: 5,
  OUTFIT_LOG: 5,
  DAILY_QUEST: { min: 50, max: 100 },
  WEEKLY_QUEST: { min: 150, max: 300 },
  CHALLENGE_WIN: 200,
  CHALLENGE_PARTICIPATE: 50,
  STREAK_7: 100,
  STREAK_14: 200,
  STREAK_30: 500,
  STREAK_100: 2000,
} as const

// ─── Max Level ──────────────────────────────────

export const MAX_LEVEL = 50
