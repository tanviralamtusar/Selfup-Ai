'use client'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import type { MoneyAccount, MoneyCategory, MoneyTransaction, TransactionType } from '@/types/money'
import { MoneyModal, Field, inputCls, selectCls, Segmented } from './shared'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  accounts: MoneyAccount[]
  categories: MoneyCategory[]
  defaultCurrency: string
  editing?: MoneyTransaction | null
  onSaved: (result: { leveledUp?: boolean; levelUpDetails?: any }) => void
}

const todayStr = () => new Date().toISOString().slice(0, 10)

export function TransactionModal({ open, onClose, accounts, categories, defaultCurrency, editing, onSaved }: Props) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setCategoryId(editing.category_id || '')
      setAccountId(editing.account_id || '')
      setToAccountId(editing.to_account_id || '')
      setNote(editing.note || '')
      setDate(editing.occurred_at?.slice(0, 10) || todayStr())
    } else {
      setType('expense'); setAmount(''); setCategoryId(''); setNote(''); setDate(todayStr())
      setAccountId(accounts[0]?.id || '')
      setToAccountId('')
    }
  }, [open, editing, accounts])

  const cats = categories.filter((c) => c.kind === (type === 'income' ? 'income' : 'expense'))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!(amt > 0)) return toast.error('Enter an amount greater than 0')
    if (type === 'transfer' && (!accountId || !toAccountId || accountId === toAccountId))
      return toast.error('Pick two different accounts for a transfer')

    setSaving(true)
    try {
      const payload = {
        type,
        amount: amt,
        currency: accounts.find((a) => a.id === accountId)?.currency || defaultCurrency,
        account_id: accountId || null,
        to_account_id: type === 'transfer' ? toAccountId : null,
        category_id: type === 'transfer' ? null : categoryId || null,
        note: note || null,
        occurred_at: date,
      }
      let result: any
      if (editing) {
        result = await moneyApi.patch(`/transactions/${editing.id}`, payload)
      } else {
        result = await moneyApi.post('/transactions', payload)
      }
      toast.success(editing ? 'Transaction updated' : type === 'transfer' ? 'Transfer recorded' : `${type === 'income' ? 'Income' : 'Expense'} logged${result.xpAwarded ? ` · +${result.xpAwarded} XP` : ''}`)
      onSaved({ leveledUp: result.leveledUp, levelUpDetails: result.levelUpDetails })
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MoneyModal open={open} onClose={onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex justify-center">
          <Segmented
            value={type}
            onChange={(v) => setType(v)}
            options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }]}
          />
        </div>

        <Field label="Amount">
          <div className="relative">
            <input
              autoFocus
              type="number" step="0.01" min="0" inputMode="decimal"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={cn(inputCls, 'h-12 text-lg font-semibold')}
            />
          </div>
        </Field>

        {type !== 'transfer' && (
          <Field label="Category">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
              <option value="">Uncategorized</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={type === 'transfer' ? 'From account' : 'Account'}>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectCls}>
              {accounts.length === 0 && <option value="">No accounts</option>}
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          {type === 'transfer' ? (
            <Field label="To account">
              <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className={selectCls}>
                <option value="">Select…</option>
                {accounts.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
          )}
        </div>

        {type === 'transfer' && (
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
        )}

        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className={inputCls} />
        </Field>

        <button
          type="submit" disabled={saving}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}
        </button>
      </form>
    </MoneyModal>
  )
}
