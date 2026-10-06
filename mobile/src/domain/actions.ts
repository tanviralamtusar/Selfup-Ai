import { randomUUID } from 'expo-crypto'

import { getRecord, patchRecord, putRecord, removeRecord } from '@/db/records'
import { localDay } from '@/lib/dates'
import {
  dailyXp,
  habitHpPenalty,
  habitXp,
  GOAL_REWARDS,
  MONEY_XP,
  todoXp,
  type Difficulty,
  type Priority,
  type ResetType,
} from '@/lib/gamification'
import { getCurrentUserId } from '@/sync/engine'
import { commitLocal } from '@/sync/outbox'
import type {
  Daily,
  Goal,
  GoalDifficulty,
  Habit,
  MoneyAccount,
  MoneyBudget,
  MoneyGoal,
  MoneyRecurring,
  MoneyTransaction,
  PomodoroSession,
  Todo,
  TransactionType,
} from './types'

/**
 * Every user action: write the optimistic result to the local store and queue
 * the matching /api call, atomically. Works the same online or offline — the
 * sync engine sends the queue whenever it can. Ids are generated here and
 * accepted by the server, so later ops (complete, delete) can refer to rows
 * created offline.
 */

const now = () => new Date().toISOString()

// ── Dailies ──────────────────────────────────────────────────

export interface NewDaily {
  title: string
  priority?: Priority
  repeat_type?: 'daily' | 'weekly'
  repeat_days?: string[]
  /** Reminder time "HH:MM" (local), or null for none. */
  scheduled_time?: string | null
}

export async function createDaily(input: NewDaily) {
  const id = randomUUID()
  const priority = input.priority ?? 'medium'
  const repeat_type = input.repeat_type ?? 'daily'
  const body = {
    id,
    title: input.title.trim(),
    priority,
    repeat_type,
    repeat_days: repeat_type === 'weekly' ? input.repeat_days : undefined,
    scheduled_time: input.scheduled_time || undefined,
  }
  const row: Daily = {
    id,
    user_id: getCurrentUserId(),
    title: body.title,
    description: null,
    priority,
    category: 'general',
    source: 'user',
    repeat_type,
    repeat_days: repeat_type === 'weekly' ? input.repeat_days ?? [] : null,
    scheduled_time: input.scheduled_time || null,
    expires_on: null,
    subtasks: [],
    require_all_subtasks: false,
    is_completed: false,
    completed_at: null,
    current_streak: 0,
    longest_streak: 0,
    ...dailyXp(priority),
    created_at: now(),
  }
  await commitLocal((t) => putRecord('dailies', row, t), {
    kind: 'daily.create', tbl: 'dailies', entityId: id, method: 'POST', path: '/api/dailies', body,
  })
}

export async function completeDaily(daily: Daily) {
  await commitLocal(
    async (t) => {
      await patchRecord<Daily>('dailies', daily.id, { is_completed: true, completed_at: now() }, t)
    },
    {
      kind: 'daily.complete', tbl: 'dailies', entityId: daily.id, method: 'POST',
      path: `/api/dailies/${daily.id}/complete`, body: { date: localDay() },
      actionDate: localDay(), xpHint: daily.xp_reward,
    }
  )
}

export async function deleteDaily(id: string) {
  await commitLocal((t) => removeRecord('dailies', id, t), {
    kind: 'daily.delete', tbl: 'dailies', entityId: id, method: 'DELETE', path: `/api/dailies/${id}`,
  })
}

// ── Habits ───────────────────────────────────────────────────

export interface NewHabit {
  title: string
  difficulty?: Difficulty
  reset_type?: ResetType
  /** Last day the habit runs (YYYY-MM-DD); omit for an indefinite habit. */
  end_date?: string | null
}

export async function createHabit(input: NewHabit) {
  const id = randomUUID()
  const difficulty = input.difficulty ?? 'medium'
  const reset_type = input.reset_type ?? 'daily'
  const end_date = input.end_date || null
  const body = { id, title: input.title.trim(), difficulty, reset_type, is_indefinite: !end_date, end_date: end_date ?? undefined }
  const row: Habit = {
    id,
    user_id: getCurrentUserId(),
    title: body.title,
    description: null,
    category: 'general',
    source: 'user',
    reset_type,
    is_positive: true,
    is_negative: false,
    difficulty,
    is_indefinite: !end_date,
    end_date,
    current_streak: 0,
    longest_streak: 0,
    is_completed_this_cycle: false,
    completed_at: null,
    xp_reward: habitXp(difficulty),
    hp_penalty: habitHpPenalty(reset_type),
    is_active: true,
    created_at: now(),
    updated_at: now(),
  }
  await commitLocal((t) => putRecord('habits', row, t), {
    kind: 'habit.create', tbl: 'habits', entityId: id, method: 'POST', path: '/api/habits', body,
  })
}

