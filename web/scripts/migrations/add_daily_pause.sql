-- ═══════════════════════════════════════════════════════════
-- Pause a daily
--
-- A paused daily is not due: it is hidden from today's list, skipped
-- by the new-day check-in (no XP penalty, no HP damage, streak kept)
-- and sends no reminders.
--
--   paused_at    — when the pause started. NULL = not paused. Days from
--                  this one (in the user's zone) onward are paused.
--   paused_until — the day it becomes active again (resume date).
--                  NULL = paused until the user resumes it.
--
-- Logic: lib/daily-pause.ts (web) and isPausedOn() in
-- mobile/src/domain/selectors.ts.
--
-- Run this in the Supabase SQL editor. Idempotent.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE dailies ADD COLUMN IF NOT EXISTS paused_at    TIMESTAMPTZ;
ALTER TABLE dailies ADD COLUMN IF NOT EXISTS paused_until DATE;

COMMENT ON COLUMN dailies.paused_at    IS 'When the pause started; NULL = not paused';
COMMENT ON COLUMN dailies.paused_until IS 'Day the daily resumes; NULL = paused until resumed by hand';

NOTIFY pgrst, 'reload schema';
