# SelfUp — Database Structure

**Database:** Supabase (PostgreSQL)  
**Auth:** Supabase Auth (built-in JWT management)  
**Storage:** Supabase Storage (body transformation photos, avatars)  
**Realtime:** Supabase Realtime (notifications, live leaderboard)

> **Last synced:** 2026-10-04. Sections 1–13 are the original V1 design; sections 14–17 come from `web/scripts/migrations/`. For anything security-critical, check the live Supabase schema.

---

## Naming Conventions
- Tables: `snake_case` plural (e.g., `user_profiles`)
- Primary keys: `id UUID DEFAULT gen_random_uuid()`
- Foreign keys: `{table_singular}_id`
- Timestamps: always `created_at`, `updated_at`
- Soft delete: `deleted_at TIMESTAMPTZ NULL`
- All tables have Row Level Security (RLS) enabled

---

## Schema

### 1. `user_profiles`
Extends Supabase `auth.users`. Created automatically on signup via trigger.

```sql
CREATE TABLE user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT UNIQUE NOT NULL,
  display_name      TEXT,
  avatar_url        TEXT,           -- Supabase Storage URL or RPG avatar key
  avatar_type       TEXT DEFAULT 'rpg' CHECK (avatar_type IN ('rpg', 'photo')),
  rpg_avatar_key    TEXT,           -- e.g., 'warrior_1', 'mage_2'
  bio               TEXT,
  age               INT,
  gender            TEXT,
  timezone          TEXT DEFAULT 'Asia/Dhaka',
  level             INT DEFAULT 1,
  xp                INT DEFAULT 0,
  xp_to_next_level  INT DEFAULT 100,
  total_xp          INT DEFAULT 0,
  ai_coins          INT DEFAULT 20,
  streak_overall    INT DEFAULT 0,
  streak_last_date  DATE,
  streak_freeze_count INT DEFAULT 1,
  is_pro            BOOLEAN DEFAULT false,
  pro_expires_at    TIMESTAMPTZ,
  is_public         BOOLEAN DEFAULT true,
  onboarding_done   BOOLEAN DEFAULT false,
  ai_persona_name   TEXT DEFAULT 'System',
  ai_persona_style  TEXT DEFAULT 'friendly' CHECK (ai_persona_style IN ('friendly','strict','motivational','neutral')),
  theme             TEXT DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);
```

---

### 2. `user_goals`
Goals selected during onboarding.

```sql
CREATE TABLE user_goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  goal_type   TEXT NOT NULL CHECK (goal_type IN ('fitness','skills','time','style')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### 3. `ai_conversations`
Stores all chat history per user session/thread.

```sql
CREATE TABLE ai_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title       TEXT,               -- AI-generated conversation title
  is_archived BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  coins_spent     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 4. `ai_memory`
Long-term memory injected into AI context each session.

```sql
CREATE TABLE ai_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  memory_key  TEXT NOT NULL,     -- e.g., 'fitness_goal', 'skill_plan', 'personality'
  memory_val  TEXT NOT NULL,     -- Stored as text (can be JSON string)
  source      TEXT,              -- 'onboarding', 'chat', 'system'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, memory_key)
);
```

---

### 5. `ai_queue`
Queue for rate-limited AI requests.

```sql
CREATE TABLE ai_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  request_type  TEXT NOT NULL,   -- 'chat', 'schedule', 'analysis', 'roadmap'
  payload       JSONB NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  result        TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
```

---

### 6. `ai_coin_transactions`
Ledger of all AiCoin movements.

```sql
CREATE TABLE ai_coin_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount      INT NOT NULL,          -- positive = earned, negative = spent
  reason      TEXT NOT NULL,         -- 'daily_login', 'chat_message', 'task_complete', etc.
  balance_after INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### 7. Fitness Module

```sql
CREATE TABLE workout_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_of_week     INT NOT NULL,  -- 0=Mon, 6=Sun
  name            TEXT,
  rest_day        BOOLEAN DEFAULT false
);

