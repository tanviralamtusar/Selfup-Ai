-- ═══════════════════════════════════════════════════════════
-- Day Cron / New-Day Check-in  (Habitica-style)
--
-- Until now nothing ever reset `dailies.is_completed` — once a daily
-- was ticked it stayed ticked forever, and missed dailies never cost
-- anything. This adds the state needed to run a per-user "new day":
--
--   user_profiles.last_cron_date  — the last day already rolled over.
--                                   Cron is due when it is < today.
--   dailies.current_streak        — consecutive days completed.
--   dailies.longest_streak        — best run, for display.
--
-- Also hardens the xp_transactions idempotency guard that
-- TaskEconomyService.awardXp relies on to prevent double awards.
--
-- Run this in the Supabase SQL editor. Idempotent (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════

-- ── New-day rollover state ─────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_cron_date DATE;

ALTER TABLE dailies
  ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0;

-- Existing users start "already rolled over today" so the very first
-- check-in modal does not retroactively punish them for history the
-- app was never tracking.
UPDATE user_profiles
   SET last_cron_date = CURRENT_DATE
 WHERE last_cron_date IS NULL;

-- ── XP idempotency guard ───────────────────────────────────
-- awardXp depends on a unique violation (23505) to detect a repeat
-- award. Without this index a double-submit silently grants XP twice.

-- Collapse any duplicates that accumulated while the index was absent,
-- keeping the earliest row per key.
DELETE FROM xp_transactions a
 USING xp_transactions b
 WHERE a.user_id     = b.user_id
   AND a.source_type = b.source_type
   AND a.source_id   = b.source_id
   AND a.ctid        > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_source_uniq
  ON xp_transactions (user_id, source_type, source_id);

-- Lookup index for the check-in screen (yesterday's awards).
CREATE INDEX IF NOT EXISTS xp_transactions_user_created_idx
  ON xp_transactions (user_id, created_at DESC);
