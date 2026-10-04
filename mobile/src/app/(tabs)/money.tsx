import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import {
  contributeToGoal,
  createAccount,
  createGoal,
  createTransaction,
  deleteBudget,
  deleteGoal,
  deleteTransaction,
  postRecurring,
  setBudget,
} from '@/domain/actions'
import { formatMoney, useMoney, type MoneyView } from '@/domain/selectors'
import type { AccountType, MoneyGoal, TransactionType } from '@/domain/types'
import { monthKey, monthLabel, serverDay, shiftMonth } from '@/lib/dates'
import { requestSync } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePendingIds } from '@/sync/usePendingIds'
import { Body, Button, Card, Empty, H1, H2, Input, Muted, ProgressBar, Row, Screen, Segmented, Sheet } from '@/ui/primitives'
import { colors, radius, space } from '@/ui/theme'

type SheetKind = null | 'txn' | 'account' | 'budget' | 'goal' | { contribute: MoneyGoal }

export default function Money() {
  const [month, setMonth] = useState(monthKey())
  const [sheet, setSheet] = useState<SheetKind>(null)
  const m = useMoney(month)
  const pendingIds = usePendingIds()
  const syncing = useSyncStatus((s) => s.syncing)
  const c = m.currency

  const confirm = (title: string, onYes: () => void) =>
    Alert.alert(title, undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: onYes }])

  return (
    <Screen onRefresh={() => requestSync()} refreshing={syncing}>
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>Money</H1>
        <Row>
          <Button small variant="ghost" label="‹" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(month, -1))} />
          <Body style={{ minWidth: 110, textAlign: 'center' }}>{monthLabel(month)}</Body>
          <Button small variant="ghost" label="›" accessibilityLabel="Next month" onPress={() => setMonth(shiftMonth(month, 1))} />
        </Row>
      </Row>

      <Card>
        <Muted>Net worth</Muted>
        <Text style={styles.big}>{formatMoney(m.netWorth, c)}</Text>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Income" value={formatMoney(m.monthIncome, c)} color={colors.success} />
          <Stat label="Spent" value={formatMoney(m.monthExpense, c)} color={colors.danger} />
          <Stat label="Net" value={formatMoney(m.monthIncome - m.monthExpense, c)} />
        </Row>
        <Button label="+ Add transaction" onPress={() => setSheet('txn')} disabled={m.accounts.length === 0} />
        {m.accounts.length === 0 && <Muted>Add an account first.</Muted>}
      </Card>

      <Card>
        <H2 right={<Button small variant="ghost" label="+ Account" onPress={() => setSheet('account')} />}>Accounts</H2>
        {m.accounts.length === 0 ? <Empty text="No accounts yet." /> : m.accounts.map((a) => (
          <Row key={a.id} style={styles.line}>
            <View style={[styles.swatch, { backgroundColor: a.color ?? colors.primary }]} />
            <Body style={{ flex: 1 }}>{a.name}</Body>
            <Muted>{a.type}</Muted>
            <Body style={{ fontWeight: '600' }}>{formatMoney(a.balance, a.currency)}</Body>
          </Row>
        ))}
      </Card>

      {m.byCategory.length > 0 && (
        <Card>
          <H2>Spending by category</H2>
          {m.byCategory.slice(0, 6).map((b) => (
            <View key={b.id ?? 'none'} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body>{b.name}</Body>
                <Muted>{formatMoney(b.amount, c)}</Muted>
              </Row>
              <ProgressBar value={b.amount} max={m.monthExpense} color={b.color} />
            </View>
          ))}
        </Card>
      )}

      <Card>
        <H2>Transactions</H2>
        {m.monthTxns.length === 0 ? <Empty text="No transactions this month." /> : m.monthTxns.slice(0, 50).map((t) => {
          const cat = t.category_id ? m.categoryById.get(t.category_id) : undefined
          const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '⇄ '
          return (
            <Pressable key={t.id} onLongPress={() => confirm('Delete this transaction?', () => deleteTransaction(t.id))} style={styles.line} accessibilityHint="Long-press to delete">
              <View style={{ flex: 1 }}>
                <Body numberOfLines={1}>{t.note || cat?.name || (t.type === 'transfer' ? 'Transfer' : 'Uncategorized')}</Body>
                <Muted>{t.occurred_at}{cat && t.note ? ` · ${cat.name}` : ''}{pendingIds.has(t.id) ? ' · waiting to sync' : ''}</Muted>
              </View>
              <Body style={{ fontWeight: '600', color: t.type === 'income' ? colors.success : t.type === 'expense' ? colors.text : colors.textMuted }}>
                {sign}{formatMoney(Number(t.amount), t.currency)}
              </Body>
            </Pressable>
          )
        })}
      </Card>

      <Card>
        <H2 right={<Button small variant="ghost" label="+ Budget" onPress={() => setSheet('budget')} />}>Budgets</H2>
        {m.budgets.length === 0 ? <Empty text="No budgets for this month." /> : m.budgets.map((b) => (
          <Pressable key={b.id} onLongPress={() => confirm('Remove this budget?', () => deleteBudget(b.id))} style={{ gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>{b.category?.name ?? 'Category'}</Body>
              <Muted style={{ color: b.spent > b.limit_amount ? colors.danger : colors.textMuted }}>
                {formatMoney(b.spent, c)} / {formatMoney(b.limit_amount, c)}
              </Muted>
            </Row>
            <ProgressBar value={b.spent} max={b.limit_amount} color={b.spent > b.limit_amount ? colors.danger : colors.success} />
          </Pressable>
        ))}
      </Card>

      <Card>
        <H2 right={<Button small variant="ghost" label="+ Goal" onPress={() => setSheet('goal')} />}>Savings goals</H2>
        {m.goals.length === 0 ? <Empty text="No goals yet." /> : m.goals.map((g) => (
          <Pressable key={g.id} onLongPress={() => confirm(`Delete “${g.name}”?`, () => deleteGoal(g.id))} style={{ gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>{g.is_achieved ? '✅ ' : ''}{g.name}</Body>
              <Muted>{formatMoney(g.current_amount, g.currency)} / {formatMoney(g.target_amount, g.currency)}</Muted>
            </Row>
            <ProgressBar value={g.current_amount} max={g.target_amount} color={g.color ?? colors.success} />
            {!g.is_achieved && <Button small variant="ghost" label="Add money" onPress={() => setSheet({ contribute: g })} />}
          </Pressable>
        ))}
      </Card>

      {m.recurring.length > 0 && (
        <Card>
          <H2>Recurring</H2>
          {m.recurring.map((r) => (
            <Row key={r.id} style={styles.line}>
              <View style={{ flex: 1 }}>
                <Body>{r.name}</Body>
                <Muted>{r.cadence} · next {r.next_due}{r.next_due <= serverDay() ? ' · due' : ''}</Muted>
              </View>
              <Body>{r.type === 'income' ? '+' : '−'}{formatMoney(Number(r.amount), r.currency)}</Body>
              <Button small label="Post" onPress={() => postRecurring(r)} />
            </Row>
          ))}
        </Card>
      )}

      <TransactionSheet visible={sheet === 'txn'} onClose={() => setSheet(null)} m={m} />
      <AccountSheet visible={sheet === 'account'} onClose={() => setSheet(null)} currency={c} />
      <BudgetSheet visible={sheet === 'budget'} onClose={() => setSheet(null)} m={m} month={month} />
      <GoalSheet visible={sheet === 'goal'} onClose={() => setSheet(null)} currency={c} />
      <ContributeSheet goal={typeof sheet === 'object' && sheet ? sheet.contribute : null} onClose={() => setSheet(null)} />
    </Screen>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View>
      <Muted>{label}</Muted>
      <Text style={[styles.stat, color ? { color } : null]}>{value}</Text>
    </View>
  )
}

const parseAmount = (s: string) => Number(s.replace(/,/g, ''))

function TransactionSheet({ visible, onClose, m }: { visible: boolean; onClose: () => void; m: MoneyView }) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [toAccountId, setToAccountId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const account = accountId ?? m.accounts[0]?.id ?? null
  const cats = m.categories.filter((c) => c.kind === (type === 'income' ? 'income' : 'expense'))
  const amt = parseAmount(amount)
  const valid = amt > 0 && account && (type !== 'transfer' || (toAccountId && toAccountId !== account))

  const close = () => {
    setAmount('')
    setNote('')
    setCategoryId(null)
    onClose()
  }

  const save = async () => {
    if (!valid || !account) return
    const currency = m.accounts.find((a) => a.id === account)?.currency ?? m.currency
    await createTransaction({ type, amount: amt, account_id: account, to_account_id: toAccountId, category_id: categoryId, note, currency })
    close()
  }

  return (
    <Sheet visible={visible} title="New transaction" onClose={close}>
      <Segmented options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }] as const} value={type} onChange={setType} />
      <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" autoFocus />
      <Picker label={type === 'transfer' ? 'From account' : 'Account'} items={m.accounts.map((a) => ({ id: a.id, label: a.name }))} value={account} onChange={setAccountId} />
      {type === 'transfer' ? (
        <Picker label="To account" items={m.accounts.filter((a) => a.id !== account).map((a) => ({ id: a.id, label: a.name }))} value={toAccountId} onChange={setToAccountId} />
      ) : (
        <Picker label="Category" items={cats.map((c) => ({ id: c.id, label: c.name }))} value={categoryId} onChange={setCategoryId} allowNone />
      )}
      <Input label="Note (optional)" value={note} onChangeText={setNote} maxLength={200} />
      <Button label="Save" onPress={save} disabled={!valid} />
      {type !== 'transfer' && <Muted>+5 XP when it syncs.</Muted>}
    </Sheet>
  )
}

