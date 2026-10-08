-- ═══════════════════════════════════════════════════════════
-- Time range on dailies, habits and to-dos
--
-- A task can be scheduled either at a single time ("09:00") or over a
-- time range ("09:00–10:30"). Both are stored in the same two columns:
--
--   scheduled_time — the time, or the START of the range. NULL = unscheduled.
--   end_time       — NULL for a single time; the END of the range otherwise.
--
-- So `end_time IS NOT NULL` is what makes a task a range, and a range
-- always has a start. Habits had no time at all before this, so they get
-- both columns. Times are a Postgres TIME, read in the user's own zone
-- (the phone's zone on Android), exactly like `dailies.scheduled_time`
-- already was.
--
-- Reminders: a single time rings once; a range rings at the start and
-- again at the end (mobile/src/lib/notifications.ts).
--
-- Run this in the Supabase SQL editor. Idempotent.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE dailies ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE todos   ADD COLUMN IF NOT EXISTS end_time TIME;

-- Habits had no scheduled time before; add the start as well as the end.
ALTER TABLE habits  ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE habits  ADD COLUMN IF NOT EXISTS end_time       TIME;

-- A range needs a start, and must not end before it begins. Times are
-- same-day only, so an overnight range isn't expressible (and the UI
-- doesn't offer one).
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['dailies', 'habits', 'todos'] LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', t, t || '_time_range_valid');
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I CHECK (end_time IS NULL OR (scheduled_time IS NOT NULL AND end_time > scheduled_time))',
      t, t || '_time_range_valid'
    );
  END LOOP;
END $$;

COMMENT ON COLUMN dailies.end_time IS 'End of the time range; NULL means scheduled_time is a single time';
COMMENT ON COLUMN todos.end_time   IS 'End of the time range; NULL means scheduled_time is a single time';
COMMENT ON COLUMN habits.scheduled_time IS 'Time, or start of the time range; NULL = unscheduled';
COMMENT ON COLUMN habits.end_time       IS 'End of the time range; NULL means scheduled_time is a single time';

NOTIFY pgrst, 'reload schema';
