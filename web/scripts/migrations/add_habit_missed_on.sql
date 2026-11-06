-- ═══════════════════════════════════════════════════════════
-- Habit "−" (missed) button
--
-- Each habit has a + button (did it: XP, streak +1) and a − button
-- (didn't do it: HP damage, streak reset). `missed_on` is the user-local
-- day the − was last pressed, so a habit can be marked missed at most once
-- per day and the UI can show the missed state. A later + on the same day
-- still counts; the habit then reads as done.
--
-- Set only by POST /api/habits/[id]/miss.
--
-- Run this in the Supabase SQL editor. Idempotent.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE habits ADD COLUMN IF NOT EXISTS missed_on DATE;

COMMENT ON COLUMN habits.missed_on IS 'User-local day the habit was last marked missed (− button); NULL = never';

NOTIFY pgrst, 'reload schema';
