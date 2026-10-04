-- ═══════════════════════════════════════════════════════════
-- Mobile offline sync + realtime
--
-- The Android app (mobile/) works offline: every change is applied to
-- its local SQLite store and queued in an outbox, then replayed against
-- the normal /api routes when the phone is back online. Two things make
-- that replay safe:
--
--   sync_idempotency — each queued op carries an `Idempotency-Key`
--     header. The first request claims the key and stores its response;
--     a retry (e.g. the response was lost when the network dropped)
--     gets the stored response instead of running the mutation again,
--     so a goal contribution or transaction can never be applied twice.
--
--   supabase_realtime publication — the app and the website subscribe
--     to postgres_changes on these tables, so a change made on either
--     side shows up on the other within about a second.
--
-- Run this in the Supabase SQL editor. Idempotent.
-- ═══════════════════════════════════════════════════════════

-- ── Idempotency keys ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_idempotency (
  user_id         UUID NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  method          TEXT NOT NULL,
  path            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
  response_status INT,
  response_body   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_sync_idempotency_created ON sync_idempotency (created_at);

ALTER TABLE sync_idempotency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_idempotency_own" ON sync_idempotency;
CREATE POLICY "sync_idempotency_own" ON sync_idempotency
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Keys only need to outlive the longest offline stretch. Prune anything
-- older than 30 days (safe to run any time; also run periodically).
DELETE FROM sync_idempotency WHERE created_at < now() - interval '30 days';

-- ── Realtime ───────────────────────────────────────────────
-- Add each synced table to the realtime publication if it is not there
-- yet. RLS still applies to INSERT/UPDATE events, so a subscriber only
-- receives its own rows.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_profiles',
    'dailies', 'habits', 'todos', 'pomodoro_sessions',
    'money_accounts', 'money_categories', 'money_transactions',
    'money_budgets', 'money_recurring', 'money_goals'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
