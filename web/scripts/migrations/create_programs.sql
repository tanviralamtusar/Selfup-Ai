-- ═══════════════════════════════════════════════════════════
-- Phase 4 — Structured Programs (adapted from workout-cool)
--
-- workout-cool: Program → Week → Session → SessionExercise (+SuggestedSet)
-- plus UserProgramEnrollment / UserSessionProgress.
-- Adapted for Supabase: UUID PKs, single-language (i18n columns dropped),
-- suggested sets folded into JSONB, FKs to user_profiles / exercises,
-- and RLS policies (published catalog readable by all; enrollments/progress
-- owned by the user).
--
-- Run this in the Supabase SQL editor. Idempotent (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════

-- ── Program template ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT UNIQUE,
  title                TEXT NOT NULL,
  description          TEXT,
  category             TEXT,
  image_url            TEXT,
  level                TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner','intermediate','advanced')),
  program_type         TEXT,                          -- strength | hypertrophy | endurance | ...
  duration_weeks       INT NOT NULL DEFAULT 4,
  sessions_per_week    INT NOT NULL DEFAULT 3,
  session_duration_min INT NOT NULL DEFAULT 30,
  equipment            TEXT[] DEFAULT '{}',
  is_premium           BOOLEAN DEFAULT false,
  is_active            BOOLEAN DEFAULT true,
  visibility           TEXT DEFAULT 'published' CHECK (visibility IN ('draft','published')),
  participant_count    INT DEFAULT 0,
  created_by           UUID REFERENCES user_profiles(id) ON DELETE SET NULL,  -- NULL = system/global
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ── Week ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_weeks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number  INT NOT NULL,
  title        TEXT,
  description  TEXT,
  UNIQUE (program_id, week_number)
);

-- ── Session (a day within a week) ───────────────────────────
CREATE TABLE IF NOT EXISTS program_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id           UUID NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
  session_number    INT NOT NULL,
  title             TEXT,
  description       TEXT,
  equipment         TEXT[] DEFAULT '{}',
  estimated_minutes INT DEFAULT 30,
  UNIQUE (week_id, session_number)
);

-- ── Session exercise (with suggested sets as JSONB) ─────────
-- suggested_sets: [{ set_index, type, reps, weight, unit, seconds }]
CREATE TABLE IF NOT EXISTS program_session_exercises (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  exercise_id    UUID NOT NULL REFERENCES exercises(id),
  order_index    INT NOT NULL DEFAULT 0,
  instructions   TEXT,
  suggested_sets JSONB DEFAULT '[]'::jsonb,
  UNIQUE (session_id, order_index)
);

-- ── User enrollment ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_program_enrollments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  program_id         UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  enrolled_at        TIMESTAMPTZ DEFAULT now(),
  current_week       INT DEFAULT 1,
  current_session    INT DEFAULT 1,
  completed_sessions INT DEFAULT 0,
  is_active          BOOLEAN DEFAULT true,
  completed_at       TIMESTAMPTZ,
  UNIQUE (user_id, program_id)
);

-- ── Per-session progress ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_session_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id     UUID NOT NULL REFERENCES user_program_enrollments(id) ON DELETE CASCADE,
  session_id        UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  workout_session_id UUID REFERENCES workout_session_logs(id) ON DELETE SET NULL,
  UNIQUE (enrollment_id, session_id)
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_program_weeks_program        ON program_weeks (program_id);
CREATE INDEX IF NOT EXISTS idx_program_sessions_week        ON program_sessions (week_id);
CREATE INDEX IF NOT EXISTS idx_program_session_ex_session   ON program_session_exercises (session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user             ON user_program_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_enrollment  ON user_session_progress (enrollment_id);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════
ALTER TABLE programs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_weeks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_progress     ENABLE ROW LEVEL SECURITY;

-- Catalog: any authenticated user can read published programs (or their own drafts).
DROP POLICY IF EXISTS "programs_readable" ON programs;
CREATE POLICY "programs_readable" ON programs
  FOR SELECT USING (visibility = 'published' OR auth.uid() = created_by);

-- Program structure readable when the parent program is readable.
DROP POLICY IF EXISTS "program_weeks_readable" ON program_weeks;
CREATE POLICY "program_weeks_readable" ON program_weeks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = program_weeks.program_id
      AND (p.visibility = 'published' OR p.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "program_sessions_readable" ON program_sessions;
CREATE POLICY "program_sessions_readable" ON program_sessions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM program_weeks w
    JOIN programs p ON p.id = w.program_id
    WHERE w.id = program_sessions.week_id
      AND (p.visibility = 'published' OR p.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "program_session_ex_readable" ON program_session_exercises;
CREATE POLICY "program_session_ex_readable" ON program_session_exercises
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM program_sessions s
    JOIN program_weeks w ON w.id = s.week_id
    JOIN programs p ON p.id = w.program_id
    WHERE s.id = program_session_exercises.session_id
      AND (p.visibility = 'published' OR p.created_by = auth.uid())
  ));

-- Enrollments: user owns their rows.
DROP POLICY IF EXISTS "enrollments_own" ON user_program_enrollments;
CREATE POLICY "enrollments_own" ON user_program_enrollments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Session progress: user owns via their enrollment.
DROP POLICY IF EXISTS "session_progress_own" ON user_session_progress;
CREATE POLICY "session_progress_own" ON user_session_progress
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_program_enrollments e
    WHERE e.id = user_session_progress.enrollment_id AND e.user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM user_program_enrollments e
    WHERE e.id = user_session_progress.enrollment_id AND e.user_id = auth.uid()
  ));