function AccountSheet({ visible, onClose, currency }: { visible: boolean; onClose: () => void; currency: string }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [opening, setOpening] = useState('')
  const [cur, setCur] = useState(currency)

  const close = () => {
    setName('')
    setOpening('')
    onClose()
  }
  const valid = name.trim().length > 0 && !Number.isNaN(parseAmount(opening || '0')) && /^[A-Z]{3}$/.test(cur)

  return (
    <Sheet visible={visible} title="New account" onClose={close}>
      <Input label="Name" value={name} onChangeText={setName} autoFocus maxLength={60} />
      <Segmented label="Type" options={[{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank' }, { value: 'card', label: 'Card' }, { value: 'investment', label: 'Investment' }, { value: 'other', label: 'Other' }] as const} value={type} onChange={setType} />
      <Input label="Opening balance" value={opening} onChangeText={setOpening} keyboardType="decimal-pad" placeholder="0" />
      <Input label="Currency (3 letters)" value={cur} onChangeText={(v) => setCur(v.toUpperCase())} maxLength={3} autoCapitalize="characters" />
      <Button
        label="Save"
        disabled={!valid}
        onPress={async () => {
          await createAccount({ name, type, currency: cur, opening_balance: parseAmount(opening || '0') })
          close()
        }}
      />
    </Sheet>
  )
}

function BudgetSheet({ visible, onClose, m, month }: { visible: boolean; onClose: () => void; m: MoneyView; month: string }) {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [limit, setLimit] = useState('')
  const lim = parseAmount(limit)
  const close = () => {
    setLimit('')
    setCategoryId(null)
    onClose()
  }
  return (
    <Sheet visible={visible} title={`Budget · ${monthLabel(month)}`} onClose={close}>
      <Picker label="Category" items={m.categories.filter((c) => c.kind === 'expense').map((c) => ({ id: c.id, label: c.name }))} value={categoryId} onChange={setCategoryId} />
      <Input label="Monthly limit" value={limit} onChangeText={setLimit} keyboardType="decimal-pad" />
      <Button
        label="Save"
        disabled={!categoryId || !(lim >= 0) || !limit}
        onPress={async () => {
          if (!categoryId) return
          const existing = m.budgets.find((b) => b.category_id === categoryId) ?? null
          await setBudget(existing, categoryId, month, lim)
          close()
        }}
      />
    </Sheet>
  )
}

function GoalSheet({ visible, onClose, currency }: { visible: boolean; onClose: () => void; currency: string }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const t = parseAmount(target)
  const close = () => {
    setName('')
    setTarget('')
    onClose()
  }
  return (
    <Sheet visible={visible} title="New savings goal" onClose={close}>
      <Input label="Name" value={name} onChangeText={setName} autoFocus maxLength={80} />
      <Input label={`Target (${currency})`} value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <Button
        label="Save"
        disabled={!name.trim() || !(t > 0)}
        onPress={async () => {
          await createGoal({ name, target_amount: t, currency })
          close()
        }}
      />
    </Sheet>
  )
}

function ContributeSheet({ goal, onClose }: { goal: MoneyGoal | null; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const a = parseAmount(amount)
  const close = () => {
    setAmount('')
    onClose()
  }
  return (
    <Sheet visible={Boolean(goal)} title={goal ? `Add to “${goal.name}”` : ''} onClose={close}>
      <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />
      <Button
        label="Add"
        disabled={!(a > 0)}
        onPress={async () => {
          if (goal) await contributeToGoal(goal, a)
          close()
        }}
      />
      <Muted>+8 XP when it syncs (+25 if it completes the goal).</Muted>
    </Sheet>
  )
}

/** Simple wrap-around chip picker (lists here are short). */
function Picker({ label, items, value, onChange, allowNone }: { label: string; items: { id: string; label: string }[]; value: string | null; onChange: (id: string | null) => void; allowNone?: boolean }) {
  return (
    <View style={{ gap: space.xs }}>
      <Muted style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: 12 }}>{label}</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {allowNone && <Chip label="None" selected={value === null} onPress={() => onChange(null)} />}
        {items.map((i) => (
          <Chip key={i.id} label={i.label} selected={value === i.id} onPress={() => onChange(i.id)} />
        ))}
        {items.length === 0 && <Muted>Nothing to choose yet.</Muted>}
      </View>
    </View>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  big: { color: colors.text, fontSize: 30, fontWeight: '700' },
  stat: { color: colors.text, fontSize: 15, fontWeight: '600' },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  chip: { paddingHorizontal: space.md, minHeight: 34, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.primary },
})
