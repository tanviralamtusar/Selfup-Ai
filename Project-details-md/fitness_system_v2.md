# SelfUp — Fitness Module v2.0 (Physical Vessel Upgrade)
> **Version:** 2.0  
> **Module:** Fitness / Physical Vessel  
> **Primary Entry Point:** AI Chat → Fitness Module  
> **AiCoin Cost:** 15 coins per AI-generated plan  
> **Philosophy:** The AI is a world-class personal trainer living inside the System. It asks, analyses, builds, and adapts.

---

## Table of Contents
1. [Overview & What Changed](#1-overview--what-changed)
2. [Plan Types](#2-plan-types)
3. [AI Interview Flow](#3-ai-interview-flow)
4. [Plan Generation Engine](#4-plan-generation-engine)
5. [Calendar & Schedule Integration](#5-calendar--schedule-integration)
6. [Workout Session Execution](#6-workout-session-execution)
7. [Diet Plan System](#7-diet-plan-system)
8. [Exercise Library & YouTube Integration](#8-exercise-library--youtube-integration)
9. [XP & Gamification](#9-xp--gamification)
10. [Mid-Plan AI Adaptation](#10-mid-plan-ai-adaptation)
11. [Missed Day Handling](#11-missed-day-handling)
12. [Task Injection into Dailies](#12-task-injection-into-dailies)
13. [Plan Lifecycle & Deactivation](#13-plan-lifecycle--deactivation)
14. [Database Schema](#14-database-schema)
15. [API Reference](#15-api-reference)
16. [AI Prompt Architecture](#16-ai-prompt-architecture)
17. [File Structure](#17-file-structure)

---

## 1. Overview & What Changed

### 1.1 Core Upgrade Summary
The v1 fitness system required users to navigate to the Fitness module to create a plan. In v2, the **primary entry point is the AI Chat**. The user simply tells the AI what they want — the AI handles everything from questioning to plan creation to calendar scheduling.

| Feature | v1 | v2 |
|---------|----|----|
| Plan creation entry point | Fitness module form | AI Chat conversation |
| AI questioning | 5-step form | Dynamic 10–30+ question interview |
| Exercise detail | Sets/reps only | Sets × reps + YouTube video per exercise |
| Diet plan | Separate, basic | Integrated, specific foods + macros |
| Calendar awareness | None | Checks calendar + Dailies before scheduling |
| Missed day handling | Logged only | AI adapts plan, shifts future days |
| Mid-plan adjustment | Manual edit only | AI suggests adjustments, user approves |
| Plan confirmation | Auto-created | User previews and confirms before creation |
| XP system | +75 XP per session | Per-exercise XP + session completion bonus |

### 1.2 Plan Creation Flow (High Level)
```
User in AI Chat: "I want a fitness plan for building muscle"
        ↓
AI starts Interview (10–30+ questions)
        ↓
AI checks calendar + Dailies for free slots
        ↓
AI generates full plan (workout + optional diet)
        ↓
AI shows Plan Preview in chat
        ↓
User confirms → Plan created in Fitness module → Dailies injected
```

---

## 2. Plan Types

There are three plan types. The AI determines which type based on the user's request during the interview.

### 2.1 Regular Ongoing Plan
- **Duration:** Indefinite — runs until user deactivates it
- **Reset behaviour:** Workout tasks repeat on the same days every week
- **Injected as:** Dailies with `repeat_type: 'weekly'` and `repeat_days` set to the user's chosen workout days
- **Example trigger:** *"I want a regular workout routine"* / *"Make me a gym plan"*

### 2.2 Fixed-Duration Plan (N-Day Plan)
- **Duration:** User-defined (7 days, 14 days, 30 days, custom)
- **Reset behaviour:** Each day's task is active only on its scheduled date, then expires
- **Injected as:** Dailies with `expires_on` set per day
- **Example trigger:** *"Give me a 7-day workout plan"* / *"I want a 30-day challenge"*

### 2.3 Full Complete Plan (Workout + Diet)
- **Duration:** Ongoing or fixed — determined by user
- **Components:** Full workout protocol + full daily meal plan
- **Injected as:** Workout tasks → Dailies; Meal tasks → Habits (daily reset)
- **Example trigger:** *"Make me a complete plan to lose weight"* / *"I want everything — workout and diet"*

### 2.4 Diet-Only Plan
- **Duration:** Ongoing or for a defined period
- **Components:** Daily meal plan with specific foods + macros
- **Injected as:** Habits (daily reset) for meal logging targets
- **Example trigger:** *"Just make me a diet plan"* / *"Help me eat better"*

---

## 3. AI Interview Flow

The AI interview is a dynamic conversation, not a form. Questions branch based on previous answers. The minimum is 10 questions; complex requests can go to 30+.

### 3.1 Interview Trigger Detection
The AI detects fitness plan intent from phrases like:
- "make me a fitness plan", "workout plan", "gym plan", "diet plan"
- "I want to build muscle / lose weight / get stronger / improve stamina"
- "7 day plan", "30 day challenge", "complete plan"

On detection, the AI responds:
> *"System: Fitness Protocol Synthesis initiated. I need to run a full assessment before I can build your plan. This will take 2–3 minutes. Ready?"*

### 3.2 Universal Questions (Asked for All Plan Types)

| # | Question | Purpose |
|---|----------|---------|
| 1 | What is your primary goal? (Build muscle / Lose weight / Build strength / Improve stamina / Overall fitness) | Sets plan direction |
| 2 | What is your current fitness level? (Complete beginner / Some experience / Intermediate / Advanced) | Sets difficulty |
| 3 | How old are you? | Adjusts intensity and recovery |
| 4 | What is your current weight? | Baseline metric |
| 5 | What is your height? | BMI + goal calculation |
| 6 | Do you have any injuries or physical limitations? | Safety filter |
| 7 | How many days per week can you commit to training? | Structures weekly plan |
| 8 | Which days are your rest days? | Sets `repeat_days` for weekly Dailies |
| 9 | What time of day do you prefer to train? (Morning / Afternoon / Evening / Flexible) | Sets `scheduled_time` for calendar |
| 10 | How long can each session be? (30 min / 45 min / 60 min / 90 min) | Scales exercise volume |

### 3.3 Workout-Specific Questions

| # | Question | Purpose |
|---|----------|---------|
| 11 | Are you training at home or at a gym? | Determines equipment availability |
| 12 | If home: what equipment do you have? (None / Dumbbells / Resistance bands / Pull-up bar / Barbell / Other) | Filters exercise library |
| 13 | If gym: do you have full equipment access? | Unlocks full exercise library |
| 14 | Do you prefer a specific training style? (Calisthenics / Weight training / HIIT / Mixed) | Biases exercise selection |
| 15 | What is your target — do you want to track a specific end goal? (e.g., "lose 10kg in 3 months") | Sets measurable milestone |
| 16 | Is this a fixed-duration plan or an ongoing routine? | Determines plan type (§2) |
| 17 | If fixed: how many days? (7 / 14 / 30 / custom) | Sets `expires_on` dates |

### 3.4 Diet-Specific Questions (If Diet Plan Requested)

| # | Question | Purpose |
|---|----------|---------|
| 18 | Do you want a diet plan alongside the workout? (Yes / No / Diet only) | Determines plan scope |
| 19 | What is your approximate daily budget for food? (in BDT) | Filters food recommendations to affordable options |
| 20 | What types of food do you eat? (Vegetarian / Non-vegetarian / Vegan / No restrictions) | Dietary filter |
| 21 | Are there any foods you dislike or cannot eat? | Exclusion filter |
| 22 | How many meals do you prefer per day? (2 / 3 / 4–5 / Flexible) | Structures meal plan |
| 23 | Do you cook at home, buy from outside, or both? | Adjusts meal complexity |
| 24 | Do you use any supplements? (Protein powder / Creatine / None / Not sure) | Factors into macro targets |

### 3.5 Calendar Check (Automated — No Question Asked)
After collecting answers, the AI silently:
1. Calls `GET /api/calendar/availability` with the user's preferred days and time
2. Calls `GET /api/tasks/scheduled` to check for existing Dailies at that time slot
3. If a conflict is found → AI informs user: *"I noticed your [time slot] on [day] is already occupied by [event/task]. I've shifted your workout to [alternative time]. Is that okay?"*
4. User can accept, reject, or specify a different time

### 3.6 Interview End Signal
After all questions are answered, the AI says:
> *"Assessment complete. Synthesising your protocol... This will take a moment."*

The plan generation runs in the background (BullMQ worker). When ready:
> *"Your protocol is ready. Review it below before I activate it."*

---

## 4. Plan Generation Engine

### 4.1 What the AI Generates
For a full plan, the AI produces a structured JSON object containing:

```typescript
interface GeneratedPlan {
  plan_meta: {
    name: string                    // e.g. "Muscle Building Protocol — 4 Days/Week"
    goal: string
    plan_type: 'ongoing' | 'fixed' | 'full' | 'diet_only'
    duration_days?: number          // for fixed plans
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    days_per_week: number
    session_duration_minutes: number
    includes_diet: boolean
  }
  workout_days: WorkoutDay[]
  diet_plan?: DietPlan
}

interface WorkoutDay {
  day_label: string                 // e.g. "Day 1 — Push (Chest & Shoulders)"
  day_number: number
  scheduled_date?: string           // ISO date, for fixed plans only
  repeat_day?: string               // 'mon'|'tue'|... for ongoing plans
  scheduled_time: string            // e.g. "07:00"
  muscle_groups: string[]
  is_rest_day: boolean
  exercises: Exercise[]
  session_xp_bonus: number         // XP for completing full session
}

interface Exercise {
  name: string
  sets: number
  reps: string                      // e.g. "10" or "10-12" or "failure"
  rest_seconds: number
  weight_note: string               // e.g. "Bodyweight" or "Start light, 5–10kg"
  technique_note: string            // e.g. "Keep elbows tucked, full range of motion"
  xp_per_completion: number
  video_query: string               // used to search YouTube API
  video_url?: string                // pre-fetched from library or YouTube API
}

interface DietPlan {
  daily_targets: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  budget_bdt_per_day: number
  meals: MealTemplate[]
}

interface MealTemplate {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  suggested_time: string
  foods: FoodItem[]
  total_calories: number
  notes: string                     // e.g. "Can substitute rice with roti"
}

interface FoodItem {
  name: string                      // Specific food, e.g. "2 boiled eggs"
  quantity: string                  // e.g. "2 pieces" or "150g"
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  approx_cost_bdt: number
}
```

### 4.2 Plan Preview (User Confirmation)
Before creating anything, the AI renders a **Plan Preview** in the chat. This is a structured summary — not the full detail (that lives in the Fitness module).

```
╔══════════════════════════════════════════════════╗
║  PROTOCOL PREVIEW — Muscle Building, 4 Days/Week ║
║                                                  ║
║  Type: Ongoing   Difficulty: Intermediate        ║
║  Session: 60 min   Start: Monday                 ║
║                                                  ║
║  WORKOUT SCHEDULE                                ║
║  Mon 7:00 AM — Push Day (Chest, Shoulders, Tri)  ║
║  Wed 7:00 AM — Pull Day (Back, Biceps)           ║
║  Fri 7:00 AM — Legs & Core                       ║
║  Sat 7:00 AM — Full Body                         ║
║  Tue / Thu / Sun — Rest                          ║
║                                                  ║
║  DIET PLAN                                       ║
║  ~2400 kcal/day   Protein: 160g   Budget: ~150₺  ║
║  4 meals/day — Breakfast, Lunch, Snack, Dinner   ║
║                                                  ║
║  TOTAL XP AVAILABLE: ~2800 XP/week               ║
║  AICOIN COST: 15 coins                           ║
║                                                  ║
║  [ ACTIVATE PROTOCOL ]   [ MODIFY ]   [ CANCEL ] ║
╚══════════════════════════════════════════════════╝
```

**Modify** — user can change any aspect (time, days, exercises) and AI regenerates that section only.  
**Activate Protocol** — deducts 15 AiCoins, creates all records, injects Dailies.  
**Cancel** — no coins deducted, nothing created.

---

## 5. Calendar & Schedule Integration

### 5.1 Availability Check Logic
Before finalising scheduled times, the backend runs:

```typescript
async function checkAvailability(userId: string, preferredDay: string, preferredTime: string) {
  // 1. Check Google Calendar events
  const calendarEvents = await getCalendarEvents(userId, preferredDay)

  // 2. Check existing scheduled Dailies
  const scheduledDailies = await getScheduledDailies(userId, {
    repeat_day: preferredDay,
    scheduled_time: preferredTime
  })

  const conflicts = [...calendarEvents, ...scheduledDailies].filter(event =>
    timeOverlaps(event.time, preferredTime, sessionDurationMinutes)
  )

  if (conflicts.length > 0) {
    return { available: false, conflicts, suggestedAlternatives: findNextFreeSlots(userId, preferredDay) }
  }
  return { available: true }
}
```

### 5.2 Conflict Resolution
If a conflict is found, the AI presents alternatives:
> *"Your Monday 7:00 AM slot has a conflict with 'Deep Work Session'. I can schedule your workout at:*
> - *Monday 6:00 AM (before your existing tasks)*
> - *Monday 8:00 AM (after your Deep Work ends)*
> - *Choose a different day entirely*
>
> *Which works best?"*

### 5.3 Calendar Event Creation
For fixed-duration plans, the AI creates actual calendar events (via Google Calendar sync if connected) in addition to injecting Dailies. This ensures the workout appears in both the SelfUp calendar view and the user's Google Calendar.

---

## 6. Workout Session Execution

### 6.1 Session View in Fitness Module
When the user opens a workout Daily, it expands into a **full session view** — not just a checkbox. The session view shows:

- Session name and muscle groups targeted
- Total estimated duration
- Each exercise as a card with:
  - Exercise name
  - Sets × Reps target (e.g., "3 × 10–12")
  - Weight note
  - Technique tip
  - Embedded YouTube video thumbnail (tap to open)
  - Set tracker (checkboxes per set: ☐ ☐ ☐)
  - Rest timer (auto-starts after marking a set complete)
  - Log actual weight used (optional)

### 6.2 Session Completion States
A session has three states:

| State | Definition | XP |
|-------|-----------|-----|
| **Not started** | No exercises logged | 0 |
| **Partial** | Some exercises completed | Per-exercise XP only |
| **Complete** | All exercises marked done | Per-exercise XP + session bonus |

The session is marked **Complete** when the user taps "Mark Session Complete" — this fires the full Daily completion event and injects XP.

### 6.3 Rest Timer
- Auto-starts when user marks a set complete
- Default duration is the exercise's `rest_seconds` value
- User can extend or skip
- Push notification fires if app is backgrounded: *"Rest complete. Time for your next set."*

---

## 7. Diet Plan System

### 7.1 What a Diet Plan Contains
The AI generates a **daily meal template** — not a rigid unchangeable schedule, but a structured recommendation with specific foods the user can afford and access.

Each day's diet plan includes:
- **Meal breakdown** (Breakfast / Lunch / Snack / Dinner)
- **Specific foods per meal** (e.g., "2 boiled eggs, 1 cup oats, 1 banana")
- **Calorie and macro count per meal** and daily total
- **Approximate cost in BDT** per meal and daily total
- **Substitution notes** (e.g., "Can replace chicken with eggs to reduce cost")

### 7.2 Example AI-Generated Meal Day (2400 kcal, ~150 BDT budget)

**Breakfast — 7:00 AM (520 kcal | 35g protein)**
- 3 boiled eggs (~20 BDT)
- 1 cup rolled oats with water (~15 BDT)
- 1 banana (~10 BDT)
- *Substitution: Replace oats with rice if unavailable*

**Lunch — 1:00 PM (750 kcal | 50g protein)**
- 200g chicken breast, grilled (~60 BDT)
- 1.5 cups cooked rice (~10 BDT)
- 1 cup mixed vegetables (broccoli/carrot/beans) (~15 BDT)

**Snack — 4:30 PM (300 kcal | 20g protein)**
- 1 cup whole milk (~15 BDT)
- 2 slices whole wheat bread (~10 BDT)
- 1 tbsp peanut butter (~8 BDT)

**Dinner — 8:00 PM (680 kcal | 45g protein)**
- 150g lentil dal (~15 BDT)
- 1.5 cups rice (~10 BDT)
- 1 egg omelette (~10 BDT)
- *Optional: Add fish if budget allows*

**Daily Total: ~2250 kcal | ~150g protein | ~248g carbs | ~52g fat | ~188 BDT**

### 7.3 Diet Plan as Habits
Diet tasks are injected as **daily Habits** — not Dailies. This is because eating consistently is a behaviour-building action, not a one-time daily task. The habit tracks whether the user logged their meals each day.

| Habit | Reset | HP on miss |
|-------|-------|-----------|
| "Log all meals today" | Daily | –5 HP |
| "Hit daily protein target" | Daily | –5 HP |
| "Hit daily water target" | Daily | –5 HP |

### 7.4 Macro Tracking Integration
The diet plan sets the user's macro targets in the Nutrition module automatically:
- `daily_calorie_target` → set on user's nutrition profile
- `protein_target_g` → set
- `carbs_target_g` → set
- `fat_target_g` → set

The Nutrition module's progress bars then measure actual logs against these AI-set targets.

---

## 8. Exercise Library & YouTube Integration

### 8.1 Two-Layer Video System

**Layer 1 — Pre-built Exercise Library**
The system maintains a global exercise library (`exercises` table) where common exercises have pre-attached YouTube video URLs. These are curated, verified links — no API call needed.

- Covers ~200 common exercises
- Each exercise has: `name`, `muscle_group`, `equipment`, `difficulty`, `video_url`, `video_title`
- Updated manually by the SelfUp team
- Zero API cost, instant load

**Layer 2 — YouTube API Fallback**
If an exercise is not found in the library (rare exercises, user-specific movements), the system calls the YouTube Data API v3:

```typescript
async function getExerciseVideo(exerciseName: string): Promise<string | null> {
  // Step 1: Check library
  const libraryMatch = await db.exercises.findOne({
    where: { name: { ilike: exerciseName } }
  })
  if (libraryMatch?.video_url) return libraryMatch.video_url

  // Step 2: YouTube API fallback
  const query = `how to do ${exerciseName} proper form technique`
  const result = await youtube.search({
    q: query,
    type: 'video',
    maxResults: 1,
    videoDuration: 'short',       // prefer short tutorials
    relevanceLanguage: 'en'
  })

  if (result.items.length > 0) {
    const videoUrl = `https://youtube.com/watch?v=${result.items[0].id.videoId}`
    // Cache result back to library to reduce future API calls
    await cacheExerciseVideo(exerciseName, videoUrl)
    return videoUrl
  }

  return null
}
```

### 8.2 Exercise Card Format (in Session View)
Each exercise in a session is displayed as:

```
┌─────────────────────────────────────────┐
│  BENCH PRESS                            │
│  Chest · Intermediate                   │
│                                         │
│  3 sets × 10–12 reps                    │
│  Rest: 90 seconds                       │
│  Weight: Start at 40–50% of bodyweight  │
│                                         │
│  Technique: Keep shoulder blades        │
│  retracted, bar to lower chest,         │
│  elbows at 45 degrees.                  │
│                                         │
│  [▶ Watch Tutorial]  2:34               │
│                                         │
│  Set 1: [☐] Set 2: [☐] Set 3: [☐]      │
│  Logged weight: _____ kg                │
│  +3 XP per set · +10 XP session bonus   │
└─────────────────────────────────────────┘
```

### 8.3 Conflict-Free Exercise Upsert
When the AI generates exercises, the system checks if an exercise already exists in the global library before inserting:

```typescript
async function upsertExercise(exerciseData: Exercise): Promise<string> {
  const existing = await db.exercises.findOne({
    where: { name: { ilike: exerciseData.name } }
  })
  if (existing) return existing.id  // reuse existing library entry

  const newExercise = await db.exercises.create(exerciseData)
  return newExercise.id
}
```

---

## 9. XP & Gamification

### 9.1 XP Earn Structure — Workouts

| Action | XP |
|--------|-----|
| Complete 1 exercise set | +3 XP |
| Complete full exercise (all sets) | +10 XP |
| Complete full workout session | +50 XP bonus |
| Complete session + all sets logged with weight | +75 XP bonus (replaces 50) |
| Hit daily macro target (protein) | +25 XP |
| Hit daily calorie target | +15 XP |
| Hit daily water target (3000ml) | +10 XP |
| Perfect workout week (all sessions completed) | +200 XP bonus |
| Complete a fixed-duration plan fully | +500 XP |

**STR attribute multiplier:** +0.5% XP on all fitness actions per STR point (inherited from task system §5.3).

### 9.2 HP Impact from Missed Workouts
Missed workout Dailies follow the standard Daily penalty (XP penalty, not HP). Only Habits (meal logging, water) affect HP.

| Missed | Penalty |
|--------|---------|
| Workout Daily (High priority) | –10 XP |
| "Log all meals" Habit | –5 HP |
| "Hit protein target" Habit | –5 HP |
| "Hit water target" Habit | –5 HP |

### 9.3 Fitness-Specific Badges

| Badge | Condition | Rarity |
|-------|-----------|--------|
| `first_protocol` | Activate first AI fitness plan | Common |
| `iron_start` | Complete first workout session | Common |
| `week_warrior_fit` | Complete all sessions in a week | Rare |
| `iron_alchemist` | 30-day workout session streak | Epic |
| `hydro_sage` | Hit water target 30 days in a row | Rare |
| `macro_master` | Hit all macro targets 14 days straight | Rare |
| `protocol_complete` | Complete a full fixed-duration plan | Epic |
| `adaptation` | Accept an AI mid-plan adjustment | Common |
| `no_days_off` | Complete a 30-day plan with 0 missed sessions | Legendary |
| `vessel_forged` | STR attribute reaches 20 | Epic |

---

## 10. Mid-Plan AI Adaptation

### 10.1 When AI Suggests Adjustments
The AI monitors workout completion data and suggests plan adjustments in two scenarios:

**Scenario A — Too Easy (Overperforming)**
Triggered when: User completes all sessions for 2 consecutive weeks with no partial completions and logs weights above the recommended range.

AI message:
> *"System Analysis: Your recent performance data shows you are consistently exceeding protocol targets. Recommend: Increase working weight by 10% and add 1 additional set per compound exercise. Approve adjustment?"*

**Scenario B — Too Hard (Underperforming)**
Triggered when: User completes fewer than 60% of scheduled sessions over 2 weeks, or repeatedly marks sessions as "Partial."

AI message:
> *"System Analysis: Completion rate is below threshold (58% over 14 days). This may indicate the current protocol exceeds your recovery capacity. Recommend: Reduce session frequency from 4 to 3 days/week and lower working volume by 20%. Approve adjustment?"*

### 10.2 User Response Options
When an adjustment is suggested, the user sees:

```
[ APPROVE ]   [ MODIFY SUGGESTION ]   [ IGNORE ]
```

- **Approve** — AI updates the plan records and re-injects modified Dailies
- **Modify Suggestion** — User opens a dialogue to adjust specific parts (e.g., "reduce weight but keep 4 days")
- **Ignore** — Plan continues unchanged, AI will not suggest again for 7 days

### 10.3 Adjustment Limits
- AI can suggest a maximum of **1 adjustment per week**
- Each suggestion is logged in `plan_adjustments` table
- User can view full adjustment history in the Fitness module
- Accepting an adjustment earns the `adaptation` badge (first time only)

---

## 11. Missed Day Handling

### 11.1 Fixed-Duration Plan — Day Shifting
When a user misses a scheduled day in a fixed-duration plan, the AI detects this at midnight and adapts:

```
Day 3 of 7-day plan — missed (Daily not completed by midnight)
        ↓
Midnight job detects miss
        ↓
AI calculates remaining plan days
        ↓
Shifts all remaining days forward by 1
        ↓
Updates expires_on for all future Dailies
        ↓
Notifies user next morning:
"Day 3 was missed. Your plan has been extended by 1 day.
New completion date: [updated date]. Resume with Day 3 today."
```

### 11.2 Ongoing Plan — No Shift Needed
For ongoing plans, missed days are simply logged as missed. The plan continues on its weekly repeat schedule. No shifting occurs — the same day reappears next week.

### 11.3 Consecutive Miss Limit
If a fixed-duration plan has **3 or more consecutive missed days**, the AI sends a special message:
> *"System Warning: 3 consecutive missed protocol days detected. Your plan has been paused automatically. Resume when ready — the System will recalibrate your schedule."*

The plan is set to `status: 'paused'`. The user must manually resume it from the Fitness module. On resume, AI asks: *"Resume from where you left off, or restart the plan?"*

---

## 12. Task Injection into Dailies

### 12.1 How Workout Days Become Dailies
When the user confirms the plan, the backend creates Dailies for each workout day:

```typescript
async function injectWorkoutDailies(userId: string, plan: WorkoutPlan) {
  for (const day of plan.workout_days) {
    if (day.is_rest_day) continue

    await createDaily({
      user_id: userId,
      title: day.day_label,           // e.g. "Push Day — Chest & Shoulders"
      description: `${day.exercises.length} exercises · ${plan.session_duration_minutes} min`,
      priority: 'high',
      category: 'fitness',
      source: 'fitness',
      scheduled_time: day.scheduled_time,
      // For fixed plans:
      expires_on: day.scheduled_date,
      // For ongoing plans:
      repeat_type: 'weekly',
      repeat_days: [day.repeat_day],
      xp_reward: 20,                  // base Daily XP (High priority)
      xp_penalty: 10,                 // missed penalty
      plan_id: plan.id,               // link back to plan for deactivation
      day_id: day.id                  // link to specific workout day
    })
  }
}
```

### 12.2 How Diet Habits Are Injected

```typescript
async function injectDietHabits(userId: string, dietPlan: DietPlan) {
  const habitTemplates = [
    { title: "Log all meals today", hp_penalty: 5 },
    { title: `Hit protein target (${dietPlan.daily_targets.protein_g}g)`, hp_penalty: 5 },
    { title: `Hit water target (3000ml)`, hp_penalty: 5 }
  ]

  for (const template of habitTemplates) {
    await createHabit({
      user_id: userId,
      title: template.title,
      category: 'fitness',
      source: 'fitness',
      reset_type: 'daily',
      is_indefinite: dietPlan.is_ongoing,
      end_date: dietPlan.end_date ?? null,
      xp_reward: 10,
      hp_penalty: template.hp_penalty,
      plan_id: dietPlan.id
    })
  }
}
```

---

## 13. Plan Lifecycle & Deactivation

### 13.1 Multiple Plan Rule
A user can have multiple fitness plans but **only one active plan per plan type at a time**:

| Plan type | Max active |
|-----------|-----------|
| Workout (ongoing) | 1 |
| Workout (fixed-duration) | 1 |
| Diet plan | 1 |

If a user tries to create a new plan while one is active, the AI says:
> *"You currently have an active [plan name]. You must deactivate it before starting a new protocol. Deactivate now?"*

If user confirms → old plan deactivated → all associated Dailies marked `finished` → new plan creation proceeds.

### 13.2 Deactivation Flow

```
User deactivates plan (from Fitness module or chat)
        ↓
All Dailies with plan_id = this plan → marked 'finished', removed from active list
All Habits with plan_id = this plan → remain active (user deletes manually)
Plan record → is_active = false, deactivated_at = now()
        ↓
AI message: "Protocol [name] deactivated. All associated tasks removed.
Your habit tracking tasks remain active — delete them manually if no longer needed."
```

### 13.3 Plan Status Values

| Status | Meaning |
|--------|---------|
| `active` | Running normally |
| `paused` | 3+ consecutive misses detected |
| `completed` | Fixed plan end date reached, all days done |
| `failed` | Fixed plan end date reached, not all days done |
| `deactivated` | Manually turned off by user |

---

## 14. Database Schema

```sql
-- WORKOUT PLANS (upgraded)
CREATE TABLE workout_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  goal                TEXT NOT NULL,
  plan_type           TEXT NOT NULL CHECK (plan_type IN ('ongoing', 'fixed', 'diet_only', 'full')),
  difficulty          TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  days_per_week       INT,
  session_duration_min INT,
  is_ai_generated     BOOLEAN DEFAULT false,
  is_active           BOOLEAN DEFAULT true,
  status              TEXT DEFAULT 'active'
                        CHECK (status IN ('active','paused','completed','failed','deactivated')),
  start_date          DATE DEFAULT CURRENT_DATE,
  end_date            DATE,               -- NULL for ongoing plans
  deactivated_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- WORKOUT DAYS (upgraded)
CREATE TABLE workout_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_number      INT NOT NULL,
  day_label       TEXT,                   -- e.g. "Push Day — Chest & Shoulders"
  name            TEXT,
  muscle_groups   TEXT[] DEFAULT '{}',
  rest_day        BOOLEAN DEFAULT false,
  scheduled_date  DATE,                   -- for fixed plans
  repeat_day      TEXT,                   -- 'mon'|'tue'|... for ongoing plans
  scheduled_time  TIME,
  daily_id        UUID REFERENCES dailies(id)  -- link to injected Daily
);

-- EXERCISES (upgraded)
CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id),  -- NULL = global library
  name            TEXT UNIQUE NOT NULL,
  muscle_group    TEXT,
  equipment       TEXT,
  description     TEXT,
  difficulty      TEXT DEFAULT 'intermediate',
  technique_note  TEXT,
  video_url       TEXT,
  video_title     TEXT,
  video_source    TEXT CHECK (video_source IN ('library', 'youtube_api', 'user')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- WORKOUT DAY EXERCISES (upgraded)
CREATE TABLE workout_day_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id  UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  sets            INT DEFAULT 3,
  reps            TEXT DEFAULT '10',
  rest_seconds    INT DEFAULT 60,
  weight_note     TEXT,
  technique_note  TEXT,
  order_index     INT,
  xp_per_set      INT DEFAULT 3,
  xp_full_exercise INT DEFAULT 10
);

-- WORKOUT SESSION LOGS
CREATE TABLE workout_session_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  workout_day_id  UUID NOT NULL REFERENCES workout_days(id),
  plan_id         UUID NOT NULL REFERENCES workout_plans(id),
  logged_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'partial' CHECK (status IN ('partial','complete')),
  sets_done       JSONB DEFAULT '{}',
  -- sets_done: { "exercise_id": { sets_completed: 3, weights_used: [40,42.5,42.5] } }
  total_xp_earned INT DEFAULT 0,
  session_bonus_xp INT DEFAULT 0,
  duration_minutes INT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- DIET PLANS
CREATE TABLE diet_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  workout_plan_id     UUID REFERENCES workout_plans(id),  -- NULL if diet-only
  daily_calories      INT,
  protein_target_g    DECIMAL,
  carbs_target_g      DECIMAL,
  fat_target_g        DECIMAL,
  budget_bdt_per_day  INT,
  meals_per_day       INT DEFAULT 3,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- MEAL TEMPLATES (per diet plan)
CREATE TABLE meal_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id    UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  meal_type       TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  suggested_time  TIME,
  total_calories  INT,
  notes           TEXT
);

-- MEAL TEMPLATE FOODS
CREATE TABLE meal_template_foods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_template_id UUID NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_name       TEXT NOT NULL,
  quantity        TEXT,
  calories        INT DEFAULT 0,
  protein_g       DECIMAL DEFAULT 0,
  carbs_g         DECIMAL DEFAULT 0,
  fat_g           DECIMAL DEFAULT 0,
  approx_cost_bdt INT DEFAULT 0
);

-- PLAN ADJUSTMENTS LOG
CREATE TABLE plan_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  suggested_at    TIMESTAMPTZ DEFAULT now(),
  reason          TEXT,                   -- 'overperforming' | 'underperforming'
  suggestion      JSONB,                  -- full adjustment detail
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','modified','ignored')),
  resolved_at     TIMESTAMPTZ
);
```

---

## 15. API Reference

### Plan Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fitness/plans` | Get all plans for user (active + archived) |
| `POST` | `/api/fitness/plans` | Create plan (called after user confirms preview) |
| `PATCH` | `/api/fitness/plans/:id` | Update plan status (activate/pause/deactivate) |
| `GET` | `/api/fitness/plans/:id/days` | Get all workout days for a plan |
| `GET` | `/api/fitness/plans/:id/adjustments` | Get AI adjustment history |

### Session Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/fitness/sessions` | Log a workout session (sets, weights) |
| `PATCH` | `/api/fitness/sessions/:id` | Update session (mark complete, add notes) |
| `GET` | `/api/fitness/sessions` | Get session history |

### Nutrition
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fitness/diet/plan` | Get active diet plan with meal templates |
| `GET` | `/api/fitness/nutrition` | Get today's food logs |
| `POST` | `/api/fitness/nutrition` | Log a meal |
| `GET` | `/api/fitness/water` | Get today's water total |
| `POST` | `/api/fitness/water` | Log water intake |

### Calendar Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendar/availability` | Check free slots on a given day/time |
| `POST` | `/api/calendar/events` | Create calendar event for fixed-plan workouts |

---

## 16. AI Prompt Architecture

### 16.1 Interview Prompt (Phase 1)
```
You are the SelfUp System AI — a world-class personal trainer and nutritionist.
Your task is to interview the user to gather all information needed to build their
personalised fitness protocol.

Ask questions one at a time, in a conversational tone.
Use the terminology: "Protocol" (plan), "Phase" (day), "Vessel" (body), "Synthesis" (generation).
Minimum 10 questions, maximum 30. Stop when you have enough to build a complete plan.

After the final question, respond ONLY with:
{"interview_complete": true, "collected_data": { ...all answers... }}

Do not generate the plan yet. Do not add commentary after the JSON.
```

### 16.2 Plan Generation Prompt (Phase 2)
```
You are a world-class personal trainer and nutritionist.
Based on the interview data below, generate a complete fitness protocol.

Interview Data: {interview_data}
User's calendar conflicts: {calendar_conflicts}
Available equipment: {equipment_list}
Budget per day (BDT): {budget}

Return ONLY a valid JSON object matching this exact structure:
{GeneratedPlan interface — full structure injected here}

Rules:
- Every exercise must include a technique_note and video_query field
- Include specific foods with BDT costs for diet plan
- Set session_xp_bonus to 50 for standard sessions, 75 for sessions with weight logging
- Rest days must match the user's stated rest days exactly
- Do not include markdown, commentary, or any text outside the JSON
```

### 16.3 Mid-Plan Analysis Prompt (Phase 3 — Weekly Check)
```
You are analysing a user's fitness protocol performance data.

Plan: {plan_name}
Weeks active: {weeks}
Completion rate last 14 days: {completion_rate}%
Average session duration vs target: {actual_vs_target}
Weight progression: {weight_data}

Based on this data, determine if an adjustment is needed.
If yes, return: {"adjust": true, "reason": "overperforming|underperforming", "suggestion": {...}}
If no, return: {"adjust": false}
Keep suggestion specific and actionable. One change at a time only.
```

---

## 17. File Structure

```
web/src/
├── app/
│   ├── (protected)/
│   │   └── fitness/
│   │       ├── page.tsx                    # Main Fitness Module controller
│   │       └── session/[dayId]/page.tsx    # Active workout session view
│   └── api/
│       └── fitness/
│           ├── plans/route.ts
│           ├── plans/[id]/route.ts
│           ├── plans/[id]/days/route.ts
│           ├── plans/[id]/adjustments/route.ts
│           ├── sessions/route.ts
│           ├── nutrition/route.ts
│           ├── diet/plan/route.ts
│           └── water/route.ts
├── components/
│   └── fitness/
│       ├── WorkoutView.tsx                 # Plan overview + day grid
│       ├── SessionView.tsx                 # Active session execution (new)
│       ├── ExerciseCard.tsx                # Exercise card with video (new)
│       ├── NutritionView.tsx               # Macro tracking
│       ├── DietPlanView.tsx                # Meal template display (new)
│       ├── BodyView.tsx                    # Body metrics + photos
│       ├── PlanPreviewModal.tsx            # Confirmation modal (new)
│       └── AdjustmentSuggestionCard.tsx    # Mid-plan AI suggestion card (new)
├── lib/
│   ├── worker.ts                           # BullMQ background jobs
│   ├── gemma.ts                            # AI model interface
│   ├── youtube.ts                          # YouTube API wrapper (new)
│   └── fitness/
│       ├── planGenerator.ts                # Plan creation logic (new)
│       ├── calendarCheck.ts                # Availability checker (new)
│       ├── dailyInjector.ts                # Daily/Habit injection (new)
│       ├── sessionTracker.ts               # XP calculation per session (new)
│       └── adaptationEngine.ts             # Mid-plan analysis (new)
└── types/
    └── fitness.ts                          # All fitness TypeScript interfaces (new)
```

---

> *"The Vessel does not lie. Every rep is recorded. Every missed session is noted. The System sees all."*

---

**Document version:** 2.0  
**Last updated:** May 2026  
**Related documents:** `task_system_architecture.md`, `gamification_redesign.md`, `features.md`
