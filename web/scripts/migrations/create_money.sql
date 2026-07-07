-- ═══════════════════════════════════════════════════════════
-- Money Management module
--
-- A personal-finance suite for SelfUp: accounts, income/expense
-- transactions, per-category monthly budgets, recurring bills, and
-- savings goals. Amounts are NUMERIC(14,2); a single currency per
-- account (no FX conversion in the summary — assume one currency).
--
-- Account balances are COMPUTED (opening_balance + Σ transactions),
-- so edits/deletes never leave a stored balance out of sync.
--
-- Run this in the Supabase SQL editor. Idempotent (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════

-- ── Accounts (cash / bank / card / investment / other) ──────
CREATE TABLE IF NOT EXISTS money_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'cash'
                    CHECK (type IN ('cash','bank','card','investment','other')),
  currency        TEXT NOT NULL DEFAULT 'USD',
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  color           TEXT DEFAULT '#9c7ef0',
  icon            TEXT DEFAULT 'wallet',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Categories (income / expense) ───────────────────────────
-- user_id NULL = system/global default category, visible to everyone.
CREATE TABLE IF NOT EXISTS money_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('income','expense')),
  icon        TEXT DEFAULT 'tag',
  color       TEXT DEFAULT '#7a7a8a',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Transactions (income / expense / transfer) ──────────────
-- amount is always POSITIVE; `type` gives the sign. For transfers,
-- account_id = source, to_account_id = destination.
CREATE TABLE IF NOT EXISTS money_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id     UUID REFERENCES money_accounts(id) ON DELETE SET NULL,
  to_account_id  UUID REFERENCES money_accounts(id) ON DELETE SET NULL,
  category_id    UUID REFERENCES money_categories(id) ON DELETE SET NULL,
  type           TEXT NOT NULL DEFAULT 'expense'
                   CHECK (type IN ('income','expense','transfer')),
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency       TEXT NOT NULL DEFAULT 'USD',
  note           TEXT,
  occurred_at    DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  xp_earned      INT DEFAULT 0,
  recurring_id   UUID,  -- set when auto-posted from a recurring rule
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Budgets (per category, per month) ───────────────────────
-- month = first day of the budgeted month (e.g. 2026-07-01).
CREATE TABLE IF NOT EXISTS money_budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES money_categories(id) ON DELETE CASCADE,
  month         DATE NOT NULL,
  limit_amount  NUMERIC(14,2) NOT NULL CHECK (limit_amount >= 0),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, category_id, month)
);

-- ── Recurring bills / income / subscriptions ────────────────
CREATE TABLE IF NOT EXISTS money_recurring (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id     UUID REFERENCES money_accounts(id) ON DELETE SET NULL,
  category_id    UUID REFERENCES money_categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income','expense')),
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency       TEXT NOT NULL DEFAULT 'USD',
  cadence        TEXT NOT NULL DEFAULT 'monthly'
                   CHECK (cadence IN ('weekly','monthly','yearly')),
  next_due       DATE NOT NULL,
  auto_post      BOOLEAN NOT NULL DEFAULT false,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  last_posted_at DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Savings goals ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS money_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'USD',
  target_date    DATE,
  color          TEXT DEFAULT '#5db8a0',
  icon           TEXT DEFAULT 'target',
  is_achieved    BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_money_accounts_user      ON money_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_money_categories_user    ON money_categories (user_id);
CREATE INDEX IF NOT EXISTS idx_money_tx_user            ON money_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_money_tx_user_date       ON money_transactions (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_money_tx_account         ON money_transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_money_tx_category        ON money_transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_money_budgets_user_month ON money_budgets (user_id, month);
CREATE INDEX IF NOT EXISTS idx_money_recurring_user     ON money_recurring (user_id);
CREATE INDEX IF NOT EXISTS idx_money_goals_user         ON money_goals (user_id);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security — every row is owned by its user.
-- Categories additionally expose global rows (user_id IS NULL) read-only.
-- ═══════════════════════════════════════════════════════════
ALTER TABLE money_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_budgets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_recurring    ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_goals        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "money_accounts_own" ON money_accounts;
CREATE POLICY "money_accounts_own" ON money_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Categories: read own OR global; write only own.
DROP POLICY IF EXISTS "money_categories_read" ON money_categories;
CREATE POLICY "money_categories_read" ON money_categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "money_categories_write" ON money_categories;
CREATE POLICY "money_categories_write" ON money_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "money_categories_modify" ON money_categories;
CREATE POLICY "money_categories_modify" ON money_categories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "money_categories_delete" ON money_categories;
CREATE POLICY "money_categories_delete" ON money_categories
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "money_transactions_own" ON money_transactions;
CREATE POLICY "money_transactions_own" ON money_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "money_budgets_own" ON money_budgets;
CREATE POLICY "money_budgets_own" ON money_budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "money_recurring_own" ON money_recurring;
CREATE POLICY "money_recurring_own" ON money_recurring
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "money_goals_own" ON money_goals;
CREATE POLICY "money_goals_own" ON money_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- Seed global default categories (idempotent by name+kind where global).
-- ═══════════════════════════════════════════════════════════
INSERT INTO money_categories (user_id, name, kind, icon, color)
SELECT NULL, v.name, v.kind, v.icon, v.color
FROM (VALUES
  ('Salary',        'income',  'briefcase',   '#5db8a0'),
  ('Freelance',     'income',  'laptop',      '#4fa3d1'),
  ('Investments',   'income',  'trending-up', '#9c7ef0'),
  ('Gifts',         'income',  'gift',        '#d4a84b'),
  ('Other Income',  'income',  'plus-circle', '#7a7a8a'),
  ('Food & Dining', 'expense', 'utensils',    '#f28b82'),
  ('Groceries',     'expense', 'shopping-cart','#5db8a0'),
  ('Housing',       'expense', 'home',        '#9c7ef0'),
  ('Transport',     'expense', 'car',         '#4fa3d1'),
  ('Utilities',     'expense', 'plug',        '#d4a84b'),
  ('Shopping',      'expense', 'shopping-bag','#e879a6'),
  ('Entertainment', 'expense', 'clapperboard','#c084fc'),
  ('Health',        'expense', 'heart-pulse', '#f87171'),
  ('Subscriptions', 'expense', 'repeat',      '#818cf8'),
  ('Education',     'expense', 'graduation-cap','#38bdf8'),
  ('Other Expense', 'expense', 'circle',      '#7a7a8a')
) AS v(name, kind, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM money_categories c
  WHERE c.user_id IS NULL AND c.name = v.name AND c.kind = v.kind
);
