'use client'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import type { MoneyAccount, AccountType } from '@/types/money'
import { CURRENCIES } from '@/lib/money/format'
import { MoneyModal, Field, inputCls, selectCls } from './shared'

interface Props {
  open: boolean
  onClose: () => void
  editing?: MoneyAccount | null
  defaultCurrency: string
  onSaved: () => void
}

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank' },
  { value: 'card', label: 'Card' }, { value: 'investment', label: 'Investment' }, { value: 'other', label: 'Other' },
]

export function AccountModal({ open, onClose, editing, defaultCurrency, onSaved }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [opening, setOpening] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name); setType(editing.type); setCurrency(editing.currency); setOpening(String(editing.opening_balance))
    } else {
      setName(''); setType('cash'); setCurrency(defaultCurrency); setOpening('')
    }
  }, [open, editing, defaultCurrency])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Account name required')
    setSaving(true)
    try {
      const payload = { name: name.trim(), type, currency, opening_balance: parseFloat(opening) || 0 }
      if (editing) await moneyApi.patch(`/accounts/${editing.id}`, payload)
      else await moneyApi.post('/accounts', payload)
      toast.success(editing ? 'Account updated' : 'Account added')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!editing) return
    if (!confirm(`Delete "${editing.name}"? Its transactions will be kept but unlinked.`)) return
    try {
      await moneyApi.del(`/accounts/${editing.id}`)
      toast.success('Account deleted')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  return (
    <MoneyModal open={open} onClose={onClose} title={editing ? 'Edit account' : 'Add account'}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Checking, Wallet" className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className={selectCls}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Opening balance" hint="Current balance of this account before you start logging.">
          <input type="number" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0.00" className={inputCls} />
        </Field>
        <div className="flex gap-2">
          {editing && <button type="button" onClick={del} className="h-11 px-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20">Delete</button>}
          <button type="submit" disabled={saving} className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add account'}
          </button>
        </div>
      </form>
    </MoneyModal>
  )
}
