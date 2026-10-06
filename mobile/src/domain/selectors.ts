import { useMemo } from 'react'

import { useRecords } from '@/db/records'
import { dayOf, localDay, localDayName, monthKey, shiftMonth } from '@/lib/dates'
import type {
  Daily,
  Goal,
  GoalStatus,
  Habit,
  MoneyAccount,
  MoneyBudget,
  MoneyCategory,
  MoneyGoal,
  MoneyRecurring,
  MoneyTransaction,
  Todo,
} from './types'

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

/** Mirrors GET /api/dailies: active today (not expired; weekly only on its days), in the phone's zone. */
export function isDueToday(d: Daily, now = new Date()): boolean {
  const today = localDay(now)
  if (d.expires_on && d.expires_on < today) return false
  if (d.repeat_type === 'weekly' && d.repeat_days) return d.repeat_days.includes(localDayName(now))
  return true
}

/**
 * Done today (phone-local day). The server clears `is_completed` at the
 * new-day check-in; until that runs (e.g. offline past midnight) a tick from
 * the previous day must not count for today.
 */
export function isDailyDoneToday(d: Daily): boolean {
  return d.is_completed && dayOf(d.completed_at) === localDay()
}

export function isHabitDone(h: Habit): boolean {
  if (!h.is_completed_this_cycle) return false
  // Daily habits roll over with the check-in; weekly/monthly keep the server flag.
  return h.reset_type !== 'daily' || dayOf(h.completed_at) === localDay()
}

export function useTodayDailies(): Daily[] {
  const rows = useRecords<Daily>('dailies')
  return useMemo(
    () =>
      rows
        .filter((d) => isDueToday(d))
        .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2) || a.created_at.localeCompare(b.created_at)),
    [rows]
  )
}

export function useHabits(): Habit[] {
  const rows = useRecords<Habit>('habits')
  return useMemo(
    () => rows.filter((h) => h.is_active !== false).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [rows]
  )
}

