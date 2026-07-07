// Money Management module — shared types

export type AccountType = 'cash' | 'bank' | 'card' | 'investment' | 'other'
export type CategoryKind = 'income' | 'expense'
export type TransactionType = 'income' | 'expense' | 'transfer'
export type RecurringCadence = 'weekly' | 'monthly' | 'yearly'

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
  updated_at: string
  // computed (added by GET /accounts and /summary)
  balance?: number
}

export interface MoneyCategory {
  id: string
  user_id: string | null
  name: string
  kind: CategoryKind
  icon: string | null
  color: string | null
  is_active: boolean
  created_at: string
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
  // joins
  category?: Pick<MoneyCategory, 'id' | 'name' | 'kind' | 'icon' | 'color'> | null
  account?: Pick<MoneyAccount, 'id' | 'name' | 'color' | 'icon'> | null
}

export interface MoneyBudget {
  id: string
  user_id: string
  category_id: string
  month: string
  limit_amount: number
  created_at: string
  updated_at: string
  // computed
  spent?: number
  category?: Pick<MoneyCategory, 'id' | 'name' | 'kind' | 'icon' | 'color'> | null
}

export interface MoneyRecurring {
  id: string
  user_id: string
  account_id: string | null
  category_id: string | null
  name: string
  type: Exclude<TransactionType, 'transfer'>
  amount: number
  currency: string
  cadence: RecurringCadence
  next_due: string
  auto_post: boolean
  is_active: boolean
  last_posted_at: string | null
  created_at: string
  category?: Pick<MoneyCategory, 'id' | 'name' | 'icon' | 'color'> | null
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
  icon: string | null
  is_achieved: boolean
  created_at: string
  updated_at: string
}

export interface MoneySummary {
  currency: string
  netWorth: number
  accounts: MoneyAccount[]
  month: string
  monthIncome: number
  monthExpense: number
  monthNet: number
  prevMonthExpense: number
  byCategory: { category_id: string | null; name: string; color: string; amount: number }[]
  trend: { month: string; label: string; income: number; expense: number }[]
  budgets: MoneyBudget[]
  goals: MoneyGoal[]
}