export async function logHabit(habit: Habit) {
  const streak = (habit.current_streak ?? 0) + 1
  await commitLocal(
    async (t) => {
      await patchRecord<Habit>('habits', habit.id, {
        is_completed_this_cycle: true,
        completed_at: now(),
        current_streak: streak,
        longest_streak: Math.max(streak, habit.longest_streak ?? 0),
      }, t)
    },
    {
      kind: 'habit.log', tbl: 'habits', entityId: habit.id, method: 'POST',
      path: `/api/habits/${habit.id}/log`, body: { date: localDay() },
      actionDate: localDay(), xpHint: habit.xp_reward,
    }
  )
}

export async function deleteHabit(id: string) {
  await commitLocal((t) => removeRecord('habits', id, t), {
    kind: 'habit.delete', tbl: 'habits', entityId: id, method: 'DELETE', path: `/api/habits/${id}`,
  })
}

// ── Goals (strict deadline) ──────────────────────────────────

export interface NewGoal {
  title: string
  /** How much counts as done (1 for a yes/no goal). */
  target_value: number
  unit?: string | null
  /** Last day to reach the target (YYYY-MM-DD, phone-local). */
  deadline: string
  difficulty: GoalDifficulty
}

export async function createDeadlineGoal(input: NewGoal) {
  const id = randomUUID()
  const reward = GOAL_REWARDS[input.difficulty]
  const body = {
    id,
    title: input.title.trim(),
    target_value: input.target_value,
    unit: input.unit?.trim() || null,
    deadline: input.deadline,
    difficulty: input.difficulty,
  }
  const row: Goal = {
    ...body,
    user_id: getCurrentUserId(),
    description: null,
    current_value: 0,
    xp_reward: reward.xp,
    hp_penalty: reward.hpPenalty,
    status: 'active',
    completed_at: null,
    failed_at: null,
    created_at: now(),
    updated_at: now(),
  }
  await commitLocal((t) => putRecord('goals', row, t), {
    kind: 'goals.create', tbl: 'goals', entityId: id, method: 'POST', path: '/api/goals', body,
  })
}

/** Add progress to a goal; reaching the target completes it (XP when it syncs). */
export async function addGoalProgress(goal: Goal, amount: number) {
  const current = Math.max(0, Number(goal.current_value) + amount)
  const done = current >= Number(goal.target_value)
  await commitLocal(
    async (t) => {
      await patchRecord<Goal>('goals', goal.id, {
        current_value: current,
        ...(done ? { status: 'completed' as const, completed_at: now() } : {}),
        updated_at: now(),
      }, t)
    },
    {
      kind: 'goals.progress', tbl: 'goals', entityId: goal.id, method: 'PATCH',
      path: `/api/goals/${goal.id}`, body: { title: goal.title, progress: amount, date: localDay() },
      xpHint: done ? goal.xp_reward : 0,
    }
  )
}

export async function deleteDeadlineGoal(id: string) {
  await commitLocal((t) => removeRecord('goals', id, t), {
    kind: 'goals.delete', tbl: 'goals', entityId: id, method: 'DELETE', path: `/api/goals/${id}`,
  })
}

// ── To-dos ───────────────────────────────────────────────────

export interface NewTodo {
  title: string
  priority?: Priority
  due_date?: string | null
  /** Reminder time "HH:MM" (local) on the due date, or null for none. */
  scheduled_time?: string | null
}

export async function createTodo(input: NewTodo) {
  const id = randomUUID()
  const priority = input.priority ?? 'medium'
  const due_date = input.due_date || null
  const scheduled_time = due_date ? input.scheduled_time || null : null
  const body = { id, title: input.title.trim(), priority, due_date: due_date ?? undefined, scheduled_time: scheduled_time ?? undefined }
  const row: Todo = {
    id,
    user_id: getCurrentUserId(),
    title: body.title,
    description: null,
    priority,
    category: 'general',
    source: 'user',
    due_date,
    scheduled_time,
    subtasks: [],
    require_all_subtasks: false,
    is_completed: false,
    completed_at: null,
    ...todoXp(priority, Boolean(due_date)),
    created_at: now(),
  }
  await commitLocal((t) => putRecord('todos', row, t), {
    kind: 'todo.create', tbl: 'todos', entityId: id, method: 'POST', path: '/api/todos', body,
  })
}