export function useOpenTodos(): Todo[] {
  const rows = useRecords<Todo>('todos')
  return useMemo(() => {
    const today = localDay()
    return rows
      .filter((t) => !t.is_completed)
      .sort((a, b) => {
        const ao = a.due_date && a.due_date < today ? 0 : 1
        const bo = b.due_date && b.due_date < today ? 0 : 1
        return ao - bo || (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
      })
  }, [rows])
}

// ── Goals ────────────────────────────────────────────────────

/**
 * Status as the user should see it now. A goal past its deadline is failed
 * even before the server has run the check (it does on the next check-in).
 */
export function goalStatus(g: Goal, today = localDay()): GoalStatus {
  if (g.status === 'active' && g.deadline < today) return 'failed'
  return g.status
}

/** Whole days from today until the deadline (0 = due today). */
export function daysLeft(g: Goal, today = localDay()): number {
  const [y1, m1, d1] = today.split('-').map(Number)
  const [y2, m2, d2] = g.deadline.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

/** Active goals first (soonest deadline on top), then finished ones, newest first. */
export function useGoals(): Goal[] {
  const rows = useRecords<Goal>('goals')
  return useMemo(() => {
    const today = localDay()
    const active = rows.filter((g) => goalStatus(g, today) === 'active').sort((a, b) => a.deadline.localeCompare(b.deadline))
    const done = rows
      .filter((g) => goalStatus(g, today) !== 'active')
      .sort((a, b) => b.deadline.localeCompare(a.deadline))
    return [...active, ...done]
  }, [rows])
}

// ── Money ────────────────────────────────────────────────────

const n = (v: unknown) => Number(v) || 0

export interface AccountWithBalance extends MoneyAccount {
  balance: number
}

/** Same formula as GET /api/money/accounts: opening + income − expense ± transfers. */
export function computeBalances(accounts: MoneyAccount[], txns: MoneyTransaction[]): AccountWithBalance[] {
  const delta = new Map<string, number>()
  const add = (id: string | null, v: number) => id && delta.set(id, (delta.get(id) ?? 0) + v)
  for (const t of txns) {
    const amt = n(t.amount)
    if (t.type === 'income') add(t.account_id, amt)
    else if (t.type === 'expense') add(t.account_id, -amt)
    else {
      add(t.account_id, -amt)
      add(t.to_account_id, amt)
    }
  }
  return accounts
    .filter((a) => a.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.created_at.localeCompare(b.created_at))
    .map((a) => ({ ...a, balance: n(a.opening_balance) + (delta.get(a.id) ?? 0) }))
}

export interface MoneyView {
  currency: string
  accounts: AccountWithBalance[]
  categories: MoneyCategory[]
  categoryById: Map<string, MoneyCategory>
  netWorth: number
  monthIncome: number
  monthExpense: number
  monthTxns: MoneyTransaction[]
  byCategory: { id: string | null; name: string; color: string; amount: number }[]
  budgets: (MoneyBudget & { spent: number; category: MoneyCategory | undefined })[]
  goals: MoneyGoal[]
  recurring: MoneyRecurring[]
}

/** Everything the Money tab shows, computed from the local cache so it works offline. */
export function useMoney(month: string = monthKey()): MoneyView {
  const accounts = useRecords<MoneyAccount>('money_accounts')
  const categories = useRecords<MoneyCategory>('money_categories')
  const txns = useRecords<MoneyTransaction>('money_transactions')
  const budgets = useRecords<MoneyBudget>('money_budgets')
  const goals = useRecords<MoneyGoal>('money_goals')
  const recurring = useRecords<MoneyRecurring>('money_recurring')

  return useMemo(() => {
    const withBalance = computeBalances(accounts, txns)
    const categoryById = new Map(categories.map((c) => [c.id, c]))
    const monthEnd = shiftMonth(month, 1)
    const monthTxns = txns
      .filter((t) => t.occurred_at >= month && t.occurred_at < monthEnd)
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.created_at.localeCompare(a.created_at))

    let monthIncome = 0
    let monthExpense = 0
    const spend = new Map<string | null, number>()
    for (const t of monthTxns) {
      if (t.type === 'income') monthIncome += n(t.amount)
      if (t.type === 'expense') {
        monthExpense += n(t.amount)
        spend.set(t.category_id, (spend.get(t.category_id) ?? 0) + n(t.amount))
      }
    }
    const byCategory = [...spend.entries()]
      .map(([id, amount]) => {
        const c = id ? categoryById.get(id) : undefined
        return { id, name: c?.name ?? 'Uncategorized', color: c?.color ?? '#7a7a8a', amount }
      })
      .sort((a, b) => b.amount - a.amount)

    return {
      currency: withBalance[0]?.currency ?? 'USD',
      accounts: withBalance,
      categories: categories.slice().sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
      categoryById,
      netWorth: withBalance.reduce((s, a) => s + a.balance, 0),
      monthIncome,
      monthExpense,
      monthTxns,
      byCategory,
      budgets: budgets
        .filter((b) => b.month === month)
        .map((b) => ({ ...b, limit_amount: n(b.limit_amount), spent: spend.get(b.category_id) ?? 0, category: categoryById.get(b.category_id) })),
      goals: goals
        .map((g) => ({ ...g, current_amount: n(g.current_amount), target_amount: n(g.target_amount) }))
        .sort((a, b) => Number(a.is_achieved) - Number(b.is_achieved)),
      recurring: recurring.filter((r) => r.is_active !== false).sort((a, b) => a.next_due.localeCompare(b.next_due)),
    }
  }, [accounts, categories, txns, budgets, goals, recurring, month])
}

const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', BDT: '৳', INR: '₹', JPY: '¥' }

export function formatMoney(amount: number, currency = 'USD'): string {
  const sym = SYMBOLS[currency] ?? `${currency} `
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  return `${sign}${sym}${abs.toLocaleString(undefined, { minimumFractionDigits: abs % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
}
