'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Wallet,
  TrendingUp, TrendingDown, ArrowLeftRight,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar as RBar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import { toast } from 'sonner'
import { moneyApi } from '@/lib/money/client'
import { formatMoney } from '@/lib/money/format'
import type { MoneyAccount, MoneyCategory, MoneyAnalytics, MoneyAnalyticsTxn } from '@/types/money'
import { MoneyIcon } from './shared'
import { cn } from '@/lib/utils'

type Granularity = 'days' | 'weeks' | 'months'

interface Props {
  accounts: MoneyAccount[]
  categories: MoneyCategory[]
}

// ── date helpers (all UTC, YYYY-MM-DD) ──
const iso = (d: Date) => d.toISOString().slice(0, 10)
const parse = (s: string) => new Date(s + 'T00:00:00Z')
const addDays = (s: string, n: number) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d) }
const dayLabel = (s: string) => parse(s).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' })
const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)

function startOfWeek(s: string) { const d = parse(s); const dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow); return iso(d) }
function startOfMonth(s: string) { const d = parse(s); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01` }

function presetRange(kind: string): { start: string; end: string } {
  const now = new Date()
  const y = now.getUTCFullYear(), m = now.getUTCMonth()
  const first = (yy: number, mm: number) => iso(new Date(Date.UTC(yy, mm, 1)))
  const last = (yy: number, mm: number) => iso(new Date(Date.UTC(yy, mm + 1, 0)))
  switch (kind) {
    case 'thisMonth': return { start: first(y, m), end: last(y, m) }
    case 'lastMonth': return { start: first(y, m - 1), end: last(y, m - 1) }
    case 'last3': return { start: first(y, m - 2), end: last(y, m) }
    case 'thisYear': return { start: `${y}-01-01`, end: `${y}-12-31` }
    case 'lastYear': return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` }
    default: return { start: first(y, m), end: last(y, m) }
  }
}

// ── bucketing for the charts ──
function buckets(start: string, end: string, gran: Granularity): { key: string; label: string; end: string }[] {
  const out: { key: string; label: string; end: string }[] = []
  if (gran === 'days') {
    // cap number of day buckets so long ranges stay readable
    const total = daysBetween(start, end)
    const step = total > 62 ? Math.ceil(total / 62) : 1
    for (let i = 0; i <= total; i += step) {
      const s = addDays(start, i)
      const e = addDays(start, Math.min(i + step - 1, total))
      out.push({ key: s, end: e, label: parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) })
    }
  } else if (gran === 'weeks') {
    let s = startOfWeek(start)
    while (s <= end) {
      const e = addDays(s, 6)
      out.push({ key: s, end: e < end ? e : end, label: parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) })
      s = addDays(s, 7)
    }
  } else {
    let s = startOfMonth(start)
    while (s <= end) {
      const d = parse(s); const e = iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)))
      out.push({ key: s, end: e < end ? e : end, label: parse(s).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }) })
      d.setUTCMonth(d.getUTCMonth() + 1); s = iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)))
    }
  }
  return out
}

const signed = (t: Pick<MoneyAnalyticsTxn, 'type' | 'amount'>) =>
  t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0

