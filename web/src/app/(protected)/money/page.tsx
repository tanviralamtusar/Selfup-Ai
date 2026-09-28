'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Loader2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import { monthKey, monthLabel } from '@/lib/money/format'
import type { MoneyAccount, MoneyCategory, MoneySummary } from '@/types/money'
import { cn } from '@/lib/utils'
import { MoneyOverview } from '@/components/money/MoneyOverview'
import { MoneyDashboard } from '@/components/money/MoneyDashboard'
import { TransactionsView } from '@/components/money/TransactionsView'
import { BudgetsView } from '@/components/money/BudgetsView'
import { RecurringView } from '@/components/money/RecurringView'
import { GoalsView } from '@/components/money/GoalsView'
import { TransactionModal } from '@/components/money/TransactionModal'
import { AccountModal } from '@/components/money/AccountModal'
import { LevelUpModal } from '@/components/gamification/LevelUpModal'

type Tab = 'overview' | 'dashboard' | 'transactions' | 'budgets' | 'recurring' | 'goals'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'recurring', label: 'Recurring' },
  { id: 'goals', label: 'Goals' },
]

function shiftMonth(month: string, delta: number): string {
  const d = new Date(month + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + delta)
  return d.toISOString().slice(0, 10)
}

export default function MoneyPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [month, setMonth] = useState(monthKey())
  const [accounts, setAccounts] = useState<MoneyAccount[]>([])
  const [categories, setCategories] = useState<MoneyCategory[]>([])
  const [summary, setSummary] = useState<MoneySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [bump, setBump] = useState(0) // forces child views to refetch after cross-cutting changes

  const [txnModal, setTxnModal] = useState(false)
  const [acctModal, setAcctModal] = useState(false)
  const [editAcct, setEditAcct] = useState<MoneyAccount | null>(null)

  const [levelUp, setLevelUp] = useState<{ open: boolean; newLevel: number; totalXp: number; coinsReward: number }>({ open: false, newLevel: 2, totalXp: 0, coinsReward: 0 })

  const currency = summary?.currency || accounts[0]?.currency || 'USD'

  const loadCore = useCallback(async () => {
    try {
      const [acc, cat] = await Promise.all([moneyApi.get('/accounts'), moneyApi.get('/categories')])
      setAccounts(acc.data || [])
      setCategories(cat.data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load money data')
    }
  }, [])

  const loadSummary = useCallback(async () => {
    try {
      const res = await moneyApi.get(`/summary?month=${month}`)
      setSummary(res.data)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load summary')
    }
  }, [month])

  useEffect(() => {
    (async () => {
      setLoading(true)
      await Promise.all([loadCore(), loadSummary()])
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  // refresh accounts + summary whenever something changes elsewhere
  const refreshShared = useCallback(() => {
    loadCore(); loadSummary(); setBump((b) => b + 1)
  }, [loadCore, loadSummary])

  const handleXp = useCallback((r: { leveledUp?: boolean; levelUpDetails?: any }) => {
    if (r?.leveledUp && r.levelUpDetails) {
      setLevelUp({ open: true, newLevel: r.levelUpDetails.newLevel, totalXp: r.levelUpDetails.totalXp, coinsReward: r.levelUpDetails.coinsRewarded })
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Wallet className="text-primary" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Money</h1>
            <p className="text-xs text-muted-foreground">Track cash flow, budgets & goals</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Month switcher */}
          <div className="flex items-center bg-muted border border-border rounded-lg h-9">
            <button onClick={() => setMonth((m) => shiftMonth(m, -1))} className="px-2 h-full text-muted-foreground hover:text-foreground"><ChevronLeft size={16} /></button>
            <span className="px-2 text-sm font-medium text-foreground min-w-[92px] text-center tabular-nums">{monthLabel(month)}</span>
            <button onClick={() => setMonth((m) => shiftMonth(m, 1))} disabled={month >= monthKey()} className="px-2 h-full text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => setTxnModal(true)} className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" size={22} /></div>
      ) : (
        <>
          {tab === 'overview' && summary && (
            <MoneyOverview
              key={bump}
              summary={summary}
              onAddTransaction={() => setTxnModal(true)}
              onAddAccount={() => { setEditAcct(null); setAcctModal(true) }}
              onEditAccount={(a) => { setEditAcct(a); setAcctModal(true) }}
              onGoToTab={(t) => setTab(t as Tab)}
            />
          )}
          {tab === 'dashboard' && (
            <MoneyDashboard key={bump} accounts={accounts} categories={categories} />
          )}
          {tab === 'transactions' && (
            <TransactionsView key={bump} accounts={accounts} categories={categories} month={month} currency={currency} onChanged={loadSummary} onXp={handleXp} />
          )}
          {tab === 'budgets' && (
            <BudgetsView key={bump} categories={categories} month={month} currency={currency} />
          )}
          {tab === 'recurring' && (
            <RecurringView key={bump} accounts={accounts} categories={categories} currency={currency} onChanged={refreshShared} />
          )}
          {tab === 'goals' && (
            <GoalsView key={bump} currency={currency} onChanged={loadSummary} onXp={handleXp} />
          )}
        </>
      )}

      {/* Shared modals */}
      <TransactionModal
        open={txnModal}
        onClose={() => setTxnModal(false)}
        accounts={accounts}
        categories={categories}
        defaultCurrency={currency}
        onSaved={(r) => { refreshShared(); handleXp(r) }}
      />
      <AccountModal
        open={acctModal}
        onClose={() => setAcctModal(false)}
        editing={editAcct}
        defaultCurrency={currency}
        onSaved={refreshShared}
      />
      <LevelUpModal
        isOpen={levelUp.open}
        onClose={() => setLevelUp((s) => ({ ...s, open: false }))}
        newLevel={levelUp.newLevel}
        totalXp={levelUp.totalXp}
        coinsReward={levelUp.coinsReward}
      />
    </div>
  )
}
