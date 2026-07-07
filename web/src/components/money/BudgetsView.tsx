'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, PiggyBank } from 'lucide-react'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import type { MoneyBudget, MoneyCategory } from '@/types/money'
import { formatMoney } from '@/lib/money/format'
import { MoneyIcon, EmptyState, MoneyModal, Field, inputCls, selectCls, Bar } from './shared'

interface Props {
  categories: MoneyCategory[]
  month: string
  currency: string
}

export function BudgetsView({ categories, month, currency }: Props) {
  const [budgets, setBudgets] = useState<MoneyBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState('')
  const [saving, setSaving] = useState(false)

  const expenseCats = categories.filter((c) => c.kind === 'expense')

  const load = async () => {
    setLoading(true)
    try {
      const res = await moneyApi.get(`/budgets?month=${month}`)
      setBudgets(res.data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [month])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(limit)
    if (!categoryId) return toast.error('Pick a category')
    if (!(amt >= 0)) return toast.error('Enter a valid limit')
    setSaving(true)
    try {
      await moneyApi.post('/budgets', { category_id: categoryId, limit_amount: amt, month })
      toast.success('Budget saved')
      setOpen(false); setCategoryId(''); setLimit('')
      load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (b: MoneyBudget) => {
    try {
      await moneyApi.del(`/budgets?id=${b.id}`)
      setBudgets((prev) => prev.filter((x) => x.id !== b.id))
      toast.success('Budget removed')
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove')
    }
  }

  const totalLimit = budgets.reduce((s, b) => s + b.limit_amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {budgets.length ? <>Spent <span className="text-foreground font-medium">{formatMoney(totalSpent, currency)}</span> of {formatMoney(totalLimit, currency)}</> : 'Set monthly limits per category'}
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={15} /> Budget
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : budgets.length === 0 ? (
        <EmptyState icon={<PiggyBank size={20} />} title="No budgets set" hint="Cap your spending per category and watch progress fill up as you log expenses." action={<button onClick={() => setOpen(true)} className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">+ Add budget</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {budgets.map((b) => {
            const spent = b.spent || 0
            const pct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0
            const over = spent > b.limit_amount
            return (
              <div key={b.id} className="group bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (b.category?.color || '#7a7a8a') + '22', color: b.category?.color || '#9e9e9e' }}>
                    <MoneyIcon name={b.category?.icon} size={15} />
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{b.category?.name || 'Category'}</span>
                  <button onClick={() => remove(b)} className="p-1 rounded-md text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
                </div>
                <Bar pct={pct} color={b.category?.color || undefined} danger={over} />
                <div className="flex justify-between mt-2 text-xs">
                  <span className={over ? 'text-destructive font-medium' : 'text-muted-foreground'}>{formatMoney(spent, currency)}{over ? ' over!' : ''}</span>
                  <span className="text-muted-foreground">{formatMoney(b.limit_amount, currency)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <MoneyModal open={open} onClose={() => setOpen(false)} title="Set budget">
        <form onSubmit={save} className="space-y-4">
          <Field label="Category">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
              <option value="">Select category…</option>
              {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Monthly limit" hint="Setting a budget for an existing category overwrites its limit.">
            <input type="number" step="0.01" min="0" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0.00" className={inputCls} />
          </Field>
          <button type="submit" disabled={saving} className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save budget'}
          </button>
        </form>
      </MoneyModal>
    </div>
  )
}
