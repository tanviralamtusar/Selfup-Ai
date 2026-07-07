'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Repeat, Zap, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import type { MoneyAccount, MoneyCategory, MoneyRecurring } from '@/types/money'
import { formatMoney } from '@/lib/money/format'
import { MoneyIcon, EmptyState, MoneyModal, Field, inputCls, selectCls, Segmented } from './shared'
import { cn } from '@/lib/utils'

interface Props {
  accounts: MoneyAccount[]
  categories: MoneyCategory[]
  currency: string
  onChanged: () => void
}

const todayStr = () => new Date().toISOString().slice(0, 10)

export function RecurringView({ accounts, categories, currency, onChanged }: Props) {
  const [rules, setRules] = useState<MoneyRecurring[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [posting, setPosting] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', type: 'expense' as 'income' | 'expense', amount: '', cadence: 'monthly', next_due: todayStr(), account_id: '', category_id: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await moneyApi.get('/recurring')
      setRules(res.data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load recurring')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const cats = categories.filter((c) => c.kind === form.type)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!form.name.trim()) return toast.error('Name required')
    if (!(amt > 0)) return toast.error('Enter an amount')
    setSaving(true)
    try {
      await moneyApi.post('/recurring', {
        name: form.name.trim(), type: form.type, amount: amt, cadence: form.cadence,
        next_due: form.next_due, account_id: form.account_id || null, category_id: form.category_id || null,
        currency: accounts.find((a) => a.id === form.account_id)?.currency || currency,
      })
      toast.success('Recurring item added')
      setOpen(false)
      setForm({ name: '', type: 'expense', amount: '', cadence: 'monthly', next_due: todayStr(), account_id: '', category_id: '' })
      load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const postNow = async (r: MoneyRecurring) => {
    setPosting(r.id)
    try {
      await moneyApi.post(`/recurring/${r.id}/post`, {})
      toast.success(`Posted ${r.name}`)
      load(); onChanged()
    } catch (e: any) {
      toast.error(e.message || 'Failed to post')
    } finally {
      setPosting(null)
    }
  }

  const remove = async (r: MoneyRecurring) => {
    if (!confirm(`Delete "${r.name}"?`)) return
    try {
      await moneyApi.del(`/recurring/${r.id}`)
      setRules((prev) => prev.filter((x) => x.id !== r.id))
      toast.success('Deleted')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  const monthlyOutflow = rules.filter((r) => r.type === 'expense' && r.is_active).reduce((s, r) => {
    const mult = r.cadence === 'weekly' ? 4.33 : r.cadence === 'yearly' ? 1 / 12 : 1
    return s + r.amount * mult
  }, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {rules.length ? <>~<span className="text-foreground font-medium">{formatMoney(monthlyOutflow, currency)}</span>/mo in recurring expenses</> : 'Track bills, subscriptions & recurring income'}
        </p>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={15} /> Recurring
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : rules.length === 0 ? (
        <EmptyState icon={<Repeat size={20} />} title="No recurring items" hint="Add subscriptions, rent, salary and other repeating cash flows. Post them to your ledger with one tap when they're due." action={<button onClick={() => setOpen(true)} className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">+ Add recurring</button>} />
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {rules.map((r) => {
            const due = new Date(r.next_due + 'T00:00:00Z')
            const overdue = r.next_due <= todayStr()
            return (
              <div key={r.id} className={cn('group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors', !r.is_active && 'opacity-50')}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (r.category?.color || '#7a7a8a') + '22', color: r.category?.color || '#9e9e9e' }}>
                  <MoneyIcon name={r.category?.icon} size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarClock size={11} />
                    <span className={overdue ? 'text-amber-500 font-medium' : ''}>{due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                    · {r.cadence}
                  </p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums', r.type === 'income' ? 'text-emerald-500' : 'text-foreground')}>
                  {r.type === 'income' ? '+' : '-'}{formatMoney(r.amount, r.currency || currency).replace('-', '')}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => postNow(r)} disabled={posting === r.id} title="Post now" className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50">
                    {posting === r.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Post
                  </button>
                  <button onClick={() => remove(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <MoneyModal open={open} onClose={() => setOpen(false)} title="Add recurring item">
        <form onSubmit={save} className="space-y-4">
          <div className="flex justify-center">
            <Segmented value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v, category_id: '' }))} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
          </div>
          <Field label="Name"><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Netflix, Rent, Salary" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount"><input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={inputCls} /></Field>
            <Field label="Frequency">
              <select value={form.cadence} onChange={(e) => setForm((f) => ({ ...f, cadence: e.target.value }))} className={selectCls}>
                <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Next due"><input type="date" value={form.next_due} onChange={(e) => setForm((f) => ({ ...f, next_due: e.target.value }))} className={inputCls} /></Field>
            <Field label="Category">
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className={selectCls}>
                <option value="">None</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Account">
            <select value={form.account_id} onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))} className={selectCls}>
              <option value="">None</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <button type="submit" disabled={saving} className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Add recurring'}</button>
        </form>
      </MoneyModal>
    </div>
  )
}
