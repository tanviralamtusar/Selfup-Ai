-- ═══════════════════════════════════════════════════════════
-- Goals with a strict deadline
--
-- A goal has a numeric target ("read 10 books", or 1 for a yes/no goal)
-- and a deadline day. Reaching the target on or before the deadline
-- completes it and awards XP. When the deadline passes first, the goal
-- is failed: it is locked and the user takes HP damage. Failing runs
-- server-side (lib/goals.service.ts) from the day check-in and the goals
-- API, guarded by the status transition so the penalty applies once.
--
-- Run this in the Supabase SQL editor. Idempotent.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description   TEXT,
  target_value  NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (target_value > 0),
  current_value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  unit          TEXT,
  deadline      DATE NOT NULL,
  difficulty    TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  xp_reward     INT NOT NULL DEFAULT 50,
  hp_penalty    INT NOT NULL DEFAULT 20,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','failed')),
  completed_at  TIMESTAMPTZ,
  failed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals (user_id, status, deadline);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_own" ON goals;
CREATE POLICY "goals_own" ON goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime for the website and the Android app.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'goals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
  END IF;
END $$;
