export const ROUTES = {
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',

  // Onboarding
  ONBOARDING: '/onboarding',

  // Main
  DASHBOARD: '/dashboard',
  CHAT: '/chat',

  // Modules
  FITNESS: '/fitness',
  FITNESS_WORKOUT: '/fitness/workout',
  FITNESS_NUTRITION: '/fitness/nutrition',
  SKILLS: '/skills',
  SKILL_DETAIL: '/skills/:skillId',
  TIME: '/time',
  TIME_CALENDAR: '/time/calendar',
  STYLE: '/style',

  // Gamification
  QUESTS: '/quests',
  LEADERBOARD: '/social/leaderboard',
  FRIENDS: '/social/friends',
  PUBLIC_PROFILE: '/u/:username',

  // Settings
  SETTINGS: '/settings',
} as const
