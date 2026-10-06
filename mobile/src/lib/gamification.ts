// Display-side mirror of web/src/constants/gamification.ts and the XP tables in
// web/src/lib/task-economy.service.ts. The server stays authoritative: these
// only pre-fill rows created offline and label the UI. Keep in sync.

export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard'
export type ResetType = 'daily' | 'weekly' | 'monthly'

const DAILY_XP_REWARD: Record<Priority, number> = { low: 5, medium: 10, high: 20, critical: 35 }
const DAILY_XP_PENALTY: Record<Priority, number> = { low: 3, medium: 5, high: 10, critical: 50 }
const TODO_XP_REWARD: Record<Priority, number> = { low: 5, medium: 10, high: 20, critical: 35 }
const TODO_XP_PENALTY: Record<Priority, number> = { low: 5, medium: 10, high: 20, critical: 30 }
const HABIT_HP_PENALTY: Record<ResetType, number> = { daily: 5, weekly: 10, monthly: 15 }

export function dailyXp(priority: Priority) {
  return { xp_reward: DAILY_XP_REWARD[priority], xp_penalty: DAILY_XP_PENALTY[priority] }
}

export function todoXp(priority: Priority, hasDueDate: boolean) {
  return { xp_reward: TODO_XP_REWARD[priority], xp_penalty: hasDueDate ? TODO_XP_PENALTY[priority] : 0 }
}

export function habitXp(difficulty: Difficulty) {
  return difficulty === 'trivial' ? 5 : difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
}

export function habitHpPenalty(reset: ResetType) {
  return HABIT_HP_PENALTY[reset]
}

/** Mirrors GOAL_REWARDS in web/src/constants/gamification.ts. */
export const GOAL_REWARDS = {
  easy: { xp: 25, hpPenalty: 10 },
  medium: { xp: 50, hpPenalty: 20 },
  hard: { xp: 100, hpPenalty: 35 },
} as const

export const MONEY_XP = { transaction: 5, goalContribution: 8, goalCompleted: 25 } as const

const RANKS = [
  { rank: 'E', minLevel: 1, title: 'Awakened' },
  { rank: 'D', minLevel: 10, title: 'Pathfinder' },
  { rank: 'C', minLevel: 20, title: 'Vanguard' },
  { rank: 'B', minLevel: 30, title: 'Elite' },
  { rank: 'A', minLevel: 40, title: 'Master' },
  { rank: 'S', minLevel: 50, title: 'Ascendant' },
] as const

export function getRank(level: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) if (level >= RANKS[i].minLevel) return RANKS[i]
  return RANKS[0]
}

export type HpState = 'healthy' | 'weakened' | 'critical' | 'collapse'

export function getHpState(hp: number, maxHp: number): HpState {
  const pct = maxHp > 0 ? (hp / maxHp) * 100 : 0
  if (pct >= 61) return 'healthy'
  if (pct >= 31) return 'weakened'
  if (pct >= 11) return 'critical'
  return 'collapse'
}

export const ATTRIBUTES = [
  { key: 'str', label: 'Strength', short: 'STR' },
  { key: 'int', label: 'Intelligence', short: 'INT' },
  { key: 'agi', label: 'Agility', short: 'AGI' },
  { key: 'vit', label: 'Vitality', short: 'VIT' },
  { key: 'cha', label: 'Charisma', short: 'CHA' },
] as const
