// ─── App Constants ───────────────────────────────

export const APP_NAME = 'SelfUp'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'
export const APP_DESCRIPTION = 'AI-powered self-improvement platform'

// ─── AI Coin Costs ──────────────────────────────

export const AI_COIN_COSTS = {
  CHAT_MESSAGE: 1,
  AUTO_SCHEDULE: 5,
  ANALYSIS_REPORT: 10,
  SKILL_ROADMAP: 15,
  MEAL_CHART: 10,
  WORKOUT_PLAN: 10,
  ONBOARDING: 0,
  MORNING_CHECKIN: 0,
  WEEKLY_SUMMARY: 0,
} as const

// ─── AI Coin Earn ───────────────────────────────

export const AI_COIN_EARN = {
  DAILY_LOGIN: 5,
  COMPLETE_TASK: 1,
  COMPLETE_HIGH_TASK: 3,
  COMPLETE_CRITICAL_TASK: 5,
  COMPLETE_HABIT: 1,
  COMPLETE_WORKOUT: 3,
  COMPLETE_SKILL_SESSION: 2,
  STREAK_7_DAY: 20,
  STREAK_30_DAY: 50,
  DAILY_PHOTO: 2,
  REVIEW_SUMMARY: 5,
  LEVEL_UP: 10,
} as const

// ─── Daily Limits ───────────────────────────────

export const COIN_LIMITS = {
  FREE_DAILY_GRANT: 20,
  FREE_MAX_EARNABLE: 30,
  FREE_DAILY_CAP: 50,
  PRO_DAILY_GRANT: 50,
  PRO_MAX_EARNABLE: 100,
  PRO_DAILY_CAP: 200,
} as const

// ─── Category Colors ────────────────────────────

export const CATEGORY_COLORS = {
  fitness: '#34D399',
  skills: '#60A5FA',
  time: '#FBBF24',
  style: '#F472B6',
} as const

export type Category = keyof typeof CATEGORY_COLORS
