// Row shapes as stored in Supabase (and therefore in the local cache).
// Mirrors web/src/lib/hooks/use{Dailies,Habits,Todos}.ts and web/src/types/money.ts.

import type { Difficulty, Priority, ResetType } from '@/lib/gamification'

export type Category = 'general' | 'fitness' | 'skills' | 'style' | 'system'

export interface Daily {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: Priority
  category: Category
  source: string
  repeat_type: 'daily' | 'weekly'
  repeat_days: string[] | null
  scheduled_time: string | null
  expires_on: string | null
  subtasks: { title: string; is_completed: boolean }[]
  require_all_subtasks: boolean
  is_completed: boolean
  completed_at: string | null
  current_streak?: number
  longest_streak?: number
  xp_reward: number
  xp_penalty: number
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  title: string
  description: string | null
  category: Category
  source: string
  reset_type: ResetType
  is_positive: boolean
  is_negative: boolean
  difficulty: Difficulty
  is_indefinite: boolean
  end_date: string | null
  current_streak: number
  longest_streak: number
  is_completed_this_cycle: boolean
  completed_at: string | null
  xp_reward: number
  hp_penalty: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type GoalDifficulty = 'easy' | 'medium' | 'hard'
export type GoalStatus = 'active' | 'completed' | 'failed'

/** A goal with a strict deadline (web/src/lib/goals.service.ts). */
export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_value: number
  current_value: number
  unit: string | null
  deadline: string
  difficulty: GoalDifficulty
  xp_reward: number
  hp_penalty: number
  status: GoalStatus
  completed_at: string | null
  failed_at: string | null
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: Priority
  category: Category
  source: string
  due_date: string | null
  scheduled_time: string | null
  scheduled_start?: string | null
  scheduled_end?: string | null
  subtasks: { title: string; is_completed: boolean }[]
  require_all_subtasks: boolean
  is_completed: boolean
  completed_at: string | null
  xp_reward: number
  xp_penalty: number
  created_at: string
}

export interface PomodoroSession {
  id: string
  user_id: string
  task_id: string | null
  duration_minutes: number
  break_minutes: number
  status: 'active' | 'completed' | 'cancelled'
  started_at: string
  completed_at: string | null
}

export type AccountType = 'cash' | 'bank' | 'card' | 'investment' | 'other'
export type TransactionType = 'income' | 'expense' | 'transfer'

export interface MoneyAccount {
  id: string
  user_id: string
  name: string
  type: AccountType
  currency: string
  opening_balance: number
  color: string | null
  icon: string | null
  is_active: boolean
  sort_order: number | null
  created_at: string
}

export interface MoneyCategory {
  id: string
  user_id: string | null
  name: string
  kind: 'income' | 'expense'
  icon: string | null
  color: string | null
  is_active: boolean
}

export interface MoneyTransaction {
  id: string
  user_id: string
  account_id: string | null
  to_account_id: string | null
  category_id: string | null
  type: TransactionType
  amount: number
  currency: string
  note: string | null
  occurred_at: string
  xp_earned: number | null
  recurring_id: string | null
  created_at: string
}

export interface MoneyBudget {
  id: string
  user_id: string
  category_id: string
  month: string
  limit_amount: number
}

export interface MoneyRecurring {
  id: string
  user_id: string
  account_id: string | null
  category_id: string | null
  name: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  cadence: 'weekly' | 'monthly' | 'yearly'
  next_due: string
  auto_post: boolean
  is_active: boolean
  last_posted_at: string | null
}

export interface MoneyGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: string
  target_date: string | null
  color: string | null
  is_achieved: boolean
}

export interface Profile {
  id: string
  username: string
  display_name: string | null
  level: number
  xp: number
  xp_to_next_level: number
  total_xp: number
  ai_coins: number
  hp: number
  max_hp: number
  rank: string
  stat_points: number
  attr_str: number
  attr_int: number
  attr_agi: number
  attr_vit: number
  attr_cha: number
  streak_overall: number
  streak_best: number
  streak_freeze_count: number
  streak_habits?: number
  streak_tasks?: number
  onboarding_done: boolean
}