CREATE TABLE exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,  -- NULL = global
  name        TEXT NOT NULL,
  muscle_group TEXT,
  equipment   TEXT,
  description TEXT,
  is_custom   BOOLEAN DEFAULT false
);

CREATE TABLE workout_day_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id       UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id  UUID NOT NULL REFERENCES exercises(id),
  sets         INT,
  reps         TEXT,   -- e.g., "8-12" or "15"
  weight_kg    DECIMAL,
  duration_sec INT,
  order_index  INT
);

CREATE TABLE workout_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_id     UUID REFERENCES workout_plans(id),
  day_id      UUID REFERENCES workout_days(id),
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  duration_min INT,
  completed   BOOLEAN DEFAULT true,
  xp_earned   INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_log_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  sets_done   JSONB   -- [{set:1, reps:10, weight:50}, ...]
);

-- Nutrition
CREATE TABLE nutrition_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  daily_cal_target INT,
  protein_g   INT,
  carbs_g     INT,
  fat_g       INT,
  is_ai_generated BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE food_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type   TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_name   TEXT NOT NULL,
  calories    INT,
  protein_g   DECIMAL,
  carbs_g     DECIMAL,
  fat_g       DECIMAL,
  quantity    DECIMAL DEFAULT 1,
  unit        TEXT DEFAULT 'serving',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE water_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml   INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE body_metrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  logged_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    DECIMAL,
  height_cm    DECIMAL,
  chest_cm     DECIMAL,
  waist_cm     DECIMAL,
  hip_cm       DECIMAL,
  body_fat_pct DECIMAL,
  photo_url    TEXT,   -- Supabase Storage
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

### 8. Skills Module

```sql
CREATE TABLE skills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT,    -- 'coding', 'music', 'language', 'other'
  icon            TEXT,
  color           TEXT,
  tracking_mode   TEXT DEFAULT 'milestone' CHECK (tracking_mode IN ('time','milestone','points')),
  total_hours     DECIMAL DEFAULT 0,
  total_points    INT DEFAULT 0,
  streak          INT DEFAULT 0,
  streak_last_date DATE,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE skill_roadmaps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE skill_milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id  UUID NOT NULL REFERENCES skill_roadmaps(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  resources   JSONB,    -- [{type:'youtube', url:'...', title:'...'}]
  order_index INT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  estimated_hours INT,
  xp_reward   INT DEFAULT 10
);

CREATE TABLE skill_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_min INT,
  points       INT,
  notes        TEXT,
  mood         INT CHECK (mood BETWEEN 1 AND 5),
  xp_earned    INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

### 9. Time Management Module

```sql
CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  priority      TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','cancelled')),
  category      TEXT,    -- 'fitness', 'skill', 'work', 'personal', etc.
  due_date      DATE,
  due_time      TIME,
  scheduled_start TIMESTAMPTZ,
  scheduled_end   TIMESTAMPTZ,
  is_recurring  BOOLEAN DEFAULT false,
  recurrence_rule TEXT,   -- iCal RRULE format
  parent_task_id UUID REFERENCES tasks(id),
  is_ai_scheduled BOOLEAN DEFAULT false,
  completed_at  TIMESTAMPTZ,
  xp_reward     INT DEFAULT 5,
  coin_reward   INT DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE habits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  frequency       TEXT DEFAULT 'daily' CHECK (frequency IN ('daily','weekly')),
  target_days     INT[],   -- [1,2,3,4,5] = Mon–Fri
  reminder_time   TIME,
  color           TEXT,
  icon            TEXT,
  streak          INT DEFAULT 0,
  streak_last_date DATE,
  total_completions INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  xp_reward       INT DEFAULT 3,
  coin_reward     INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE habit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id    UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT DEFAULT 'done' CHECK (status IN ('done','skipped','missed')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

CREATE TABLE pomodoro_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES tasks(id),
  work_minutes    INT DEFAULT 25,
  break_minutes   INT DEFAULT 5,
  completed_cycles INT DEFAULT 0,
  status          TEXT DEFAULT 'done' CHECK (status IN ('done','cancelled')),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE calendar_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  provider        TEXT DEFAULT 'google',
  access_token    TEXT,
  refresh_token   TEXT,
  token_expiry    TIMESTAMPTZ,
  calendar_id     TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 10. Style Module

```sql
CREATE TABLE style_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  body_type   TEXT,
  height_cm   INT,
  skin_tone   TEXT,
  color_prefs TEXT[],
  style_vibe  TEXT[],   -- ['casual', 'formal', 'streetwear', 'minimalist']
  budget_tier TEXT,
  notes       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE style_recommendations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,  -- AI-generated text advice
  category    TEXT,           -- 'outfit', 'color', 'accessory', 'grooming'
  is_weekly_tip BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE outfit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  photo_url   TEXT,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  tags        TEXT[],
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE style_moodboard (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title       TEXT,
  image_url   TEXT,
  link_url    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### 11. Gamification

```sql
CREATE TABLE quests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,  -- NULL = global template
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  quest_type      TEXT CHECK (quest_type IN ('solo','challenge','daily','weekly')),
  is_template     BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  requirements    JSONB,   -- [{type:'workout_count', value:7}]
  xp_reward       INT DEFAULT 50,
  coin_reward     INT DEFAULT 20,
  badge_reward    TEXT,
  duration_days   INT,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_quests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  quest_id     UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','completed','failed','abandoned')),
  progress     JSONB DEFAULT '{}',
  started_at   TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, quest_id)
);

CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,   -- 'first_workout', '7_day_streak', etc.
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  rarity      TEXT DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary'))
);

CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id),
  earned_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id     UUID NOT NULL REFERENCES quests(id),
  challenger_id UUID NOT NULL REFERENCES user_profiles(id),
  challenged_id UUID NOT NULL REFERENCES user_profiles(id),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed')),
  winner_id    UUID REFERENCES user_profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  ends_at      TIMESTAMPTZ
);
```

---

### 12. Notifications

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,    -- 'task_due', 'streak_alert', 'quest_complete', 'friend_request', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  push_enabled          BOOLEAN DEFAULT true,
  email_enabled         BOOLEAN DEFAULT true,
  morning_checkin       BOOLEAN DEFAULT true,
  morning_checkin_time  TIME DEFAULT '07:00',
  evening_review        BOOLEAN DEFAULT true,
  evening_review_time   TIME DEFAULT '21:00',
  task_reminders        BOOLEAN DEFAULT true,
  habit_reminders       BOOLEAN DEFAULT true,
  streak_alerts         BOOLEAN DEFAULT true,
  ai_proactive          BOOLEAN DEFAULT true,
  dnd_start             TIME,
  dnd_end               TIME,
  push_subscription     JSONB,   -- Web Push subscription object
  updated_at            TIMESTAMPTZ DEFAULT now()
);
```

---

### 13. Subscriptions & Payments

```sql
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free','pro')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  payment_method  TEXT,
  payment_ref     TEXT,
  amount_bdt      INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

> **Sections 14–17 were added 2026-10-04** from the idempotent migrations in `web/scripts/migrations/`, which are the source of truth for these tables.

### 14. Money Module (`create_money.sql`)

See [money.md](money.md) for behaviour. Amounts are `NUMERIC(14,2)` and always positive; `type` gives the sign. Account balances are computed, never stored. RLS: each table is owner-only, except `money_categories`, which is readable when `user_id IS NULL` (global defaults) or owned.

```sql
CREATE TABLE money_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'cash' CHECK (type IN ('cash','bank','card','investment','other')),
  currency        TEXT NOT NULL DEFAULT 'USD',
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  color           TEXT DEFAULT '#9c7ef0',
  icon            TEXT DEFAULT 'wallet',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE money_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,  -- NULL = global default
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('income','expense')),
  icon        TEXT DEFAULT 'tag',
  color       TEXT DEFAULT '#7a7a8a',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE money_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id     UUID REFERENCES money_accounts(id) ON DELETE SET NULL,   -- source for transfers
  to_account_id  UUID REFERENCES money_accounts(id) ON DELETE SET NULL,   -- destination for transfers
  category_id    UUID REFERENCES money_categories(id) ON DELETE SET NULL,
  type           TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income','expense','transfer')),
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency       TEXT NOT NULL DEFAULT 'USD',
  note           TEXT,
  occurred_at    DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  xp_earned      INT DEFAULT 0,
  recurring_id   UUID,              -- set when posted from a recurring rule
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE money_budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES money_categories(id) ON DELETE CASCADE,
  month         DATE NOT NULL,      -- first day of the month
  limit_amount  NUMERIC(14,2) NOT NULL CHECK (limit_amount >= 0),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, category_id, month)
);

