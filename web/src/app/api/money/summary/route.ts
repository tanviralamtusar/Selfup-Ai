import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'
import { monthKey, monthLabel } from '@/lib/money/format'

/**
 * GET /api/money/summary?month=YYYY-MM-01
 * Net worth, month income/expense, spend-by-category, a 6-month trend,
 * budgets (with spend), and goals — everything the Overview tab needs.
 */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const month = req.nextUrl.searchParams.get('month') || monthKey()
  const monthStart = new Date(month + 'T00:00:00Z')

  // 6-month trend window (this month + 5 prior)
  const windowStart = new Date(monthStart)
  windowStart.setUTCMonth(windowStart.getUTCMonth() - 5)
  const monthEnd = new Date(monthStart)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

  const [accountsRes, txnRes, budgetRes, goalsRes] = await Promise.all([
    db.from('money_accounts').select('*').eq('user_id', user.id),
    db
      .from('money_transactions')
      .select('type, amount, category_id, occurred_at, account_id, to_account_id, category:money_categories(id,name,color)')
      .eq('user_id', user.id)
      .gte('occurred_at', windowStart.toISOString().slice(0, 10)),
    db.from('money_budgets').select('*, category:money_categories(id,name,kind,icon,color)').eq('user_id', user.id).eq('month', month),
    db.from('money_goals').select('*').eq('user_id', user.id).order('is_achieved').order('created_at', { ascending: false }),
  ])

  if (accountsRes.error) return NextResponse.json({ error: accountsRes.error.message }, { status: 500 })
  if (txnRes.error) return NextResponse.json({ error: txnRes.error.message }, { status: 500 })

  const allTxns = txnRes.data ?? []

  // ── Account balances (need all-time deltas, but window txns suffice for
  //    recent activity; for accuracy pull all txns for balance) ──
  const { data: balTxns } = await db
    .from('money_transactions')
    .select('account_id, to_account_id, type, amount')
    .eq('user_id', user.id)
  const delta = new Map<string, number>()
  for (const t of balTxns ?? []) {
    const amt = num(t.amount)
    if (t.type === 'income' && t.account_id) delta.set(t.account_id, (delta.get(t.account_id) ?? 0) + amt)
    else if (t.type === 'expense' && t.account_id) delta.set(t.account_id, (delta.get(t.account_id) ?? 0) - amt)
    else if (t.type === 'transfer') {
      if (t.account_id) delta.set(t.account_id, (delta.get(t.account_id) ?? 0) - amt)
      if (t.to_account_id) delta.set(t.to_account_id, (delta.get(t.to_account_id) ?? 0) + amt)
    }
  }
  const accounts = (accountsRes.data ?? []).map((a) => ({
    ...a,
    opening_balance: num(a.opening_balance),
    balance: num(a.opening_balance) + (delta.get(a.id) ?? 0),
  }))
  const currency = accounts[0]?.currency || 'USD'
  const netWorth = accounts.reduce((s, a) => s + a.balance, 0)

  // ── This-month totals + category breakdown ──
  const monthStartStr = monthStart.toISOString().slice(0, 10)
  const monthEndStr = monthEnd.toISOString().slice(0, 10)
  const inMonth = (d: string) => d >= monthStartStr && d < monthEndStr

  let monthIncome = 0
  let monthExpense = 0
  const catMap = new Map<string, { category_id: string | null; name: string; color: string; amount: number }>()
  for (const t of allTxns) {
    if (!inMonth(t.occurred_at)) continue
    const amt = num(t.amount)
    if (t.type === 'income') monthIncome += amt
    else if (t.type === 'expense') {
      monthExpense += amt
      const cat = (t as any).category
      const key = t.category_id || 'uncategorized'
      const existing = catMap.get(key)
      if (existing) existing.amount += amt
      else catMap.set(key, { category_id: t.category_id, name: cat?.name || 'Uncategorized', color: cat?.color || '#7a7a8a', amount: amt })
    }
  }
  const byCategory = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount)

  // ── Previous month expense (for delta) ──
  const prevStart = new Date(monthStart)
  prevStart.setUTCMonth(prevStart.getUTCMonth() - 1)
  const prevStartStr = prevStart.toISOString().slice(0, 10)
  let prevMonthExpense = 0
  for (const t of allTxns) {
    if (t.type === 'expense' && t.occurred_at >= prevStartStr && t.occurred_at < monthStartStr) prevMonthExpense += num(t.amount)
  }

  // ── 6-month income/expense trend ──
  const trend: { month: string; label: string; income: number; expense: number }[] = []
  for (let i = 0; i < 6; i++) {
    const m = new Date(windowStart)
    m.setUTCMonth(m.getUTCMonth() + i)
    const mStr = m.toISOString().slice(0, 10)
    const mEnd = new Date(m)
    mEnd.setUTCMonth(mEnd.getUTCMonth() + 1)
    const mEndStr = mEnd.toISOString().slice(0, 10)
    let income = 0
    let expense = 0
    for (const t of allTxns) {
      if (t.occurred_at >= mStr && t.occurred_at < mEndStr) {
        if (t.type === 'income') income += num(t.amount)
        else if (t.type === 'expense') expense += num(t.amount)
      }
    }
    trend.push({ month: mStr, label: monthLabel(mStr), income, expense })
  }

  // ── Budgets with spend ──
  const budgets = (budgetRes.data ?? []).map((b) => {
    let spent = 0
    for (const t of allTxns) {
      if (t.type === 'expense' && t.category_id === b.category_id && inMonth(t.occurred_at)) spent += num(t.amount)
    }
    return { ...b, limit_amount: num(b.limit_amount), spent }
  })

  const goals = (goalsRes.data ?? []).map((g) => ({ ...g, target_amount: num(g.target_amount), current_amount: num(g.current_amount) }))

  return NextResponse.json({
    success: true,
    data: {
      currency,
      netWorth,
      accounts,
      month,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      prevMonthExpense,
      byCategory,
      trend,
      budgets,
      goals,
    },
  })
}
