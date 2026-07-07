'use client'
import React, { useState } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, Sparkles, Loader2,
  ArrowUpRight, ArrowDownRight, Target,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import type { MoneySummary, MoneyAccount } from '@/types/money'
import { formatMoney } from '@/lib/money/format'
import { AccountTypeIcon, Bar } from './shared'
import { cn } from '@/lib/utils'

interface Props {
  summary: MoneySummary
  onAddTransaction: () => void
  onAddAccount: () => void
  onEditAccount: (a: MoneyAccount) => void
  onGoToTab: (tab: string) => void
}

function StatCard({ label, value, sub, icon, tone }: { label: string; value: string; sub?: React.ReactNode; icon: React.ReactNode; tone?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center',
          tone === 'up' ? 'bg-emerald-500/10 text-emerald-500' : tone === 'down' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--foreground)',
}

export function MoneyOverview({ summary, onAddTransaction, onAddAccount, onEditAccount, onGoToTab }: Props) {
  const c = summary.currency
  const [insights, setInsights] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  const savingsRate = summary.monthIncome > 0 ? Math.round((summary.monthNet / summary.monthIncome) * 100) : 0
  const expenseDelta = summary.prevMonthExpense > 0 ? Math.round(((summary.monthExpense - summary.prevMonthExpense) / summary.prevMonthExpense) * 100) : 0

  const getInsights = async () => {
    setLoadingAi(true)
    try {
      const res = await moneyApi.post('/insights', {})
      setInsights(res.insights)
    } catch (e: any) {
      toast.error(e.message || 'Could not generate insights')
    } finally {
      setLoadingAi(false)
    }
  }

  const donut = summary.byCategory.slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Net worth" value={formatMoney(summary.netWorth, c)} icon={<Wallet size={15} />} sub={`${summary.accounts.length} account${summary.accounts.length === 1 ? '' : 's'}`} tone="neutral" />
        <StatCard label="Income · this month" value={formatMoney(summary.monthIncome, c)} icon={<TrendingUp size={15} />} tone="up" />
        <StatCard label="Spent · this month" value={formatMoney(summary.monthExpense, c)} icon={<TrendingDown size={15} />} tone="down"
          sub={summary.prevMonthExpense > 0 ? (
            <span className={cn('inline-flex items-center gap-0.5', expenseDelta > 0 ? 'text-destructive' : 'text-emerald-500')}>
              {expenseDelta > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(expenseDelta)}% vs last month
            </span>
          ) : undefined}
        />
        <StatCard label="Saved · this month" value={formatMoney(summary.monthNet, c)} icon={<PiggyBank size={15} />} tone={summary.monthNet >= 0 ? 'up' : 'down'} sub={summary.monthIncome > 0 ? `${savingsRate}% savings rate` : undefined} />
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-semibold text-foreground">Accounts</h3>
          <button onClick={onAddAccount} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"><Plus size={13} /> Add</button>
        </div>
        {summary.accounts.length === 0 ? (
          <button onClick={onAddAccount} className="w-full bg-card border border-dashed border-border rounded-xl py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
            + Add your first account to start tracking balances
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.accounts.map((a) => (
              <button key={a.id} onClick={() => onEditAccount(a)} className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (a.color || '#9c7ef0') + '22', color: a.color || '#9c7ef0' }}>
                    <AccountTypeIcon type={a.type} size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{a.type}</p>
                  </div>
                </div>
                <p className={cn('text-lg font-semibold tabular-nums', (a.balance ?? 0) < 0 ? 'text-destructive' : 'text-foreground')}>{formatMoney(a.balance ?? 0, a.currency)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Income vs Expense · 6 months</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={summary.trend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={44}
                  tickFormatter={(v) => formatMoney(v, c, { compact: true })} />
                <Tooltip contentStyle={tooltipStyle} formatter={((v: any, n: any) => [formatMoney(Number(v), c), n === 'income' ? 'Income' : 'Expense']) as any} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                <RBar dataKey="income" fill="#5db8a0" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <RBar dataKey="expense" fill="#f28b82" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Spending by category</h3>
          {donut.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No expenses logged this month</div>
          ) : (
            <div className="h-56 flex items-center gap-4">
              <div className="w-40 h-full shrink-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={donut} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={70} paddingAngle={2} stroke="none">
                      {donut.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => formatMoney(Number(v), c)) as any} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto max-h-full">
                {donut.map((d) => (
                  <div key={d.category_id || d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-foreground truncate flex-1">{d.name}</span>
                    <span className="text-muted-foreground tabular-nums">{formatMoney(d.amount, c)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budgets + Goals quick glance */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Budgets</h3>
            <button onClick={() => onGoToTab('budgets')} className="text-xs font-medium text-primary hover:opacity-80">Manage</button>
          </div>
          {summary.budgets.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No budgets set for this month.</p>
          ) : (
            <div className="space-y-3">
              {summary.budgets.slice(0, 4).map((b) => {
                const pct = b.limit_amount > 0 ? ((b.spent || 0) / b.limit_amount) * 100 : 0
                const over = (b.spent || 0) > b.limit_amount
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-foreground">{b.category?.name}</span>
                      <span className={over ? 'text-destructive font-medium' : 'text-muted-foreground'}>{formatMoney(b.spent || 0, c)} / {formatMoney(b.limit_amount, c)}</span>
                    </div>
                    <Bar pct={pct} color={b.category?.color || undefined} danger={over} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Savings goals</h3>
            <button onClick={() => onGoToTab('goals')} className="text-xs font-medium text-primary hover:opacity-80">Manage</button>
          </div>
          {summary.goals.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No savings goals yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.goals.slice(0, 4).map((g) => {
                const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-foreground flex items-center gap-1"><Target size={11} className="text-muted-foreground" />{g.name}</span>
                      <span className="text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <Bar pct={pct} color={g.color || undefined} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI insights */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Sparkles size={15} className="text-primary" /> AI money insights</h3>
          <button onClick={getInsights} disabled={loadingAi} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-60">
            {loadingAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} {insights ? 'Refresh' : 'Analyze'}
          </button>
        </div>
        {insights ? (
          <MarkdownRenderer content={insights} />
        ) : (
          <p className="text-xs text-muted-foreground">Get a personalized review of this month's spending, budget health, and goal progress — with concrete next steps.</p>
        )}
      </div>

      {/* Mobile FAB-ish add */}
      <button onClick={onAddTransaction} className="lg:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center">
        <Plus size={22} />
      </button>
    </div>
  )
}