// ── dual-thumb amount range slider ──
function RangeSlider({ min, max, value, onChange, format }: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void; format: (n: number) => string
}) {
  const span = max - min || 1
  const lo = ((value[0] - min) / span) * 100
  const hi = ((value[1] - min) / span) * 100
  return (
    <div className="pt-1">
      <div className="relative h-9 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted" />
        <div className="absolute h-1.5 rounded-full bg-primary" style={{ left: `${lo}%`, right: `${100 - hi}%` }} />
        <input
          type="range" min={min} max={max} value={value[0]}
          onChange={(e) => onChange([Math.min(Number(e.target.value), value[1]), value[1]])}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
        />
        <input
          type="range" min={min} max={max} value={value[1]}
          onChange={(e) => onChange([value[0], Math.max(Number(e.target.value), value[0])])}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{format(value[0])}</span>
        <span>{format(value[1])}</span>
      </div>
      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          appearance: none; pointer-events: auto; width: 15px; height: 15px; border-radius: 9999px;
          background: var(--card); border: 2px solid var(--primary); cursor: pointer; margin-top: -1px;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto; width: 15px; height: 15px; border-radius: 9999px;
          background: var(--card); border: 2px solid var(--primary); cursor: pointer;
        }
        .range-thumb { height: 1.5px; }
      `}</style>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 12, color: 'var(--foreground)',
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <p className={cn('text-xl font-semibold tabular-nums',
        tone === 'up' ? 'text-emerald-500' : tone === 'down' ? 'text-destructive' : 'text-foreground')}>{value}</p>
    </div>
  )
}

const INCOME_COLORS = ['#5db8a0', '#7cc9b4', '#3f9d86', '#a8ddce', '#2c7a67']
const EXPENSE_COLORS = ['#f2a54a', '#e8734d', '#4a7fc9', '#7a9bd4', '#5ab0a8', '#d45a7a']

function DonutCard({ title, total, currency, slices, gran }: {
  title: string; total: number; currency: string
  slices: { key: string; name: string; amount: number; count: number; color: string; icon: string | null }[]
  gran: Granularity
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-[11px] text-muted-foreground mb-3 capitalize">{gran === 'months' ? 'Monthly' : gran === 'weeks' ? 'Weekly' : 'Daily'} view</p>
      {slices.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Nothing in this period</div>
      ) : (
        <>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie data={slices} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={1.5} stroke="none">
                  {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={((v: any, _n: any, p: any) => [`${formatMoney(Number(v), currency)} · ${((Number(v) / total) * 100).toFixed(1)}%`, p?.payload?.name]) as any}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-muted-foreground">Total</span>
              <span className="text-base font-semibold text-foreground tabular-nums">{formatMoney(total, currency, { compact: true })}</span>
            </div>
          </div>
          <div className="mt-3 divide-y divide-border">
            {slices.map((s) => (
              <div key={s.key} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + '22', color: s.color }}>
                  <MoneyIcon name={s.icon} size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.count} transaction{s.count === 1 ? '' : 's'} · {((s.amount / total) * 100).toFixed(1)}%</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">{formatMoney(s.amount, currency)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function MoneyDashboard({ accounts, categories }: Props) {
  const [range, setRange] = useState(() => presetRange('thisYear'))
  const [accountId, setAccountId] = useState('')
  const [note, setNote] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amountRange, setAmountRange] = useState<[number, number] | null>(null)
  const [balGran, setBalGran] = useState<Granularity>('months')
  const [changeGran, setChangeGran] = useState<Granularity>('months')

  const [data, setData] = useState<MoneyAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ start: range.start, end: range.end })
      if (accountId) qs.set('account_id', accountId)
      const res = await moneyApi.get(`/analytics?${qs.toString()}`)
      setData(res.data)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [range.start, range.end, accountId])

  useEffect(() => { load() }, [load])

  // reset amount range whenever the underlying data changes
  useEffect(() => { setAmountRange(null) }, [data])

  // close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const h = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [pickerOpen])

  const currency = data?.currency || accounts[0]?.currency || 'USD'

  // amount bounds over the (wallet-scoped) period, before other filters
  const bounds = useMemo<[number, number]>(() => {
    const txns = data?.transactions.filter((t) => t.type !== 'transfer') ?? []
    if (txns.length === 0) return [0, 0]
    const vals = txns.map(signed)
    return [Math.floor(Math.min(...vals)), Math.ceil(Math.max(...vals))]
  }, [data])

  const activeAmount = amountRange ?? bounds

  // transactions after category / note / amount filters (for change/donut/totals)
  const filtered = useMemo(() => {
    const q = note.trim().toLowerCase()
    return (data?.transactions ?? []).filter((t) => {
      if (t.type === 'transfer') return false
      if (categoryId && t.category_id !== categoryId) return false
      if (q && !(t.note || '').toLowerCase().includes(q) && !(t.category_name || '').toLowerCase().includes(q)) return false
      const s = signed(t)
      if (s < activeAmount[0] || s > activeAmount[1]) return false
      return true
    })
  }, [data, categoryId, note, activeAmount])

  const totals = useMemo(() => {
    let income = 0, expense = 0
    for (const t of filtered) { if (t.type === 'income') income += t.amount; else if (t.type === 'expense') expense += t.amount }
    const closing = (data?.openingBalance ?? 0) + (data?.transactions.reduce((s, t) => s + t.balanceDelta, 0) ?? 0)
    return { income, expense, change: income - expense, balance: closing }
  }, [filtered, data])

  // Account Balance area chart — running balance (wallet filter only, ignores txn filters)
  const balanceSeries = useMemo(() => {
    if (!data) return []
    const bk = buckets(range.start, range.end, balGran)
    let running = data.openingBalance
    let idx = 0
    const txns = data.transactions // already chronological
    return bk.map((b) => {
      while (idx < txns.length && txns[idx].occurred_at <= b.end) { running += txns[idx].balanceDelta; idx++ }
      return { label: b.label, balance: running }
    })
  }, [data, range.start, range.end, balGran])

  // Changes bar chart — net (income - expense) per bucket over filtered txns
  const changeSeries = useMemo(() => {
    const bk = buckets(range.start, range.end, changeGran)
    const map = new Map(bk.map((b) => [b.key, 0]))
    const keys = bk.map((b) => b.key)
    const bucketFor = (day: string) => {
      // last bucket whose key <= day
      let found = keys[0]
      for (const k of keys) { if (k <= day) found = k; else break }
      return found
    }
    for (const t of filtered) { const k = bucketFor(t.occurred_at); map.set(k, (map.get(k) ?? 0) + signed(t)) }
    return bk.map((b) => ({ label: b.label, net: map.get(b.key) ?? 0 }))
  }, [filtered, range.start, range.end, changeGran])

  const donutFor = (kind: 'income' | 'expense') => {
    const palette = kind === 'income' ? INCOME_COLORS : EXPENSE_COLORS
    const map = new Map<string, { key: string; name: string; amount: number; count: number; icon: string | null; color: string | null }>()
    for (const t of filtered) {
      if (t.type !== kind) continue
      const key = t.category_id || 'uncategorized'
      const ex = map.get(key)
      if (ex) { ex.amount += t.amount; ex.count++ }
      else map.set(key, { key, name: t.category_name || 'Uncategorized', amount: t.amount, count: 1, icon: t.category_icon, color: t.category_color })
    }
    const arr = Array.from(map.values()).sort((a, b) => b.amount - a.amount)
    return arr.map((s, i) => ({ ...s, color: s.color || palette[i % palette.length] }))
  }
  const incomeSlices = useMemo(() => donutFor('income'), [filtered])
  const expenseSlices = useMemo(() => donutFor('expense'), [filtered])

  const filtersActive = accountId || categoryId || note.trim() || amountRange
  const resetFilters = () => { setAccountId(''); setCategoryId(''); setNote(''); setAmountRange(null) }

  const rangeLen = daysBetween(range.start, range.end) + 1
  const shiftRange = (dir: -1 | 1) => setRange((r) => ({ start: addDays(r.start, dir * rangeLen), end: addDays(r.end, dir * rangeLen) }))

  const granOpts: { value: Granularity; label: string }[] = [
    { value: 'days', label: 'Days' }, { value: 'weeks', label: 'Weeks' }, { value: 'months', label: 'Months' },
  ]
  const GranTabs = ({ value, onChange }: { value: Granularity; onChange: (v: Granularity) => void }) => (
    <div className="inline-flex bg-muted border border-border rounded-lg p-0.5">
      {granOpts.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn('px-2.5 h-7 rounded-md text-xs font-medium transition-colors', value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          {o.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Date range navigator */}
      <div className="flex items-center justify-center gap-2" ref={pickerRef}>
        <button onClick={() => shiftRange(-1)} className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronLeft size={16} /></button>
        <div className="relative">
          <button onClick={() => setPickerOpen((o) => !o)} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40">
            {dayLabel(range.start)} <span className="text-muted-foreground">–</span> {dayLabel(range.end)}
            <CalendarIcon size={15} className="text-muted-foreground ml-1" />
          </button>
          {pickerOpen && (
            <div className="absolute z-30 mt-2 left-1/2 -translate-x-1/2 w-72 bg-card border border-border rounded-xl shadow-xl p-3 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { k: 'thisMonth', l: 'This month' }, { k: 'lastMonth', l: 'Last month' },
                  { k: 'last3', l: 'Last 3 months' }, { k: 'thisYear', l: 'This year' },
                  { k: 'lastYear', l: 'Last year' },
                ].map((p) => (
                  <button key={p.k} onClick={() => { setRange(presetRange(p.k)); setPickerOpen(false) }}
                    className="text-xs h-8 rounded-lg border border-border text-foreground hover:border-primary/40 hover:text-primary transition-colors">{p.l}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                <label className="block space-y-1">
                  <span className="text-[11px] text-muted-foreground">From</span>
                  <input type="date" value={range.start} max={range.end} onChange={(e) => e.target.value && setRange((r) => ({ ...r, start: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg h-8 px-2 text-xs text-foreground" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-muted-foreground">To</span>
                  <input type="date" value={range.end} min={range.start} onChange={(e) => e.target.value && setRange((r) => ({ ...r, end: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg h-8 px-2 text-xs text-foreground" />
                </label>
              </div>
            </div>
          )}
        </div>
        <button onClick={() => shiftRange(1)} className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronRight size={16} /></button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          {filtersActive && <button onClick={resetFilters} className="text-xs font-medium text-primary hover:opacity-80">Reset filters</button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">By wallet</span>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-muted border border-border rounded-lg h-9 px-2.5 text-sm text-foreground cursor-pointer">
              <option value="">All wallets</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">By category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-muted border border-border rounded-lg h-9 px-2.5 text-sm text-foreground cursor-pointer">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">By note</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Filter by specific keyword"
              className="w-full bg-muted border border-border rounded-lg h-9 px-3 text-sm text-foreground placeholder:text-muted-foreground" />
          </label>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">By amount</span>
            <RangeSlider min={bounds[0]} max={bounds[1]} value={activeAmount} onChange={setAmountRange} format={(n) => formatMoney(n, currency, { compact: true })} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" size={22} /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Balance" value={formatMoney(totals.balance, currency)} tone={totals.balance >= 0 ? 'up' : 'down'} />
            <StatCard label="Total Period Change" value={`${totals.change >= 0 ? '+' : '-'}${formatMoney(Math.abs(totals.change), currency)}`} tone={totals.change >= 0 ? 'up' : 'down'} />
            <StatCard label="Total Period Expenses" value={`-${formatMoney(totals.expense, currency)}`} tone="down" />
            <StatCard label="Total Period Income" value={`+${formatMoney(totals.income, currency)}`} tone="up" />
          </div>

          {/* Balance + Changes charts */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Account Balance</h3>
                  <p className="text-[11px] text-muted-foreground">{dayLabel(range.start)} – {dayLabel(range.end)}</p>
                </div>
                <GranTabs value={balGran} onChange={setBalGran} />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={balanceSeries} margin={{ left: 4, right: 8, top: 4 }}>
                    <defs>
                      <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5db8a0" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#5db8a0" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => formatMoney(v, currency, { compact: true })} />
                    <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => [formatMoney(Number(v), currency), 'Balance']) as any} />
                    <Area type="monotone" dataKey="balance" stroke="#5db8a0" strokeWidth={2} fill="url(#balFill)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Changes</h3>
                  <p className="text-[11px] text-muted-foreground">{dayLabel(range.start)} – {dayLabel(range.end)}</p>
                </div>
                <GranTabs value={changeGran} onChange={setChangeGran} />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={changeSeries} margin={{ left: 4, right: 8, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => formatMoney(v, currency, { compact: true })} />
                    <Tooltip contentStyle={tooltipStyle} formatter={((v: any) => [formatMoney(Number(v), currency), 'Net change']) as any} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                    <RBar dataKey="net" radius={[3, 3, 0, 0]} maxBarSize={28}>
                      {changeSeries.map((d, i) => <Cell key={i} fill={d.net >= 0 ? '#5db8a0' : '#f28b82'} />)}
                    </RBar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Income + Expense donuts */}
          <div className="grid gap-3 lg:grid-cols-2">
            <DonutCard title="Period Income" total={totals.income} currency={currency} slices={incomeSlices} gran={changeGran} />
            <DonutCard title="Period Expenses" total={totals.expense} currency={currency} slices={expenseSlices} gran={changeGran} />
          </div>
        </>
      )}
    </div>
  )
}