export async function completeTodo(todo: Todo) {
  await commitLocal(
    async (t) => {
      await patchRecord<Todo>('todos', todo.id, { is_completed: true, completed_at: now() }, t)
    },
    {
      kind: 'todo.complete', tbl: 'todos', entityId: todo.id, method: 'POST',
      path: `/api/todos/${todo.id}/complete`, body: {}, xpHint: todo.xp_reward,
    }
  )
}

export async function deleteTodo(id: string) {
  await commitLocal((t) => removeRecord('todos', id, t), {
    kind: 'todo.delete', tbl: 'todos', entityId: id, method: 'DELETE', path: `/api/todos/${id}`,
  })
}

// ── Pomodoro ─────────────────────────────────────────────────

export async function startPomodoro(opts: { duration: number; breakMinutes: number; taskId?: string | null }) {
  const id = randomUUID()
  const started_at = now()
  const row: PomodoroSession = {
    id,
    user_id: getCurrentUserId(),
    task_id: opts.taskId ?? null,
    duration_minutes: opts.duration,
    break_minutes: opts.breakMinutes,
    status: 'active',
    started_at,
    completed_at: null,
  }
  await commitLocal((t) => putRecord('pomodoro_sessions', row, t), {
    kind: 'pomodoro.start', tbl: 'pomodoro_sessions', entityId: id, method: 'POST', path: '/api/pomodoro',
    body: { id, task_id: row.task_id, duration_minutes: opts.duration, break_minutes: opts.breakMinutes, started_at },
  })
  return id
}

/** `at` lets a session that ran out while the app was closed record its real end time. */
export async function finishPomodoro(id: string, action: 'complete' | 'cancel', at?: string) {
  const session = await getRecord<PomodoroSession>('pomodoro_sessions', id)
  if (!session || session.status !== 'active') return
  const completed_at = at ?? now()
  await commitLocal(
    async (t) => {
      await patchRecord<PomodoroSession>('pomodoro_sessions', id, {
        status: action === 'complete' ? 'completed' : 'cancelled',
        completed_at,
      }, t)
    },
    {
      kind: 'pomodoro.finish', tbl: 'pomodoro_sessions', entityId: id, method: 'PATCH', path: '/api/pomodoro',
      body: { session_id: id, action, completed_at },
      xpHint: action === 'complete' ? (session?.duration_minutes ?? 25) + 5 : 0,
    }
  )
}

// ── Money ────────────────────────────────────────────────────

export async function createAccount(input: { name: string; type: MoneyAccount['type']; currency: string; opening_balance: number }) {
  const id = randomUUID()
  const body = { id, ...input, name: input.name.trim() }
  const row: MoneyAccount = {
    id,
    user_id: getCurrentUserId(),
    name: body.name,
    type: input.type,
    currency: input.currency,
    opening_balance: input.opening_balance,
    color: '#9c7ef0',
    icon: 'wallet',
    is_active: true,
    sort_order: 0,
    created_at: now(),
  }
  await commitLocal((t) => putRecord('money_accounts', row, t), {
    kind: 'account.create', tbl: 'money_accounts', entityId: id, method: 'POST', path: '/api/money/accounts', body,
  })
}

export interface NewTransaction {
  type: TransactionType
  amount: number
  account_id: string | null
  to_account_id?: string | null
  category_id: string | null
  note?: string
  occurred_at?: string
  currency: string
}

export async function createTransaction(input: NewTransaction) {
  const id = randomUUID()
  const occurred_at = input.occurred_at ?? localDay()
  const body = {
    id,
    type: input.type,
    amount: input.amount,
    account_id: input.account_id,
    to_account_id: input.type === 'transfer' ? input.to_account_id ?? null : null,
    category_id: input.type === 'transfer' ? null : input.category_id,
    note: input.note?.trim() || null,
    occurred_at,
    currency: input.currency,
  }
  const row: MoneyTransaction = {
    ...body,
    user_id: getCurrentUserId(),
    xp_earned: input.type === 'transfer' ? 0 : MONEY_XP.transaction,
    recurring_id: null,
    created_at: now(),
  }
  await commitLocal((t) => putRecord('money_transactions', row, t), {
    kind: 'txn.create', tbl: 'money_transactions', entityId: id, method: 'POST', path: '/api/money/transactions', body,
    xpHint: row.xp_earned ?? 0,
  })
}

