import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'
import { GamificationService } from '@/lib/gamification.service'

const XP_PER_LOG = 5

/**
 * GET /api/money/transactions
 * Filters: ?month=YYYY-MM-01  ?type=  ?category_id=  ?account_id=  ?limit=
 */
export async function GET(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const sp = req.nextUrl.searchParams

  let q = db
    .from('money_transactions')
    .select('*, category:money_categories(id,name,kind,icon,color), account:money_accounts!money_transactions_account_id_fkey(id,name,color,icon)')
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })

  const month = sp.get('month')
  if (month) {
    const start = new Date(month + 'T00:00:00Z')
    const end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    q = q.gte('occurred_at', start.toISOString().slice(0, 10)).lt('occurred_at', end.toISOString().slice(0, 10))
  }
  const type = sp.get('type')
  if (type) q = q.eq('type', type)
  const categoryId = sp.get('category_id')
  if (categoryId) q = q.eq('category_id', categoryId)
  const accountId = sp.get('account_id')
  if (accountId) q = q.eq('account_id', accountId)
  const limit = sp.get('limit')
  if (limit) q = q.limit(parseInt(limit, 10))

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: (data ?? []).map((t) => ({ ...t, amount: num(t.amount) })) })
}

/** POST /api/money/transactions — log a transaction and award XP. */
export async function POST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res
  const body = await req.json()

  const {
    account_id = null,
    to_account_id = null,
    category_id = null,
    type = 'expense',
    amount,
    currency = 'USD',
    note = null,
    occurred_at,
  } = body

  if (!['income', 'expense', 'transfer'].includes(type)) {
    return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
  }
  const amt = num(amount)
  if (!(amt > 0)) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  if (type === 'transfer' && (!account_id || !to_account_id || account_id === to_account_id)) {
    return NextResponse.json({ error: 'Transfers need distinct source and destination accounts' }, { status: 400 })
  }

  const { data, error } = await db
    .from('money_transactions')
    .insert({
      user_id: user.id,
      account_id,
      to_account_id: type === 'transfer' ? to_account_id : null,
      category_id: type === 'transfer' ? null : category_id,
      type,
      amount: amt,
      currency,
      note: note?.trim() || null,
      occurred_at: occurred_at || undefined,
      xp_earned: type === 'transfer' ? 0 : XP_PER_LOG,
    })
    .select('*, category:money_categories(id,name,kind,icon,color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Award XP for logging (not for internal transfers).
  let leveledUp = false
  let levelUpDetails
  if (type !== 'transfer') {
    const g = new GamificationService(db)
    const result = await g.addXp(user.id, XP_PER_LOG, { actionType: 'money' })
    leveledUp = result.leveledUp
    levelUpDetails = result.details
    await g.updateOverallStreak(user.id)
  }

  return NextResponse.json({ success: true, data: { ...data, amount: amt }, xpAwarded: data.xp_earned, leveledUp, levelUpDetails })
}
