# SelfUp — Onboarding System Details

## 1. Overview
The onboarding process is the critical entry point where SelfUp transforms from a generic tool into a personalized life coach. It collects user data, establishes the AI's persona, and generates an initial "Starter Plan" to provide immediate value.

---

## 2. The Onboarding Flow (Frontend)
The onboarding is implemented as a multi-step guided experience in `web/src/app/onboarding/page.tsx`.

### Step 1: About You
- **Data Collected:** Display Name, Age, Gender, and Timezone.
- **Purpose:** Establishes the basic user profile and ensures all time-based AI triggers (morning check-ins, etc.) are synchronized with the user's local time.

### Step 2: Goal Selection
- **Categories:** Build Muscle, Lose Weight, Learn Skills, Better Sleep, Productivity, Style.
- **Purpose:** Categorizes the user's primary interests. These categories influence the types of questions asked in the next step and the structure of the initial plan.

### Step 3: AI Deep Dive (Dynamic Questions)
This is a unique AI-driven step.
- **Mechanism:** The frontend calls `/api/onboarding/questions`.
- **Dynamic Content:** The AI analyzes the selected goals and generates 3-5 personalized questions.
- **Example Questions:**
  - *Fitness:* "What's your current experience level with strength training?"
  - *Skills:* "How many hours per week can you realistically dedicate to learning?"
  - *Productivity:* "What is your biggest obstacle to staying focused during the day?"
- **Purpose:** Collects high-quality qualitative data that regex-based extraction might miss.

### Summary of Questions by Step:

| Step | Question / Field | Type |
| :--- | :--- | :--- |
| **About You** | Display Name | Text (Required) |
| **About You** | Age | Number (Optional) |
| **About You** | Gender | Selection (Male, Female, Non-binary, Other, Prefer not to say) |
| **About You** | Timezone | Auto-detected (e.g., Asia/Dhaka) |
| **AI Deep Dive** | Current Experience Level | AI-Generated (ID: `exp` or `experience`) |
| **AI Deep Dive** | Weekly Commitment | AI-Generated (ID: `time` or `commitment`) |
| **AI Deep Dive** | Obstacles / Motivation | AI-Generated (ID: `obstacle` or `motivation`) |
| **AI Persona** | Companion Name | Text (e.g., Aria, System) |
| **AI Persona** | Interaction Style | Selection (Friendly, Strict, Neutral, Motivational) |

### AI Deep Dive: Question Generation & Fallbacks
The system asks 3 essential questions generated dynamically based on the user's selected goals. 

#### AI Prompt Template:
> "Generate 3 essential and concise follow-up questions to understand their current status, previous experience, and any immediate obstacles related to these goals [Selected Goals]."

#### Fallback Questions (if AI is unavailable):
1. **Experience:** "What is your current experience level with these goals?"
2. **Commitment:** "How many hours per week can you realistically dedicate to your growth?"
3. **Motivation:** "What motivated you to start this journey today?"

### Step 4: AI Persona Configuration
Users define their relationship with the AI.
- **Persona Name:** Custom name (e.g., "Jarvis", "Aria").
- **Interaction Style:**
  - **Friendly:** Balanced and supportive.
  - **Strict:** "Tough Love" (Drill Sergeant style).
  - **Neutral:** Analytical and data-driven.
  - **Motivational:** High-energy cheerleader.

### Step 5: Finalization
- **Completion:** The user enters the dashboard, and the `onboarding_done` flag is set to `true`.

---

## 3. Backend Processing (`/api/onboarding`)
When the user submits the onboarding form, the backend performs several critical operations to initialize the account.

### 1. Profile Synchronization
- Updates the `user_profiles` table with demographic data and the selected AI persona.

### 2. Memory Population
- **Direct Save:** Goals and Persona style are saved to the `ai_memory` table.
- **Smart Mapping:** Text answers from the "Deep Dive" are mapped to standardized memory keys:
  - `exp` → `fitness_level` or `learning_style`.
  - `commitment` → `workout_frequency` or `work_hours`.
  - `motivation` → `user_challenges`.

### 3. Plan Enqueueing
- An `initial_plan` task is added to the `ai_queue` for the background worker to process.

---

## 4. AI Starter Plan Generation
The background worker (using Gemma 3) executes the `initial_plan` task to populate the user's dashboard with "Day 1" content.

### Components of the Starter Plan:
- **Habits (2-3):** Easy-to-start behaviors (e.g., "Drink 2L Water", "Morning Stretch").
- **Tasks (2-3):** Initial setup actions (e.g., "Log your first meal", "Define your first skill milestone").
- **Starter Quest (1):** A "First Steps" quest designed to be completed within 24-72 hours to grant initial XP and AiCoins.

### Logic:
The AI takes the goals and deep-dive answers into account. If a user wants to "Build Muscle," the starter tasks will be fitness-focused. If they want "Productivity," the habits will focus on deep work or morning routines.

---

## 5. Technical Implementation Summary

| Component | File Path |
| :--- | :--- |
| **Frontend Page** | `web/src/app/onboarding/page.tsx` |
| **Questions API** | `web/src/app/api/onboarding/questions/route.ts` |
| **Completion API** | `web/src/app/api/onboarding/route.ts` |
| **Worker Logic** | `web/src/lib/worker.ts` (case `initial_plan`) |
| **Database Flags** | `user_profiles.onboarding_done` |

---