CREATE TABLE money_recurring (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id     UUID REFERENCES money_accounts(id) ON DELETE SET NULL,
  category_id    UUID REFERENCES money_categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income','expense')),
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency       TEXT NOT NULL DEFAULT 'USD',
  cadence        TEXT NOT NULL DEFAULT 'monthly' CHECK (cadence IN ('weekly','monthly','yearly')),
  next_due       DATE NOT NULL,
  auto_post      BOOLEAN NOT NULL DEFAULT false,   -- stored, not yet acted on
  is_active      BOOLEAN NOT NULL DEFAULT true,
  last_posted_at DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE money_goals (
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
-- Indexes: user_id on every table; money_transactions (user_id, occurred_at DESC), (account_id), (category_id);
-- money_budgets (user_id, month)
```

### 15. Fitness Programs (`create_programs.sql`)

Adapted from workout-cool: Program → Week → Session → Exercise, plus enrollment and per-session progress. RLS: published, active programs (and their children) are readable by everyone; enrollments and progress are owner-only. All PKs are `UUID DEFAULT gen_random_uuid()`.

```sql
CREATE TABLE programs (
  id, slug TEXT UNIQUE, title TEXT NOT NULL, description TEXT, category TEXT, image_url TEXT,
  level TEXT DEFAULT 'intermediate' CHECK (level IN ('beginner','intermediate','advanced')),
  program_type TEXT,                              -- strength | hypertrophy | endurance | ...
  duration_weeks INT DEFAULT 4, sessions_per_week INT DEFAULT 3, session_duration_min INT DEFAULT 30,
  equipment TEXT[], is_premium BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
  visibility TEXT DEFAULT 'published' CHECK (visibility IN ('draft','published')),
  participant_count INT DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,   -- NULL = system
  created_at, updated_at TIMESTAMPTZ
);
CREATE TABLE program_weeks (
  id, program_id UUID NOT NULL REFERENCES programs ON DELETE CASCADE,
  week_number INT NOT NULL, title TEXT, description TEXT,
  UNIQUE (program_id, week_number)
);
CREATE TABLE program_sessions (
  id, week_id UUID NOT NULL REFERENCES program_weeks ON DELETE CASCADE,
  session_number INT NOT NULL, title TEXT, description TEXT, equipment TEXT[], estimated_minutes INT DEFAULT 30,
  UNIQUE (week_id, session_number)
);
CREATE TABLE program_session_exercises (
  id, session_id UUID NOT NULL REFERENCES program_sessions ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises, order_index INT DEFAULT 0, instructions TEXT,
  suggested_sets JSONB DEFAULT '[]',              -- [{ set_index, type, reps, weight, unit, seconds }]
  UNIQUE (session_id, order_index)
);
CREATE TABLE user_program_enrollments (
  id, user_id UUID NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ, current_week INT DEFAULT 1, current_session INT DEFAULT 1,
  completed_sessions INT DEFAULT 0, is_active BOOLEAN DEFAULT true, completed_at TIMESTAMPTZ,
  UNIQUE (user_id, program_id)
);
CREATE TABLE user_session_progress (
  id, enrollment_id UUID NOT NULL REFERENCES user_program_enrollments ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES program_sessions ON DELETE CASCADE,
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  workout_session_id UUID REFERENCES workout_session_logs ON DELETE SET NULL,
  UNIQUE (enrollment_id, session_id)
);
```

### 16. Exercise Library Columns (`add_exercise_media_columns.sql`, `add_exercise_attributes.sql`)

`exercises` is seeded from free-exercise-db (~873 exercises) by `npm run seed:exercises`. Denormalized attribute columns stand in for workout-cool's EAV tables:

```sql
ALTER TABLE exercises
  ADD COLUMN exercise_type     TEXT,              -- strength | cardio | stretching | plyometrics | powerlifting | strongman | ...
  ADD COLUMN mechanics_type    TEXT,              -- compound | isolation
  ADD COLUMN force_type        TEXT,              -- push | pull | static
  ADD COLUMN primary_muscle    TEXT,              -- granular, e.g. 'quadriceps' (muscle_group stays the broad UI group)
  ADD COLUMN secondary_muscles TEXT[] DEFAULT '{}',
  ADD COLUMN image_urls        TEXT[] DEFAULT '{}';
-- Indexes: primary_muscle, equipment, exercise_type
```

Per-set reps logged by the session tracker go into the existing `workout_session_logs.sets_done` JSONB; no DDL was needed.

### 17. New-Day Check-in & XP Idempotency (`add_day_cron.sql`)

```sql
ALTER TABLE user_profiles ADD COLUMN last_cron_date DATE;   -- last day rolled over; check-in due when < today
ALTER TABLE dailies
  ADD COLUMN current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN longest_streak INT NOT NULL DEFAULT 0;

-- awardXp detects repeat awards via unique violation (23505)
CREATE UNIQUE INDEX xp_transactions_source_uniq ON xp_transactions (user_id, source_type, source_id);
CREATE INDEX xp_transactions_user_created_idx   ON xp_transactions (user_id, created_at DESC);
```

There is **no** `increment_user_xp` RPC. All XP writes go through `GamificationService` (`web/src/lib/gamification.service.ts`).

### 18. Mobile Sync (`add_mobile_sync.sql`)

```sql
CREATE TABLE sync_idempotency (
  user_id         UUID NOT NULL DEFAULT auth.uid() REFERENCES user_profiles(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,          -- Idempotency-Key header (the app's outbox op id)
  method          TEXT NOT NULL,
  path            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
  response_status INT,
  response_body   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);  -- RLS: owner-only. Rows older than 30 days can be pruned.
```

The migration also adds `user_profiles`, `dailies`, `habits`, `todos`, `pomodoro_sessions` and all six `money_*` tables to the `supabase_realtime` publication.

### Tables in use but not yet documented here

These tables are queried by the code but have no column-level entry in this file. The live Supabase schema is authoritative; document each one when you next touch it:

`dailies`, `todos`, `xp_transactions`, `dungeons`, `user_dungeons`, `workout_session_logs`, `diet_plans`, `meal_templates`, `meal_template_foods`, `plan_adjustments`, `skill_phases`, `skill_topics`, `skill_study_days`, `milestone_tests`, `test_attempts`, `resource_library`, `ai_memory_vectors`, `ai_weekly_summaries`.

The other way round, `subscriptions`, `notification_settings`, `nutrition_plans` and `calendar_integrations` (above) are designed but not referenced by the current code.

---

## Key Indexes

```sql
-- Performance indexes
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_user ON ai_messages(user_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, logged_date);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_date);
CREATE INDEX idx_body_metrics_user_date ON body_metrics(user_id, logged_date);
CREATE INDEX idx_skill_sessions_user_date ON skill_sessions(user_id, session_date);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_ai_queue_status ON ai_queue(status, created_at);
CREATE INDEX idx_friendships_users ON friendships(requester_id, addressee_id);
```

---

## Row Level Security (RLS) — Pattern

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "user_own_data" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Apply same pattern to all user-owned tables
-- Public profiles exception for leaderboard/social
CREATE POLICY "public_profiles_readable" ON user_profiles
  FOR SELECT USING (is_public = true OR auth.uid() = id);
```

---

## Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile photos | Public read, auth write |
| `body-photos` | Body transformation photos | Private (user only) |
| `style-photos` | Outfit log photos | Private (user only) |
| `moodboard` | Style moodboard images | Private (user only) |

---

## Database Functions / Triggers

```sql
-- Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, display_name)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 4),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  INSERT INTO notification_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
```
