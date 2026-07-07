import { NextRequest, NextResponse } from 'next/server'
import { authed, num } from '@/lib/money/server'
import { generateResponse } from '@/lib/gemma'
import { formatMoney, monthKey, monthLabel } from '@/lib/money/format'

/**
 * POST /api/money/insights
 * Builds a compact financial snapshot for the current month and asks the
 * SelfUp AI for spending insights + concrete money-management suggestions.
 */
export async function POST(req: NextRequest) {
  const { user, db, res } = await authed(req)
  if (res) return res

  const month = monthKey()
  const start = new Date(month + 'T00:00:00Z')
  const windowStart = new Date(start)
  windowStart.setUTCMonth(windowStart.getUTCMonth() - 2) // 3-month window

  const [txnRes, budgetRes, goalsRes, acctRes] = await Promise.all([
    db
      .from('money_transactions')
      .select('type, amount, occurred_at, category:money_categories(name)')
      .eq('user_id', user.id)
      .gte('occurred_at', windowStart.toISOString().slice(0, 10)),
    db.from('money_budgets').select('limit_amount, month, category:money_categories(name)').eq('user_id', user.id).eq('month', month),
    db.from('money_goals').select('name, target_amount, current_amount, is_achieved').eq('user_id', user.id),
    db.from('money_accounts').select('name, type, currency, opening_balance').eq('user_id', user.id),
  ])

  const txns = txnRes.data ?? []
  const currency = (acctRes.data?.[0] as any)?.currency || 'USD'
  const monthStr = start.toISOString().slice(0, 10)
  const monthEnd = new Date(start)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)
  const monthEndStr = monthEnd.toISOString().slice(0, 10)

  let income = 0
  let expense = 0
  const byCat = new Map<string, number>()
  for (const t of txns) {
    if (t.occurred_at >= monthStr && t.occurred_at < monthEndStr) {
      const amt = num(t.amount)
      if (t.type === 'income') income += amt
      else if (t.type === 'expense') {
        expense += amt
        const name = (t as any).category?.name || 'Uncategorized'
        byCat.set(name, (byCat.get(name) ?? 0) + amt)
      }
    }
  }

  if (income === 0 && expense === 0) {
    return NextResponse.json({
      success: true,
      insights: "You haven't logged any transactions this month yet. Add a few income and expense entries and I'll analyze your spending, flag categories that are creeping up, and suggest where to trim.",
    })
  }

  const topCats = Array.from(byCat.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([n, v]) => `- ${n}: ${formatMoney(v, currency)}`)
    .join('\n')

  const budgets = (budgetRes.data ?? [])
    .map((b: any) => `- ${b.category?.name}: limit ${formatMoney(num(b.limit_amount), currency)}`)
    .join('\n') || 'None set'

  const goals = (goalsRes.data ?? [])
    .map((g: any) => `- ${g.name}: ${formatMoney(num(g.current_amount), currency)} / ${formatMoney(num(g.target_amount), currency)}${g.is_achieved ? ' ✅' : ''}`)
    .join('\n') || 'None set'

  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  const prompt = `Here is my finance snapshot for ${monthLabel(month)}:

Income: ${formatMoney(income, currency)}
Expenses: ${formatMoney(expense, currency)}
Net (savings): ${formatMoney(income - expense, currency)} (savings rate ${savingsRate}%)

Top spending categories:
${topCats || 'None'}

Budgets:
${budgets}

Savings goals:
${goals}

Give me a short, sharp financial review. Cover: (1) how healthy this month looks, (2) the 1-2 categories worth watching or cutting, (3) whether I'm on track for my goals, and (4) two concrete actions for next month. Be specific with numbers. Keep it under 220 words, friendly but direct.`

  const system = `You are the SelfUp System AI acting as a personal finance coach. Be concrete, encouraging, and practical. Use short paragraphs or bullet points. Never invent numbers not present in the data.`

  try {
    const insights = await generateResponse(prompt, [], system, 'gemini-2.5-flash', 'chat')
    return NextResponse.json({ success: true, insights: insights || 'Could not generate insights right now. Try again in a moment.' })
  } catch {
    return NextResponse.json({ error: 'AI insights are temporarily unavailable. Please try again.' }, { status: 503 })
  }
}
