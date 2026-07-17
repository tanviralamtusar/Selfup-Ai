import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'

/**
 * GET /api/money/analytics?start=YYYY-MM-DD&end=YYYY-MM-DD&account_id=
 *
 * Powers the Money → Dashboard view (Bluecoins-style analytics). Returns the
 * opening balance at `start` plus every transaction inside the period, each
 * annotated with its signed effect on the (optionally wallet-filtered) balance
 * so the client can compute running balances, changes and category donuts —
 * and re-bucket them by day/week/month — without another round trip.
 *
 * `end` is inclusive. Category / note / amount filters are applied client-side.
 */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const sp = req.nextUrl.searchParams

  const start = sp.get('start')
  const end = sp.get('end')
  if (!start || !end) {
    return NextResponse.json({ error: 'start and end are required (YYYY-MM-DD)' }, { status: 400 })
  }
  // Make `end` inclusive by querying up to the following day (exclusive).
  const endExclusive = new Date(end + 'T00:00:00Z')
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1)
  const endExclusiveStr = endExclusive.toISOString().slice(0, 10)

  const accountId = sp.get('account_id') || null

  const [accountsRes, txnRes] = await Promise.all([
    db.from('money_accounts').select('id, currency, opening_balance').eq('user_id', user.id),
    db
      .from('money_transactions')
      .select('id, type, amount, note, occurred_at, account_id, to_account_id, category_id, category:money_categories(id,name,color,icon)')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  if (accountsRes.error) return NextResponse.json({ error: accountsRes.error.message }, { status: 500 })
  if (txnRes.error) return NextResponse.json({ error: txnRes.error.message }, { status: 500 })

  const accounts = accountsRes.data ?? []
  const currency = (accountId ? accounts.find((a) => a.id === accountId)?.currency : accounts[0]?.currency) || 'USD'

  // Signed effect of a transaction on the (optionally wallet-filtered) balance.
  const balanceDeltaOf = (t: any): number => {
    const amt = num(t.amount)
    if (t.type === 'income') return !accountId || t.account_id === accountId ? amt : 0
    if (t.type === 'expense') return !accountId || t.account_id === accountId ? -amt : 0
    // transfer: nets to zero in aggregate; only matters for a specific wallet
    if (t.type === 'transfer') {
      if (!accountId) return 0
      let d = 0
      if (t.account_id === accountId) d -= amt
      if (t.to_account_id === accountId) d += amt
      return d
    }
    return 0
  }

  // Opening balance at period start: account opening balances (wallet-filtered)
  // plus the signed effect of every transaction strictly before `start`.
  let openingBalance = accounts
    .filter((a) => !accountId || a.id === accountId)
    .reduce((s, a) => s + num(a.opening_balance), 0)

  const period: any[] = []
  for (const t of txnRes.data ?? []) {
    const day = (t.occurred_at as string).slice(0, 10)
    if (day < start) {
      openingBalance += balanceDeltaOf(t)
    } else if (day < endExclusiveStr) {
      const cat = (t as any).category
      period.push({
        id: t.id,
        occurred_at: day,
        type: t.type,
        amount: num(t.amount),
        note: t.note,
        account_id: t.account_id,
        category_id: t.category_id,
        category_name: cat?.name ?? null,
        category_color: cat?.color ?? null,
        category_icon: cat?.icon ?? null,
        balanceDelta: balanceDeltaOf(t),
      })
    }
  }

  return NextResponse.json({
    success: true,
    data: { currency, start, end, openingBalance, transactions: period },
  })
}
