-- Optional enrichment for the global exercise library.
-- Run this in the Supabase SQL editor BEFORE `npm run seed:exercises`
-- to store exercise demo images and granular muscle data from
-- free-exercise-db (https://github.com/yuhonas/free-exercise-db).
--
-- Safe to run once; uses IF NOT EXISTS throughout.

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS primary_muscle    TEXT,     -- granular, e.g. 'quadriceps' (muscle_group stays the broad UI group)
  ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_urls        TEXT[] DEFAULT '{}';  -- demo step images (start/end position)

COMMENT ON COLUMN exercises.primary_muscle    IS 'Granular primary muscle from free-exercise-db (e.g. quadriceps, lats)';
COMMENT ON COLUMN exercises.secondary_muscles IS 'Granular secondary muscles from free-exercise-db';
COMMENT ON COLUMN exercises.image_urls        IS 'Demo image URLs (hosted on free-exercise-db GitHub raw)';
