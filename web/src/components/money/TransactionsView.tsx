'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowRightLeft, ArrowDownLeft, ArrowUpRight, Loader2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import type { MoneyAccount, MoneyCategory, MoneyTransaction } from '@/types/money'
import { formatMoney } from '@/lib/money/format'
import { MoneyIcon, EmptyState } from './shared'
import { TransactionModal } from './TransactionModal'
import { cn } from '@/lib/utils'

interface Props {
  accounts: MoneyAccount[]
  categories: MoneyCategory[]
  month: string
  currency: string
  onChanged: () => void
  onXp: (r: { leveledUp?: boolean; levelUpDetails?: any }) => void
}

export function TransactionsView({ accounts, categories, month, currency, onChanged, onXp }: Props) {
  const [txns, setTxns] = useState<MoneyTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MoneyTransaction | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await moneyApi.get(`/transactions?month=${month}`)
      setTxns(res.data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [month])

  const remove = async (t: MoneyTransaction) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await moneyApi.del(`/transactions/${t.id}`)
      setTxns((prev) => prev.filter((x) => x.id !== t.id))
      onChanged()
      toast.success('Transaction deleted')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  // group by date
  const groups = txns.reduce<Record<string, MoneyTransaction[]>>((acc, t) => {
    const d = t.occurred_at.slice(0, 10)
    ;(acc[d] ||= []).push(t)
    return acc
  }, {})
  const dates = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1))

  const acctName = (id: string | null) => accounts.find((a) => a.id === id)?.name

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{txns.length} transaction{txns.length === 1 ? '' : 's'} this month</p>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : txns.length === 0 ? (
        <EmptyState
          icon={<Receipt size={20} />}
          title="No transactions this month"
          hint="Log your income and expenses to start tracking your money and earning XP."
          action={<button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">+ Add transaction</button>}
        />
      ) : (
        <div className="space-y-6">
          {dates.map((d) => (
            <div key={d}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </p>
              <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                {groups[d].map((t) => {
                  const isIncome = t.type === 'income'
                  const isTransfer = t.type === 'transfer'
                  return (
                    <div key={t.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (t.category?.color || (isIncome ? '#5db8a0' : '#7a7a8a')) + '22', color: t.category?.color || (isIncome ? '#5db8a0' : '#9e9e9e') }}
                      >
                        {isTransfer ? <ArrowRightLeft size={16} /> : <MoneyIcon name={t.category?.icon} size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {isTransfer ? `${acctName(t.account_id) || '—'} → ${acctName(t.to_account_id) || '—'}` : (t.category?.name || 'Uncategorized')}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t.note || (isTransfer ? 'Transfer' : acctName(t.account_id) || '')}
                        </p>
                      </div>
                      <div className={cn('text-sm font-semibold tabular-nums flex items-center gap-1', isIncome ? 'text-emerald-500' : isTransfer ? 'text-muted-foreground' : 'text-foreground')}>
                        {isIncome ? <ArrowDownLeft size={13} /> : isTransfer ? null : <ArrowUpRight size={13} />}
                        {isIncome ? '+' : isTransfer ? '' : '-'}{formatMoney(t.amount, t.currency || currency).replace('-', '')}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(t); setModalOpen(true) }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"><Pencil size={13} /></button>
                        <button onClick={() => remove(t)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        accounts={accounts}
        categories={categories}
        defaultCurrency={currency}
        editing={editing}
        onSaved={(r) => { load(); onChanged(); onXp(r) }}
      />
    </div>
  )
}
