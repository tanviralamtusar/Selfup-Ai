# SelfUp — Money Module

> **Status:** Live (merged on `fitness-v2`, July 2026). Schema: `web/scripts/migrations/create_money.sql`.

A personal-finance suite: accounts, income/expense/transfer transactions, monthly per-category budgets, recurring bills and income, savings goals, analytics, and AI spending insights. Logging money activity earns XP.

---

## Where things live

| Concern | Path |
| --- | --- |
| Page (tabs + month switcher) | `web/src/app/(protected)/money/page.tsx` |
| Views | `web/src/components/money/` — `MoneyOverview`, `MoneyDashboard`, `TransactionsView`, `BudgetsView`, `RecurringView`, `GoalsView`, `AccountModal`, `TransactionModal`, `shared.tsx` |
| Client API wrapper | `web/src/lib/money/client.ts` (`moneyFetch`, `moneyApi`) |
| Server helpers | `web/src/lib/money/server.ts` (`authed`, `getDb`, `num`) |
| Formatting | `web/src/lib/money/format.ts` (`formatMoney`, `signedAmount`, `monthKey`, `monthLabel`, `CURRENCIES`) |
| Types | `web/src/types/money.ts` |
| API | `web/src/app/api/money/**` |

Nav entry: **Money** (Wallet icon) in `AppShell.tsx`, route constant `ROUTES.MONEY`.

## Tabs

| Tab | What it shows |
| --- | --- |
| Overview | Net worth, month income/expense, spend by category, 6-month trend, budgets and goals at a glance |
| Dashboard | Bluecoins-style analytics: running balance, period changes, category donuts, day/week/month bucketing, filterable by account |
| Transactions | Filterable list; add/edit/delete |
| Budgets | Per-category monthly limits with spent amount |
| Recurring | Bills/income/subscriptions with "post now" |
| Goals | Savings goals with contributions |

## Data model rules

- **Amounts are always positive.** `type` (`income` / `expense` / `transfer`) gives the sign; use `signedAmount()`.
- **Transfers:** `account_id` is the source and `to_account_id` the destination.
- **Balances are computed** as `opening_balance + Σ transactions` and never stored, so edits and deletes can't desync them.
- **Categories:** rows with `user_id IS NULL` are global defaults that every user can read; users can add their own.
- **Budgets:** `month` is the first day of the month (`YYYY-MM-01`), unique per `(user_id, category_id, month)`.
- **Currency:** stored per account and transaction; there is no FX conversion, and summaries assume a single currency.
- **Recurring:** `POST /api/money/recurring/[id]/post` creates the transaction and advances `next_due`. The `auto_post` flag is saved but **nothing auto-posts yet**, because no scheduled job reads it.

See `database_structure.md` → *Money Module* for full columns.

## API

All routes require `Authorization: Bearer <supabase access token>` and query as the user, with RLS scoping rows to their owner.

| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/money/accounts` | |
| PATCH, DELETE | `/api/money/accounts/[id]` | |
| GET, POST | `/api/money/categories` | GET includes global defaults |
| PATCH, DELETE | `/api/money/categories/[id]` | |
| GET, POST | `/api/money/transactions` | Filters: `month`, `type`, `category_id`, `account_id`, `limit`. POST awards XP |
| PATCH, DELETE | `/api/money/transactions/[id]` | |
| GET, POST, DELETE | `/api/money/budgets` | `?month=YYYY-MM-01`; GET includes spent per category |
| GET, POST | `/api/money/recurring` | |
| PATCH, DELETE | `/api/money/recurring/[id]` | |
| POST | `/api/money/recurring/[id]/post` | Post now + advance `next_due` |
| GET, POST | `/api/money/goals` | |
| PATCH, DELETE | `/api/money/goals/[id]` | `{ contribute: n }` adds to `current_amount` and awards XP |
| GET | `/api/money/summary` | `?month=` — everything the Overview tab needs |
| GET | `/api/money/analytics` | `?start=&end=&account_id=` — opening balance + signed transactions for the Dashboard tab |
| POST | `/api/money/insights` | AI insights for the current month (`gemini-2.5-flash` via `generateResponse`); 503 if the AI call fails |

## XP

Awarded through `GamificationService.addXp(..., { actionType: 'money' })`:

| Action | XP |
| --- | --- |
| Log an income or expense transaction | +5 (stored in `money_transactions.xp_earned`) |
| Log a transfer | 0 |
| Contribute to a goal | +8 |
| Contribution that completes a goal | +25 bonus |