export async function deleteTransaction(id: string) {
  await commitLocal((t) => removeRecord('money_transactions', id, t), {
    kind: 'txn.delete', tbl: 'money_transactions', entityId: id, method: 'DELETE', path: `/api/money/transactions/${id}`,
  })
}

export async function setBudget(existing: MoneyBudget | null, categoryId: string, month: string, limit: number) {
  const id = existing?.id ?? randomUUID()
  const row: MoneyBudget = { id, user_id: getCurrentUserId(), category_id: categoryId, month, limit_amount: limit }
  await commitLocal((t) => putRecord('money_budgets', row, t), {
    kind: 'budget.set', tbl: 'money_budgets', entityId: id, method: 'POST', path: '/api/money/budgets',
    body: { category_id: categoryId, month, limit_amount: limit },
  })
}

export async function deleteBudget(id: string) {
  await commitLocal((t) => removeRecord('money_budgets', id, t), {
    kind: 'budget.delete', tbl: 'money_budgets', entityId: id, method: 'DELETE', path: `/api/money/budgets?id=${id}`,
  })
}

export async function createGoal(input: { name: string; target_amount: number; currency: string; target_date?: string | null }) {
  const id = randomUUID()
  const body = { id, name: input.name.trim(), target_amount: input.target_amount, currency: input.currency, target_date: input.target_date ?? null }
  const row: MoneyGoal = {
    ...body,
    user_id: getCurrentUserId(),
    current_amount: 0,
    color: '#5db8a0',
    is_achieved: false,
  }
  await commitLocal((t) => putRecord('money_goals', row, t), {
    kind: 'goal.create', tbl: 'money_goals', entityId: id, method: 'POST', path: '/api/money/goals', body,
  })
}

export async function contributeToGoal(goal: MoneyGoal, amount: number) {
  const current = Math.max(0, Number(goal.current_amount) + amount)
  const achieved = current >= Number(goal.target_amount)
  const justAchieved = achieved && !goal.is_achieved
  await commitLocal(
    async (t) => {
      await patchRecord<MoneyGoal>('money_goals', goal.id, { current_amount: current, is_achieved: achieved }, t)
    },
    {
      kind: 'goal.contribute', tbl: 'money_goals', entityId: goal.id, method: 'PATCH',
      path: `/api/money/goals/${goal.id}`, body: { contribute: amount },
      xpHint: amount > 0 ? MONEY_XP.goalContribution + (justAchieved ? MONEY_XP.goalCompleted : 0) : 0,
    }
  )
}

export async function deleteGoal(id: string) {
  await commitLocal((t) => removeRecord('money_goals', id, t), {
    kind: 'goal.delete', tbl: 'money_goals', entityId: id, method: 'DELETE', path: `/api/money/goals/${id}`,
  })
}

function advance(dateIso: string, cadence: MoneyRecurring['cadence']): string {
  const d = new Date(`${dateIso}T00:00:00Z`)
  if (cadence === 'weekly') d.setUTCDate(d.getUTCDate() + 7)
  else if (cadence === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

/** Post a recurring bill/income now (mirrors POST /api/money/recurring/[id]/post). */
export async function postRecurring(rule: MoneyRecurring) {
  const tempTxnId = randomUUID()
  const today = localDay()
  const txn: MoneyTransaction = {
    id: tempTxnId,
    user_id: getCurrentUserId(),
    account_id: rule.account_id,
    to_account_id: null,
    category_id: rule.category_id,
    type: rule.type,
    amount: Number(rule.amount),
    currency: rule.currency,
    note: rule.name,
    occurred_at: today,
    xp_earned: 0,
    recurring_id: rule.id,
    created_at: now(),
  }
  await commitLocal(
    async (t) => {
      await putRecord('money_transactions', txn, t)
      await patchRecord<MoneyRecurring>('money_recurring', rule.id, { next_due: advance(rule.next_due, rule.cadence), last_posted_at: today }, t)
    },
    {
      kind: 'recurring.post', tbl: 'money_recurring', entityId: rule.id, method: 'POST',
      path: `/api/money/recurring/${rule.id}/post`, body: { _tempTxnId: tempTxnId },
    },
    ['money_transactions']
  )
}
