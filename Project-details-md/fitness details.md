# SelfUp — Fitness Module (Physical Vessel)
## Comprehensive Technical Documentation

The Fitness Module, referred to internally as the **Physical Vessel**, is a state-of-the-art biological optimization system. It combines AI-driven protocol synthesis, real-time metabolic tracking, and a premium "Awakened" design aesthetic to transform physical training into a gamified RPG experience.

---

## 1. Design Philosophy & Terminology

The module adheres to a strict "Military-Grade / Cybernetic" aesthetic:
- **Design Language**: Glassmorphism, high-contrast blue/black palettes, scanline effects, and heavy uppercase typography.
- **Key Terms**:
    - **Physical Vessel**: The user's body.
    - **Protocol**: A workout plan or nutrition strategy.
    - **Phase**: An individual training day.
    - **Synthesis**: The AI-generation process.
    - **Ingestion**: Logging food or supplements.
    - **Aqueous Trace**: Hydration tracking.

---

## 2. Core Frontend Architecture

The frontend is a multi-tabbed interface located at `web/src/app/(protected)/fitness/page.tsx`.

### A. Workout Protocol Controller (`WorkoutView.tsx`)
- **Active State**: Tracks the currently active `workout_plans` record where `is_active = true`.
- **Phase Execution**: Displays a grid of `workout_days`. Each card shows the targeted muscle groups (e.g., "Hypertrophy Focus").
- **Historical Archive**: Lists previous plans with a "Protocol Deactivation" mechanism.

### B. Metabolic Fueling System (`NutritionView.tsx`)
- **Macro Distribution**: Real-time progress bars for Protein (HP), Carbs (MP), and Fats using Framer Motion animations.
- **Hydration Interface**: Quick-log buttons for 250ml, 500ml, and 1000ml "Aqueous Traces".
- **Dynamic Calculation**: Client-side reduction of `food_logs` to provide instant calorie/macro feedback.

### C. Vessel Metric Analysis (`BodyView.tsx`)
- **Visual Transformation**: Integrated with Supabase Storage for storing and comparing body transformation photos.
- **Biometric Logs**: Tracking of weight, body fat percentage, and physical measurements (chest, waist, etc.).

---

## 3. The AI Synthesis Engine

The system uses a background worker pattern to handle long-running AI generation tasks.

### The Synthesis Flow
1.  **Trigger**: User interacts with [AiPlanGeneratorModal.tsx](file:///d:/Coding/Selfup%20Ai/web/src/components/fitness/AiPlanGeneratorModal.tsx).
2.  **Queueing**: A `POST` request to `/api/ai/queue` adds a task of type `fitness_plan`.
3.  **Background Processing**: The BullMQ worker ([worker.ts](file:///d:/Coding/Selfup%20Ai/web/src/lib/worker.ts)) executes the task:
    - **Prompt Engineering**:
      ```text
      You are a world-class personal trainer. Create a structured workout plan.
      Target goal: "{goal}". Days per week: {days}.
      Return ONLY a valid JSON object: { name, description, workouts: [{ day_number, name, muscle_groups, exercises: [...] }] }
      ```
    - **Realization**: The worker creates the `workout_plans` record and dynamically generates `workout_days` and `workout_day_exercises`.
    - **Exercise Library**: The system uses a **Conflict-Free Upsert** logic to ensure exercises are reused or added to the global library without duplication.

---

## 4. Database Architecture (PostgreSQL)

The module is powered by a robust schema in Supabase.

### Workout System Schema
```sql
-- Main Protocol Metadata
CREATE TABLE workout_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  difficulty      TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  goal            TEXT NOT NULL,
  days_per_week   INT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Protocol Phases (Days)
CREATE TABLE workout_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_number      INT NOT NULL,
  name            TEXT,
  muscle_groups   TEXT[] DEFAULT '{}',
  rest_day        BOOLEAN DEFAULT false
);

-- Kinetic Library (Exercises)
CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id), -- NULL = System Global
  name            TEXT UNIQUE NOT NULL,
  muscle_group    TEXT,
  equipment       TEXT,
  description     TEXT,
  difficulty      TEXT DEFAULT 'intermediate'
);

-- Phase Components (Exercise Targets)
CREATE TABLE workout_day_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id  UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  sets            INT DEFAULT 3,
  reps            TEXT DEFAULT '10',
  rest_seconds    INT DEFAULT 60,
  weight_kg       DECIMAL,
  order_index     INT,
  notes           TEXT
);
```

### Nutrition & Logging Schema
```sql
-- Ingestion Records (Food)
CREATE TABLE food_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  logged_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type       TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name       TEXT NOT NULL,
  calories        INT DEFAULT 0,
  protein_g       DECIMAL DEFAULT 0,
  carbs_g         DECIMAL DEFAULT 0,
  fat_g           DECIMAL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Aqueous Trace (Water)
CREATE TABLE water_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  logged_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml       INT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. API Reference

### Protocols & Plans
- `GET /api/fitness/plans`: Retrieves all plans for the authenticated user, including nested days and exercises.
- `POST /api/fitness/plans`: Creates a custom workout protocol.
- `PATCH /api/fitness/plans/:id`: Updates plan status (e.g., activating/archiving).

### Metabolic Tracking
- `GET /api/fitness/nutrition`: Fetches today's ingestion logs.
- `POST /api/fitness/nutrition`: Logs a new meal with macro-nutrient data.
- `GET /api/fitness/water`: Retrieves cumulative hydration for the current date.
- `POST /api/fitness/water`: Increments the water log by a specific volume.

---

## 6. Gamification & Progression Logic

The fitness system is deeply integrated with the **SelfUp Core RPG Mechanics**:

1.  **XP Injection**:
    - **Workout Completion**: `+75 XP` (Base) + Intensity Multipliers.
    - **Macro Compliance**: `+25 XP` for hitting daily protein targets.
    - **Hydration Milestone**: `+10 XP` for every 3000ml tracked.
2.  **Attribute Scaling**:
    - Physical activities feed into the `attribute_service.ts`, scaling the user's "Vessel Strength" and "Biological Resilience" stats.
3.  **Achievement Unlocks**:
    - Tracking is linked to the `badge_service.ts`, unlocking achievements like "Iron Alchemist" (30-day workout streak) or "Hydro-Sage" (Perfect water tracking).

---

## 7. Operational File Structure

```text
web/src/
├── app/
│   ├── (protected)/
│   │   └── fitness/
│   │       └── page.tsx        # Controller View
│   └── api/
│       └── fitness/            # Backend Service Endpoints
│           ├── plans/
│           ├── logs/
│           ├── nutrition/
│           └── water/
├── components/
│   └── fitness/                # UI Sub-modules
│       ├── WorkoutView.tsx
│       ├── NutritionView.tsx
│       ├── BodyView.tsx
│       └── AiPlanGeneratorModal.tsx
└── lib/
    ├── worker.ts               # Background Synthesis Logic
    └── gemma.ts                # AI Model Interface
```
