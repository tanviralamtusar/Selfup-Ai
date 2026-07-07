'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Target, Check, Coins } from 'lucide-react'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import type { MoneyGoal } from '@/types/money'
import { formatMoney } from '@/lib/money/format'
import { EmptyState, MoneyModal, Field, inputCls, Bar } from './shared'
import { cn } from '@/lib/utils'

interface Props {
  currency: string
  onChanged: () => void
  onXp: (r: { leveledUp?: boolean; levelUpDetails?: any }) => void
}

export function GoalsView({ currency, onChanged, onXp }: Props) {
  const [goals, setGoals] = useState<MoneyGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contributeFor, setContributeFor] = useState<MoneyGoal | null>(null)
  const [contribAmt, setContribAmt] = useState('')

  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '', target_date: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await moneyApi.get('/goals')
      setGoals(res.data || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(form.target_amount)
    if (!form.name.trim()) return toast.error('Name required')
    if (!(target > 0)) return toast.error('Enter a target amount')
    setSaving(true)
    try {
      await moneyApi.post('/goals', {
        name: form.name.trim(), target_amount: target,
        current_amount: parseFloat(form.current_amount) || 0,
        target_date: form.target_date || null, currency,
      })
      toast.success('Goal created')
      setOpen(false)
      setForm({ name: '', target_amount: '', current_amount: '', target_date: '' })
      load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const contribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contributeFor) return
    const amt = parseFloat(contribAmt)
    if (!amt) return toast.error('Enter an amount')
    try {
      const res = await moneyApi.patch(`/goals/${contributeFor.id}`, { contribute: amt })
      toast.success(`Added ${formatMoney(amt, currency)}${res.data?.is_achieved ? ' · Goal reached! 🎉' : ''}`)
      setContributeFor(null); setContribAmt('')
      load(); onChanged(); onXp(res)
    } catch (err: any) {
      toast.error(err.message || 'Failed')
    }
  }

  const remove = async (g: MoneyGoal) => {
    if (!confirm(`Delete "${g.name}"?`)) return
    try {
      await moneyApi.del(`/goals/${g.id}`)
      setGoals((prev) => prev.filter((x) => x.id !== g.id))
      toast.success('Deleted')
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{goals.length ? `${goals.filter((g) => g.is_achieved).length}/${goals.length} goals reached` : 'Save toward what matters'}</p>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={15} /> Goal
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : goals.length === 0 ? (
        <EmptyState icon={<Target size={20} />} title="No savings goals yet" hint="Set targets like an emergency fund or a trip. Contributions earn XP and hitting a goal gives a bonus." action={<button onClick={() => setOpen(true)} className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">+ Add goal</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
            return (
              <div key={g.id} className="group bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (g.color || '#5db8a0') + '22', color: g.color || '#5db8a0' }}>
                    {g.is_achieved ? <Check size={16} /> : <Target size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                    {g.target_date && <p className="text-[11px] text-muted-foreground">by {new Date(g.target_date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</p>}
                  </div>
                  <button onClick={() => remove(g)} className="p-1 rounded-md text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
                </div>
                <Bar pct={pct} color={g.color || undefined} />
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-xs text-muted-foreground"><span className="text-foreground font-medium">{formatMoney(g.current_amount, currency)}</span> / {formatMoney(g.target_amount, currency)}</span>
                  {!g.is_achieved && (
                    <button onClick={() => { setContributeFor(g); setContribAmt('') }} className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">
                      <Coins size={12} /> Add
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <MoneyModal open={open} onClose={() => setOpen(false)} title="New savings goal">
        <form onSubmit={save} className="space-y-4">
          <Field label="Name"><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency fund" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target amount"><input type="number" step="0.01" min="0" value={form.target_amount} onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))} placeholder="0.00" className={inputCls} /></Field>
            <Field label="Already saved"><input type="number" step="0.01" min="0" value={form.current_amount} onChange={(e) => setForm((f) => ({ ...f, current_amount: e.target.value }))} placeholder="0.00" className={inputCls} /></Field>
          </div>
          <Field label="Target date (optional)"><input type="date" value={form.target_date} onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))} className={inputCls} /></Field>
          <button type="submit" disabled={saving} className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Create goal'}</button>
        </form>
      </MoneyModal>

      <MoneyModal open={!!contributeFor} onClose={() => setContributeFor(null)} title={`Add to ${contributeFor?.name ?? ''}`}>
        <form onSubmit={contribute} className="space-y-4">
          <Field label="Amount to add">
            <input autoFocus type="number" step="0.01" min="0" value={contribAmt} onChange={(e) => setContribAmt(e.target.value)} placeholder="0.00" className={cn(inputCls, 'h-12 text-lg font-semibold')} />
          </Field>
          <button type="submit" className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Add contribution</button>
        </form>
      </MoneyModal>
    </div>
  )
}
