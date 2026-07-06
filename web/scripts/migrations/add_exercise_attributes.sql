-- ═══════════════════════════════════════════════════════════
-- Phase 1 — Exercise Attributes Model (adapted from workout-cool)
--
-- workout-cool normalizes exercise metadata into an EAV system
-- (exercise_attributes → attribute_names / attribute_values with
--  TYPE, PRIMARY_MUSCLE, SECONDARY_MUSCLE, EQUIPMENT, MECHANICS_TYPE).
-- For this Supabase table we adopt the same *concepts* as denormalized
-- columns — simpler to query, no join explosion, RLS-friendly.
--
-- Run this in the Supabase SQL editor BEFORE `npm run seed:exercises`.
-- Safe to run once; uses IF NOT EXISTS throughout.
-- Complements add_exercise_media_columns.sql (primary_muscle,
-- secondary_muscles, image_urls) — run that one too if you haven't.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS exercise_type  TEXT,   -- workout-cool TYPE: strength | cardio | stretching | plyometrics | powerlifting | strongman | ...
  ADD COLUMN IF NOT EXISTS mechanics_type TEXT,   -- workout-cool MECHANICS_TYPE: compound | isolation
  ADD COLUMN IF NOT EXISTS force_type     TEXT;    -- push | pull | static

-- Also ensure the media/muscle columns exist (idempotent — mirrors
-- add_exercise_media_columns.sql so this migration is self-sufficient).
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS primary_muscle    TEXT,
  ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_urls        TEXT[] DEFAULT '{}';

COMMENT ON COLUMN exercises.exercise_type  IS 'Exercise category/type (workout-cool TYPE attribute)';
COMMENT ON COLUMN exercises.mechanics_type IS 'compound | isolation (workout-cool MECHANICS_TYPE)';
COMMENT ON COLUMN exercises.force_type     IS 'push | pull | static';

-- Helpful indexes for the muscle-map picker & filtered browsing
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises (primary_muscle);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment      ON exercises (equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_type           ON exercises (exercise_type);
