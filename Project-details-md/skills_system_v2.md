# SelfUp — Skills Module v2.0 (Scholar Protocol Upgrade)
> **Version:** 2.0  
> **Module:** Skills / Scholar Protocol  
> **Primary Entry Point:** AI Chat → Skills Module  
> **AiCoin Cost:** Variable (5 / 10 / 15 coins + 5 if tests included)  
> **Philosophy:** The AI is a world-class mentor. It interviews, builds a personalised learning path, tests comprehension, and adapts when the user struggles.

---

## Table of Contents
1. [Overview & What Changed](#1-overview--what-changed)
2. [Plan Types](#2-plan-types)
3. [AI Interview Flow](#3-ai-interview-flow)
4. [Roadmap Generation Engine](#4-roadmap-generation-engine)
5. [Calendar & Schedule Integration](#5-calendar--schedule-integration)
6. [Study Session Execution](#6-study-session-execution)
7. [AI Test & Assessment System](#7-ai-test--assessment-system)
8. [Resource Library & YouTube Integration](#8-resource-library--youtube-integration)
9. [XP & Gamification](#9-xp--gamification)
10. [Mid-Roadmap AI Adaptation](#10-mid-roadmap-ai-adaptation)
11. [Missed Day Handling](#11-missed-day-handling)
12. [Task Injection into Dailies](#12-task-injection-into-dailies)
13. [Multiple Skills Management](#13-multiple-skills-management)
14. [Roadmap Lifecycle](#14-roadmap-lifecycle)
15. [Database Schema](#15-database-schema)
16. [API Reference](#16-api-reference)
17. [AI Prompt Architecture](#17-ai-prompt-architecture)
18. [File Structure](#18-file-structure)

---

## 1. Overview & What Changed

### 1.1 Core Upgrade Summary

The v1 skills system required users to manually create a skill and click "Generate AI Roadmap" inside the Skills module. In v2, the **primary entry point is the AI Chat**. The user simply says what they want to learn — the AI handles the full interview, roadmap generation, scheduling, and test creation.

| Feature | v1 | v2 |
|---------|----|----|
| Roadmap creation entry | Skills module button | AI Chat conversation |
| AI questioning | None — just skill name | Dynamic 10–30+ question interview |
| Resource format | "Find Resources" button per milestone | Pre-attached videos per topic on generation |
| Tests | None | AI-generated after each milestone + on-demand |
| Calendar awareness | None | Checks available hours + calendar + Dailies |
| Missed day handling | Logged only | User-chosen: shift forward or fixed schedule |
| Mid-roadmap adaptation | None | AI suggests + user approves |
| Plan confirmation | Auto-created | User previews and confirms before creation |
| XP system | 1 XP/min session | Per-session XP + milestone completion bonus |
| Multiple skills | Supported | Supported — all can run simultaneously |
| AiCoin cost | None | Variable by plan complexity |

### 1.2 Plan Creation Flow (High Level)
```
User in AI Chat: "I want to learn Python"
        ↓
AI starts Interview (10–30+ questions)
        ↓
AI checks available hours + calendar + Dailies for free slots
        ↓
AI generates full roadmap (topics + resources + optional tests)
        ↓
AI shows Roadmap Preview in chat
        ↓
User confirms → Roadmap created in Skills module → Dailies injected
```

---

## 2. Plan Types

There are three plan types. The AI determines which type based on the user's request.

### 2.1 Fixed-Duration Plan (N-Day Plan)
- **Duration:** User-defined (7 days, 14 days, 30 days, custom)
- **Structure:** Each day has a specific topic with resources and estimated study time
- **Injected as:** Dailies with `expires_on` per day
- **Missed day handling:** User chooses at creation — shift forward OR fixed schedule
- **AiCoin cost:** 7-day = 5 coins · 14-day = 8 coins · 30-day = 10 coins
- **Example trigger:** *"I want a 7-day HTML plan"* / *"Give me a 30-day Python challenge"*

### 2.2 Full Open-Ended Roadmap
- **Duration:** Indefinite — runs until user completes all milestones or deactivates
- **Structure:** Phase-based milestones (Beginner → Intermediate → Advanced), each with sub-topics and resources
- **Injected as:** Dailies with `repeat_type: 'weekly'` and `repeat_days` for study days
- **AiCoin cost:** 15 coins
- **Example trigger:** *"I want to fully learn Python"* / *"Make me a complete guitar roadmap"*

### 2.3 Goal-Based Plan
- **Duration:** AI-calculated based on user's target date or goal
- **Structure:** Reverse-engineered from the goal — e.g., "Be job-ready in Python in 3 months"
- **Injected as:** Mix of Dailies (study sessions) and To-Dos (project milestones)
- **AiCoin cost:** 15 coins
- **Example trigger:** *"I want to be job-ready in Python by August"* / *"Help me pass the IELTS in 60 days"*

### 2.4 AiCoin Cost Table

| Plan Type | Without Tests | With AI Tests |
|-----------|--------------|---------------|
| 7-day fixed | 5 coins | 10 coins |
| 14-day fixed | 8 coins | 13 coins |
| 30-day fixed | 10 coins | 15 coins |
| Full open-ended roadmap | 15 coins | 20 coins |
| Goal-based plan | 15 coins | 20 coins |

> Tests can be added or removed during the preview step before confirming. The cost adjusts accordingly.

---

## 3. AI Interview Flow

The AI interview is a dynamic one-at-a-time conversation, not a form. Questions branch based on previous answers. Minimum 10 questions, complex requests can reach 30+.

### 3.1 Interview Trigger Detection
The AI detects skill learning intent from phrases like:
- "I want to learn [skill]", "teach me [skill]", "make me a [skill] roadmap"
- "7-day [skill] plan", "complete [skill] course", "how do I learn [skill]"
- "I want to get better at [skill]", "help me master [skill]"

On detection, the AI responds:
> *"System: Scholar Protocol initiated. I need to run a full assessment to build your personalised learning path. This will take 2–3 minutes. Ready?"*

### 3.2 Universal Questions (All Plan Types)

| # | Question | Purpose |
|---|----------|---------|
| 1 | What exactly do you want to learn? (Be specific if possible) | Defines the skill scope |
| 2 | Why do you want to learn this? (Career / Hobby / Exam / Personal project / Other) | Shapes roadmap focus |
| 3 | What is your current level? (Complete beginner / Know the basics / Intermediate / Advanced) | Sets starting point |
| 4 | Do you want a fixed-duration plan or a full open-ended roadmap? | Determines plan type |
| 5 | How many hours per day can you study? (30 min / 1 hour / 2 hours / More) | Paces daily tasks |
| 6 | Which days can you study? (Select days) | Sets `repeat_days` |
| 7 | What time of day do you prefer to study? (Morning / Afternoon / Evening / Flexible) | Sets `scheduled_time` |
| 8 | Do you have a target date or deadline? (Yes / No) | Triggers goal-based plan logic |
| 9 | How do you learn best? (Watching videos / Reading / Building projects / Mixed) | Biases resource selection |
| 10 | Do you want AI-generated tests after each milestone? (Yes / No) | Adds test generation to plan |

### 3.3 Skill-Category-Specific Questions

**Programming / Technical Skills**
| # | Question | Purpose |
|---|----------|---------|
| 11 | What do you want to build with this skill? (Web apps / Data analysis / Games / Automation / Just learning) | Focuses project examples |
| 12 | What device/environment are you using? (Windows / Mac / Linux / Browser only) | Tailors setup instructions |
| 13 | Do you have any related experience? (e.g., "I know HTML, now learning CSS") | Skips redundant basics |
| 14 | Do you want a project-based approach? (Build things as you learn vs learn concepts first) | Structures milestone order |

**Language Learning**
| # | Question | Purpose |
|---|----------|---------|
| 11 | Which language are you learning? | Specifies resources |
| 12 | What is your target proficiency? (Basic conversation / Business level / Fluent / Exam pass) | Sets roadmap depth |
| 13 | What is your native language? | Adjusts learning approach |
| 14 | Focus area? (Speaking / Writing / Reading / Listening / All) | Weights resource types |

**Music / Creative Skills**
| # | Question | Purpose |
|---|----------|---------|
| 11 | What instrument / creative medium? | Specifies resources |
| 12 | Do you have the required equipment/instrument? | Flags prerequisites |
| 13 | Can you read sheet music / notation? | Adjusts beginner assumptions |
| 14 | Goal: Play for fun, perform, or teach? | Shapes milestone targets |

**General / Other Skills**
| # | Question | Purpose |
|---|----------|---------|
| 11 | What specific outcome do you want? (e.g., "I want to be able to cook 10 different dishes") | Sets measurable target |
| 12 | What resources do you already have access to? (Books, courses, equipment) | Avoids recommending what they have |
| 13 | Who or what is your learning inspiration? | Personalises AI encouragement tone |

### 3.4 Calendar & Availability Check (Automated)
After collecting answers, the AI silently:
1. Reads user's configured daily available hours
2. Calls `GET /api/calendar/availability` for chosen study days and time
3. Calls `GET /api/tasks/scheduled` to check for existing Dailies at that time slot
4. If a conflict is found → AI informs: *"Your [time] on [day] is occupied by [event/task]. I can shift your study session to [alternative]. Is that okay?"*

### 3.5 Interview End Signal
After all questions:
> *"Assessment complete. Synthesising your learning protocol..."*

Background generation starts (BullMQ). When ready:
> *"Your roadmap is ready. Review it below before I activate it."*

---

## 4. Roadmap Generation Engine

### 4.1 What the AI Generates

```typescript
interface GeneratedRoadmap {
  roadmap_meta: {
    skill_name: string               // e.g. "Python Programming"
    skill_category: SkillCategory    // 'coding' | 'language' | 'music' | 'creative' | 'other'
    goal: string                     // e.g. "Build web apps with Python"
    plan_type: 'fixed' | 'open_ended' | 'goal_based'
    duration_days?: number           // for fixed plans
    total_estimated_hours: number
    daily_study_minutes: number
    includes_tests: boolean
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    aicoin_cost: number
  }
  phases: Phase[]                    // open-ended roadmaps have phases
  days?: StudyDay[]                  // fixed plans have day-by-day structure
}

type SkillCategory = 'coding' | 'language' | 'music' | 'creative' | 'fitness' | 'other'

interface Phase {
  phase_number: number
  phase_name: string                 // e.g. "Phase 1 — Python Fundamentals"
  estimated_weeks: number
  milestones: Milestone[]
}

interface Milestone {
  title: string                      // e.g. "Python Variables & Data Types"
  description: string                // What the user will learn / be able to do
  estimated_hours: number
  order_index: number
  topics: Topic[]
  test?: MilestoneTest               // only if includes_tests = true
  xp_reward: number
}

interface Topic {
  title: string                      // e.g. "Understanding variables and assignment"
  type: 'concept' | 'practice' | 'project' | 'review'
  estimated_minutes: number
  resources: Resource[]
}

interface Resource {
  type: 'youtube' | 'article' | 'documentation' | 'exercise'
  title: string
  url?: string                       // pre-fetched from library or YouTube API
  video_query?: string               // used to search YouTube if url is null
  duration_minutes?: number
  is_primary: boolean                // main resource vs supplementary
}

interface StudyDay {                 // for fixed-duration plans
  day_number: number
  day_label: string                  // e.g. "Day 1 — HTML Structure Basics"
  scheduled_date: string             // ISO date
  scheduled_time: string             // e.g. "19:00"
  estimated_minutes: number
  topics: Topic[]
  milestone_id?: string              // which milestone this day belongs to
  has_test: boolean
  test?: MilestoneTest
  daily_id?: string                  // set after Daily is created
  xp_reward: number
}

interface MilestoneTest {
  title: string                      // e.g. "Python Basics — Knowledge Check"
  questions: TestQuestion[]
  passing_score_percent: number      // e.g. 70
  xp_on_pass: number
  xp_on_fail: number                 // small XP for attempting
}

interface TestQuestion {
  type: 'mcq' | 'written' | 'code_challenge'
  question: string
  options?: string[]                 // for MCQ only
  correct_answer?: string            // for MCQ only
  expected_output?: string           // for code challenges
  language?: string                  // for code challenges (e.g. 'python', 'javascript')
  evaluation_criteria?: string       // for written answers — what AI looks for
  points: number
}
```

### 4.2 Roadmap Preview (User Confirmation)
Before creating anything, the AI shows a structured preview in chat:

```
╔══════════════════════════════════════════════════════╗
║  ROADMAP PREVIEW — Python Programming                ║
║                                                      ║
║  Goal: Build web apps with Python                    ║
║  Type: Full Roadmap   Difficulty: Beginner           ║
║  Estimated: ~120 hours   Daily: 1 hour               ║
║                                                      ║
║  PHASES                                              ║
║  Phase 1 — Fundamentals         ~3 weeks  (4 milestones) ║
║  Phase 2 — Intermediate Python  ~4 weeks  (5 milestones) ║
║  Phase 3 — Web Dev with Flask   ~5 weeks  (5 milestones) ║
║  Phase 4 — Final Project        ~2 weeks  (2 milestones) ║
║                                                      ║
║  STUDY SCHEDULE                                      ║
║  Mon / Wed / Fri / Sat — 7:00 PM — 60 min            ║
║                                                      ║
║  TESTS: Included after each milestone (16 total)     ║
║                                                      ║
║  TOTAL XP AVAILABLE: ~4200 XP                        ║
║  AICOIN COST: 20 coins (roadmap + tests)             ║
║                                                      ║
║  [ ACTIVATE ROADMAP ]  [ MODIFY ]  [ REMOVE TESTS ]  ║
╚══════════════════════════════════════════════════════╝
```

**Activate Roadmap** — deducts AiCoins, creates all records, injects Dailies  
**Modify** — user changes any aspect, AI regenerates that section only  
**Remove Tests** — drops test generation, cost reduces by 5 coins  
**Cancel** — no coins deducted, nothing created

---

## 5. Calendar & Schedule Integration

### 5.1 Availability Check Logic

```typescript
async function checkStudyAvailability(
  userId: string,
  preferredDays: string[],
  preferredTime: string,
  durationMinutes: number
) {
  // 1. Get user's configured available hours
  const userProfile = await getUserProfile(userId)
  const { available_hours_start, available_hours_end } = userProfile

  // 2. Check Google Calendar events
  const calendarEvents = await getCalendarEvents(userId, preferredDays)

  // 3. Check existing scheduled Dailies on those days/times
  const scheduledDailies = await getScheduledDailies(userId, {
    repeat_days: preferredDays,
    scheduled_time: preferredTime
  })

  const conflicts = [...calendarEvents, ...scheduledDailies].filter(event =>
    timeOverlaps(event.time, preferredTime, durationMinutes)
  )

  if (conflicts.length > 0) {
    return {
      available: false,
      conflicts,
      suggestedAlternatives: findNextFreeSlots(userId, preferredDays, durationMinutes)
    }
  }
  return { available: true }
}
```

### 5.2 Conflict Resolution
If a conflict is found, the AI presents alternatives:
> *"Your Wednesday 7:00 PM slot has a conflict with 'Deep Work Session'. I can schedule your study session at:*
> - *Wednesday 6:00 PM (before your existing task)*
> - *Wednesday 9:00 PM (after it ends)*
> - *Switch Wednesday to Thursday instead*
>
> *Which works best?"*

---

## 6. Study Session Execution

### 6.1 Session View in Skills Module
When the user opens a study Daily, it expands into a **full session view** inside the Skills module:

- Day/milestone label and estimated duration
- Each topic as a card showing:
  - Topic title and type badge (`concept` / `practice` / `project` / `review`)
  - Estimated time
  - Primary resource (embedded YouTube thumbnail, or article link)
  - 1–2 supplementary resources
  - Completion checkbox
  - Notes field (user can jot down key learnings)
- Session XP counter (live, increments as topics are completed)
- "Mark Session Complete" button

### 6.2 Topic Card Format

```
┌────────────────────────────────────────────────┐
│  CONCEPT  · ~20 min                            │
│  Understanding Python Variables                │
│                                                │
│  What you'll learn: How Python stores data,    │
│  variable naming rules, type assignment.       │
│                                                │
│  [▶ Primary: "Python Variables Explained" 8:22]│
│     CS Dojo · YouTube                          │
│                                                │
│  + Supplementary: Python Docs — Variables      │
│                                                │
│  Notes: _________________________________      │
│                                                │
│  +5 XP    [☐ Mark topic complete]              │
└────────────────────────────────────────────────┘
```

### 6.3 Session Completion States

| State | Definition | XP |
|-------|-----------|-----|
| **Not started** | No topics logged | 0 |
| **Partial** | Some topics completed | Per-topic XP only |
| **Complete** | All topics marked done | Per-topic XP + session bonus |
| **Complete + Notes** | All topics done + at least 1 note written | Per-topic XP + session bonus + notes bonus |

### 6.4 Post-Session Test Trigger
If the session completes a milestone and tests are enabled, the AI sends a notification:
> *"Milestone complete: Python Basics. Your knowledge check is ready. Take the test now for +75 XP?"*

The user can take the test immediately or defer it. Deferred tests appear as a To-Do item with no due date penalty.

---

## 7. AI Test & Assessment System

### 7.1 Test Types by Skill Category

The test format is automatically chosen based on the skill category:

| Skill Category | Primary Format | Secondary Format |
|----------------|---------------|-----------------|
| **Coding / Programming** | Code challenges | MCQ + written |
| **Language learning** | Written (translation, fill-in-blank) | MCQ |
| **Music / Creative** | Written (theory, reflection) | MCQ |
| **General / Other** | MCQ | Written |
| **Mixed skills** | All three formats, weighted by topic | — |

### 7.2 Test Question Types

#### MCQ (Multiple Choice)
```
Question: What is the correct way to declare a list in Python?
A) list = (1, 2, 3)
B) list = [1, 2, 3]   ← correct
C) list = {1, 2, 3}
D) list = <1, 2, 3>

Points: 5
Auto-graded: Yes
```

#### Written Answer (AI-Evaluated)
```
Question: Explain the difference between a list and a tuple in Python.
            When would you use one over the other?

Evaluation criteria: Answer must mention mutability, 
                     use cases, and syntax difference.
Points: 10
Graded by: AI reviews answer against criteria, assigns 0-10 points
```

#### Code Challenge (Skill-Dependent)
```
Question: Write a Python function that takes a list of numbers
          and returns only the even ones.

Expected output for input [1,2,3,4,5,6]: [2,4,6]
Language: Python
Points: 15
Graded by: AI evaluates logic and output correctness
           Partial credit for correct approach with syntax errors
```

### 7.3 Test Execution Flow

```
Milestone completed
        ↓
AI generates test (3–10 questions based on milestone topics)
        ↓
Notification sent to user: "Test ready for [milestone]"
        ↓
User opens test in Skills module
        ↓
User answers all questions
        ↓
Auto-grade MCQs immediately
Written answers → sent to AI for evaluation (async, result in <30 seconds)
Code challenges → sent to AI for logic review (async)
        ↓
Score calculated as percentage
        ↓
Pass (≥70%): +milestone test XP · unlock next milestone
Fail (<70%): +attempt XP (small) · AI suggests review topics · can retry once
```

### 7.4 Test Results & Feedback

After grading, the AI provides specific feedback per question:
- MCQ: Shows correct answer if wrong, brief explanation why
- Written: AI comments on what was covered well and what was missing
- Code: AI shows a sample correct solution and explains the approach

**Test result shown as:**
```
╔══════════════════════════════════════╗
║  KNOWLEDGE CHECK RESULT              ║
║  Python Basics                       ║
║                                      ║
║  Score: 8/10 questions correct       ║
║  Percentage: 80% — PASS             ║
║                                      ║
║  +75 XP earned                       ║
║  Next milestone: UNLOCKED            ║
║                                      ║
║  2 questions to review:              ║
║  Q3: List vs Tuple — see feedback    ║
║  Q7: Loop syntax — see feedback      ║
║                                      ║
║  [ VIEW FEEDBACK ]  [ CONTINUE ]     ║
╚══════════════════════════════════════╝
```

### 7.5 On-Demand Test Requests
At any point, the user can ask the AI in chat:
> *"Test me on what I've learned in Python so far"*
> *"Give me a quick quiz on HTML CSS"*

The AI generates an ad-hoc test based on completed milestones. This costs **2 AiCoins** (cheaper than a milestone test since it's a spot check, not a comprehensive assessment).

### 7.6 Test Retry Rules
- Each milestone test can be retried **once** after a fail
- Retry is available 24 hours after the first attempt (cooldown prevents immediate re-attempt)
- Second attempt pass: full XP awarded
- Second attempt fail: partial XP (25%), AI suggests specific resources to revisit, adaptation suggestion triggered (see §10)

---

## 8. Resource Library & YouTube Integration

### 8.1 Two-Layer Resource System

**Layer 1 — Pre-built Resource Library**
A global curated library of learning resources per topic. Common skills (Python basics, HTML/CSS, guitar chords, English grammar, etc.) have pre-attached resources with verified YouTube URLs.

- Covers the most common skill topics across all categories
- Each entry has: `skill_category`, `topic_name`, `resource_type`, `title`, `url`, `channel`, `duration_minutes`, `quality_score`
- Zero API cost, instant load
- Maintained and updated by the SelfUp team

**Layer 2 — YouTube API Fallback**
For topics not in the library (niche skills, advanced topics):

```typescript
async function getTopicResource(
  skillName: string,
  topicTitle: string,
  skillCategory: SkillCategory
): Promise<Resource | null> {

  // Step 1: Check library
  const libraryMatch = await db.resource_library.findOne({
    where: {
      topic_name: { ilike: topicTitle },
      skill_category: skillCategory
    }
  })
  if (libraryMatch) return libraryMatch

  // Step 2: YouTube API fallback
  const query = buildSearchQuery(skillName, topicTitle, skillCategory)
  // e.g. "Python variables tutorial for beginners"
  // e.g. "C major chord guitar tutorial"
  // e.g. "IELTS writing task 2 tips"

  const result = await youtube.search({
    q: query,
    type: 'video',
    maxResults: 3,
    videoDuration: 'medium',          // prefer 5–20 min tutorials
    relevanceLanguage: 'en',
    videoDefinition: 'high'
  })

  if (result.items.length > 0) {
    const best = result.items[0]
    const resource = {
      type: 'youtube',
      title: best.snippet.title,
      url: `https://youtube.com/watch?v=${best.id.videoId}`,
      channel: best.snippet.channelTitle,
      duration_minutes: parseYTDuration(best.contentDetails?.duration),
      video_query: query,
      source: 'youtube_api'
    }
    // Cache back to library
    await cacheResourceToLibrary(skillName, topicTitle, skillCategory, resource)
    return resource
  }

  return null
}
```

### 8.2 Search Query Builder
The query is constructed intelligently based on skill category:

```typescript
function buildSearchQuery(skill: string, topic: string, category: SkillCategory): string {
  const suffix = {
    coding: 'tutorial for beginners step by step',
    language: 'lesson for beginners explained',
    music: 'lesson tutorial how to play',
    creative: 'tutorial beginner guide',
    other: 'how to learn guide'
  }[category]

  return `${skill} ${topic} ${suffix}`
  // Examples:
  // "Python list comprehension tutorial for beginners step by step"
  // "Spanish present tense lesson for beginners explained"
  // "Guitar F chord lesson tutorial how to play"
}
```

### 8.3 Resource Quality Scoring
When caching YouTube results, the system scores resources to surface the best ones:

```typescript
function scoreResource(video: YouTubeVideo): number {
  return (
    (video.statistics.viewCount / 1_000_000) * 0.3 +   // views (millions)
    (video.statistics.likeCount / video.statistics.viewCount) * 100 * 0.4 + // like ratio
    (isShortDuration(video) ? 0 : 30) * 0.3             // prefer non-Shorts
  )
}
```

---

## 9. XP & Gamification

### 9.1 XP Earn Structure — Skills

| Action | XP |
|--------|-----|
| Complete 1 topic in a session | +5 XP |
| Complete full study session (all topics) | +25 XP bonus |
| Complete full session + wrote notes | +35 XP bonus (replaces 25) |
| Complete a milestone | +50–150 XP (scales with milestone size) |
| Pass a milestone test (first attempt) | +75 XP |
| Pass a milestone test (second attempt) | +75 XP |
| Fail a test (attempted) | +10 XP |
| Pass an on-demand quiz | +20 XP |
| Complete a full phase | +200 XP bonus |
| Complete entire roadmap | +500 XP |
| 7-day study streak | +100 XP |
| 30-day study streak | +500 XP |
| Complete fixed plan fully (all days) | +300 XP |

**INT attribute multiplier:** +0.5% XP on all skill actions per INT point (inherited from task system).

### 9.2 Milestone XP Scaling
Milestone XP reward scales with estimated hours:

| Milestone Estimated Hours | XP Reward |
|--------------------------|-----------|
| < 2 hours | 50 XP |
| 2–4 hours | 75 XP |
| 4–8 hours | 100 XP |
| 8–15 hours | 125 XP |
| 15+ hours | 150 XP |

### 9.3 Skills-Specific Badges

| Badge | Condition | Rarity |
|-------|-----------|--------|
| `first_lesson` | Complete first study session | Common |
| `scholar_start` | Activate first AI skill roadmap | Common |
| `milestone_crusher` | Complete 5 milestones | Rare |
| `polymath` | Have 3 active skills simultaneously | Rare |
| `dedicated` | 100 total skill hours logged | Rare |
| `test_ace` | Pass 10 milestone tests on first attempt | Epic |
| `never_fail` | Complete a full roadmap with 0 failed tests | Legendary |
| `speed_learner` | Complete a 30-day plan in under 25 days | Epic |
| `comeback_scholar` | Fail a test twice, then pass on retry | Common |
| `full_stack` | Complete roadmaps for 3 different skill categories | Epic |
| `scholar_supreme` | INT attribute reaches 20 | Epic |

### 9.4 HP Impact from Missed Study Sessions
Study session Dailies are `priority: 'medium'` by default. Missed sessions follow standard Daily XP penalty (–5 XP). No HP damage from missed study sessions — only Habits affect HP.

---

## 10. Mid-Roadmap AI Adaptation

### 10.1 When AI Suggests Adjustments
The AI monitors study data weekly and suggests changes in two scenarios:

**Scenario A — Too Fast (Overperforming)**
Triggered when: User consistently passes all tests on first attempt with 90%+ scores, completes sessions faster than estimated, and is ahead of schedule by 2+ days.

AI message:
> *"System Analysis: You're progressing faster than the roadmap anticipated — 92% average test score, 2 days ahead of schedule. I recommend accelerating to the next phase and adding advanced topics. Approve adjustment?"*

**Scenario B — Struggling (Underperforming)**
Triggered when: User fails 2+ tests in the same phase, completes fewer than 60% of study sessions over 2 weeks, or consistently logs sessions as "Partial."

AI message:
> *"System Analysis: You've failed 2 tests this phase and your completion rate is 54%. I recommend: Revisit Phase 1 milestones 2 and 3, reduce daily session length from 60 to 30 minutes, and slow the pace of new topics. Approve adjustment?"*

### 10.2 User Response Options

```
[ APPROVE ]   [ MODIFY SUGGESTION ]   [ IGNORE ]
```

- **Approve** — AI updates roadmap, re-sequences milestones, updates Daily injection
- **Modify** — User adjusts specific parts of the suggestion
- **Ignore** — AI will not suggest again for 7 days

### 10.3 Adaptation Actions Available

| Adaptation Type | What Changes |
|----------------|-------------|
| Slow down pace | Reduces topics per session, extends estimated completion |
| Speed up pace | Adds topics per session, shortens estimated completion |
| Add review session | Inserts a dedicated revision day before next milestone |
| Swap resources | Replaces underperforming YouTube link with alternative |
| Reorder milestones | Moves a difficult milestone later in the roadmap |
| Reduce difficulty | Adds more beginner-friendly topics before current milestone |

---

## 11. Missed Day Handling

### 11.1 User Choice at Plan Creation
For **fixed-duration plans**, the user chooses one of two behaviours at creation time:

**Option A — Shift Forward**
If a day is missed, all remaining days shift forward by 1. The plan end date extends.
> Best for: Users who want to complete 100% of the content no matter what.

**Option B — Fixed Schedule**
If a day is missed, the plan continues on its original dates. The missed day is logged as skipped.
> Best for: Users with a hard deadline (e.g., exam in 7 days).

The AI asks during the interview:
> *"If you miss a study day, should I extend your plan to make up for it, or keep the original schedule?"*

### 11.2 Shift Forward Logic (Option A)

```
Day 4 of 7-day plan — missed (Daily not completed by midnight)
        ↓
Midnight job detects miss
        ↓
Shifts all remaining days forward by 1
Updates scheduled_date and expires_on for remaining Dailies
        ↓
Notifies user next morning:
"Day 4 was missed. Your plan has been extended by 1 day.
New completion date: [updated date]. Resume with Day 4 today."
```

### 11.3 Consecutive Miss Limit (Both Options)
If **3 or more consecutive days** are missed in a fixed plan:
> *"System Warning: 3 consecutive missed study days detected. Your roadmap has been paused. Resume when ready — the System will recalibrate."*

Plan status → `paused`. User must manually resume. On resume, AI asks:
> *"Resume from Day [N], or restart the plan from Day 1?"*

### 11.4 Open-Ended Roadmap — No Shift
For open-ended roadmaps, missed study days are logged but the weekly repeat schedule continues unchanged. The roadmap adapts through the AI adaptation engine (§10) rather than day-shifting.

---

## 12. Task Injection into Dailies

### 12.1 Fixed Plan — Daily Injection

```typescript
async function injectStudyDailies(userId: string, roadmap: SkillRoadmap) {
  for (const day of roadmap.days) {
    await createDaily({
      user_id: userId,
      title: day.day_label,          // e.g. "Day 3 — HTML Forms & Inputs"
      description: `${day.topics.length} topics · ${day.estimated_minutes} min`,
      priority: 'medium',
      category: 'skills',
      source: 'skills',
      scheduled_time: day.scheduled_time,
      expires_on: day.scheduled_date,
      xp_reward: 10,                  // medium priority Daily XP
      xp_penalty: 5,
      roadmap_id: roadmap.id,
      day_id: day.id,
      // shift_on_miss stored at roadmap level, applied by midnight job
    })
  }
}
```

### 12.2 Open-Ended Roadmap — Weekly Repeat Injection

```typescript
async function injectOngoingStudyDailies(userId: string, roadmap: SkillRoadmap) {
  // One Daily per study day — repeats every week on chosen days
  for (const studyDay of roadmap.weekly_study_days) {
    await createDaily({
      user_id: userId,
      title: `${roadmap.skill_name} — Study Session`,
      description: `Current phase: ${roadmap.current_phase_name}`,
      priority: 'medium',
      category: 'skills',
      source: 'skills',
      repeat_type: 'weekly',
      repeat_days: [studyDay],        // e.g. ['mon']
      scheduled_time: roadmap.scheduled_time,
      xp_reward: 10,
      xp_penalty: 5,
      roadmap_id: roadmap.id
    })
  }
}
```

### 12.3 Project Milestone — To-Do Injection
For goal-based plans with project milestones (e.g., "Build a calculator app"):

```typescript
await createTodo({
  user_id: userId,
  title: milestone.title,            // e.g. "Build Calculator App"
  description: milestone.description,
  priority: 'high',
  category: 'skills',
  source: 'skills',
  due_date: milestone.target_date,
  xp_reward: 20,
  xp_penalty: 20,                    // high priority overdue penalty
  roadmap_id: roadmap.id,
  milestone_id: milestone.id
})
```

---

## 13. Multiple Skills Management

### 13.1 No Limit on Simultaneous Skills
Users can have multiple active skills running at the same time. There is no hard cap.

However, the AI warns the user if it detects overload during the interview:
> *"You currently have 3 active skills. Adding Python will require 1 hour/day on top of your existing commitments. Your schedule shows limited free time on weekdays. Still want to proceed?"*

### 13.2 Skills Dashboard Overview
The Skills module shows all active skills as cards with:
- Skill name + category icon
- Current phase / day progress
- Study streak
- Last session date
- Next session scheduled time
- Overall completion percentage

### 13.3 Skill Priority (User-Set)
Users can set a **Primary Skill** — this skill's study Dailies appear first in the Dailies panel. Secondary skills appear below. This is cosmetic only — all skills still run and penalise equally.

### 13.4 Pausing a Skill
Users can pause any active skill. When paused:
- All injected Dailies for that skill are suspended (not missed, not penalised)
- Streak is frozen (not reset) while paused
- The skill card shows "PAUSED" status
- User can resume anytime — Dailies reactivate

---

## 14. Roadmap Lifecycle

### 14.1 Status Values

| Status | Meaning |
|--------|---------|
| `active` | Running normally |
| `paused` | Manually paused by user or 3+ missed days |
| `completed` | All milestones/days finished successfully |
| `failed` | Fixed plan end date reached, not all content done |
| `deactivated` | Manually turned off |

### 14.2 Completion Event
When all milestones/days are completed:
1. Full-screen cinematic: *"Scholar Protocol Complete. All milestones cleared."*
2. Final XP bonus awarded (+500 XP)
3. Skill marked as `mastered` on profile
4. Completion badge issued
5. AI generates a brief summary: *"You completed Python in 47 days, logged 62 hours, passed 14/16 tests on first attempt."*

### 14.3 Deactivation Flow

```
User deactivates roadmap
        ↓
All Dailies with roadmap_id → marked 'finished', removed from active list
All To-Dos with roadmap_id → remain (user deletes manually)
Roadmap record → status = 'deactivated', deactivated_at = now()
Skill record → is_active = false (if no other roadmap exists for this skill)
        ↓
AI message: "Roadmap [name] deactivated. Study sessions removed.
Any project To-Dos remain active — delete them manually if no longer needed."
```

---

## 15. Database Schema

```sql
-- SKILLS (upgraded)
CREATE TABLE skills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT CHECK (category IN ('coding','language','music','creative','fitness','other')),
  icon            TEXT,
  color           TEXT,
  tracking_mode   TEXT DEFAULT 'milestone' CHECK (tracking_mode IN ('time','milestone','points')),
  total_hours     DECIMAL DEFAULT 0,
  total_points    INT DEFAULT 0,
  streak          INT DEFAULT 0,
  streak_last_date DATE,
  is_primary      BOOLEAN DEFAULT false,     -- user's primary active skill
  is_active       BOOLEAN DEFAULT true,
  is_mastered     BOOLEAN DEFAULT false,     -- set on roadmap completion
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- SKILL ROADMAPS (upgraded)
CREATE TABLE skill_roadmaps (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id              UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  goal                  TEXT,
  plan_type             TEXT NOT NULL CHECK (plan_type IN ('fixed','open_ended','goal_based')),
  difficulty            TEXT DEFAULT 'beginner',
  daily_study_minutes   INT DEFAULT 60,
  weekly_study_days     TEXT[] DEFAULT '{}',   -- ['mon','wed','fri']
  scheduled_time        TIME,
  includes_tests        BOOLEAN DEFAULT false,
  is_ai_generated       BOOLEAN DEFAULT false,
  status                TEXT DEFAULT 'active'
                          CHECK (status IN ('active','paused','completed','failed','deactivated')),
  shift_on_miss         BOOLEAN DEFAULT true,  -- for fixed plans only
  start_date            DATE DEFAULT CURRENT_DATE,
  end_date              DATE,
  deactivated_at        TIMESTAMPTZ,
  aicoin_cost           INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- SKILL PHASES (for open-ended roadmaps)
CREATE TABLE skill_phases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id      UUID NOT NULL REFERENCES skill_roadmaps(id) ON DELETE CASCADE,
  phase_number    INT NOT NULL,
  phase_name      TEXT NOT NULL,
  estimated_weeks INT,
  is_completed    BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  xp_bonus        INT DEFAULT 200
);

-- SKILL MILESTONES (upgraded)
CREATE TABLE skill_milestones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id        UUID NOT NULL REFERENCES skill_roadmaps(id) ON DELETE CASCADE,
  phase_id          UUID REFERENCES skill_phases(id),
  title             TEXT NOT NULL,
  description       TEXT,
  estimated_hours   DECIMAL,
  order_index       INT,
  is_completed      BOOLEAN DEFAULT false,
  completed_at      TIMESTAMPTZ,
  xp_reward         INT DEFAULT 50,
  test_id           UUID REFERENCES milestone_tests(id)
);

-- SKILL TOPICS (sub-steps within a milestone or day)
CREATE TABLE skill_topics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id        UUID REFERENCES skill_milestones(id) ON DELETE CASCADE,
  study_day_id        UUID REFERENCES skill_study_days(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  type                TEXT CHECK (type IN ('concept','practice','project','review')),
  estimated_minutes   INT,
  is_completed        BOOLEAN DEFAULT false,
  completed_at        TIMESTAMPTZ,
  xp_reward           INT DEFAULT 5,
  order_index         INT
);

-- TOPIC RESOURCES
CREATE TABLE topic_resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        UUID NOT NULL REFERENCES skill_topics(id) ON DELETE CASCADE,
  type            TEXT CHECK (type IN ('youtube','article','documentation','exercise')),
  title           TEXT NOT NULL,
  url             TEXT,
  channel         TEXT,
  duration_minutes INT,
  is_primary      BOOLEAN DEFAULT false,
  video_query     TEXT,
  source          TEXT CHECK (source IN ('library','youtube_api','user'))
);

-- SKILL STUDY DAYS (for fixed-duration plans)
CREATE TABLE skill_study_days (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id        UUID NOT NULL REFERENCES skill_roadmaps(id) ON DELETE CASCADE,
  day_number        INT NOT NULL,
  day_label         TEXT,
  scheduled_date    DATE,
  scheduled_time    TIME,
  estimated_minutes INT,
  is_completed      BOOLEAN DEFAULT false,
  is_missed         BOOLEAN DEFAULT false,
  daily_id          UUID REFERENCES dailies(id),
  has_test          BOOLEAN DEFAULT false,
  xp_reward         INT DEFAULT 10
);

-- MILESTONE TESTS
CREATE TABLE milestone_tests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id          UUID NOT NULL REFERENCES skill_roadmaps(id) ON DELETE CASCADE,
  milestone_id        UUID REFERENCES skill_milestones(id),
  study_day_id        UUID REFERENCES skill_study_days(id),
  title               TEXT NOT NULL,
  questions           JSONB NOT NULL,   -- array of TestQuestion objects
  passing_score_pct   INT DEFAULT 70,
  xp_on_pass          INT DEFAULT 75,
  xp_on_fail          INT DEFAULT 10,
  is_ad_hoc           BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- TEST ATTEMPTS
CREATE TABLE test_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES milestone_tests(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  attempt_number  INT DEFAULT 1,
  answers         JSONB,             -- user's answers
  score_pct       DECIMAL,
  passed          BOOLEAN,
  xp_earned       INT DEFAULT 0,
  feedback        JSONB,             -- AI-generated per-question feedback
  attempted_at    TIMESTAMPTZ DEFAULT now()
);

-- SKILL SESSIONS (upgraded)
CREATE TABLE skill_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id          UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  study_day_id      UUID REFERENCES skill_study_days(id),
  session_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes  INT,
  status            TEXT DEFAULT 'partial' CHECK (status IN ('partial','complete')),
  topics_completed  INT DEFAULT 0,
  topics_total      INT DEFAULT 0,
  has_notes         BOOLEAN DEFAULT false,
  notes             TEXT,
  mood              INT CHECK (mood BETWEEN 1 AND 5),
  xp_earned         INT DEFAULT 0,
  session_bonus_xp  INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- RESOURCE LIBRARY (global pre-built resources)
CREATE TABLE resource_library (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_category  TEXT NOT NULL,
  topic_name      TEXT NOT NULL,
  resource_type   TEXT CHECK (resource_type IN ('youtube','article','documentation','exercise')),
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,
  channel         TEXT,
  duration_minutes INT,
  quality_score   DECIMAL DEFAULT 0,
  source          TEXT DEFAULT 'library' CHECK (source IN ('library','youtube_api')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (topic_name, url)
);

-- ROADMAP ADAPTATION LOG
CREATE TABLE roadmap_adaptations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id      UUID NOT NULL REFERENCES skill_roadmaps(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  suggested_at    TIMESTAMPTZ DEFAULT now(),
  reason          TEXT CHECK (reason IN ('overperforming','underperforming')),
  suggestion      JSONB,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','modified','ignored')),
  resolved_at     TIMESTAMPTZ
);
```

---

## 16. API Reference

### Roadmap Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/skills` | Get all skills for user |
| `POST` | `/api/skills` | Create new skill record |
| `GET` | `/api/skills/:id/roadmap` | Get full roadmap with phases/milestones/topics |
| `POST` | `/api/skills/:id/roadmap` | Create roadmap (called after user confirms preview) |
| `PATCH` | `/api/skills/:id/roadmap/:rid` | Update roadmap status |
| `GET` | `/api/skills/:id/roadmap/:rid/adaptations` | Get AI adaptation history |

### Session & Milestone Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/skills/:id/sessions` | Log a study session |
| `PATCH` | `/api/skills/:id/sessions/:sid` | Update session (mark complete, add notes) |
| `PATCH` | `/api/skills/:id/milestones/:mid` | Mark milestone complete |
| `GET` | `/api/skills/:id/sessions` | Get session history |

### Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/skills/tests/:tid` | Get test questions |
| `POST` | `/api/skills/tests/:tid/attempt` | Submit test answers |
| `GET` | `/api/skills/tests/:tid/result` | Get graded result + feedback |
| `POST` | `/api/skills/tests/adhoc` | Request on-demand test (costs 2 AiCoins) |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/youtube/search` | Search YouTube for topic resource |
| `GET` | `/api/skills/resources/library` | Query pre-built resource library |

---

## 17. AI Prompt Architecture

### 17.1 Interview Prompt (Phase 1)
```
You are the SelfUp System AI — a world-class learning mentor and skill coach.
Your task is to interview the user to gather all information needed to build
their personalised learning roadmap.

Ask questions one at a time, in a conversational tone.
Use the terminology: "Roadmap" (plan), "Milestone" (major goal), "Protocol" (roadmap).
Minimum 10 questions, maximum 30. Stop when you have enough to build a complete plan.

After the final question, respond ONLY with:
{"interview_complete": true, "collected_data": { ...all answers... }}

Do not generate the roadmap yet. Do not add commentary after the JSON.
```

### 17.2 Roadmap Generation Prompt (Phase 2)
```
You are a world-class learning mentor and curriculum designer.
Based on the interview data below, generate a complete personalised learning roadmap.

Interview Data: {interview_data}
Skill Category: {skill_category}
Calendar conflicts: {calendar_conflicts}
Available study time: {daily_minutes} minutes/day on {study_days}
Includes tests: {includes_tests}
Plan type: {plan_type}

Return ONLY a valid JSON object matching the GeneratedRoadmap interface exactly.

Rules:
- Every topic must include at least 1 resource with a video_query field
- For coding skills: include at least 1 code_challenge test question per milestone
- For language skills: include fill-in-blank and translation written questions
- Milestone XP must scale with estimated_hours (see XP scaling table)
- Do not include markdown, commentary, or text outside the JSON
- Keep day labels concise and specific (max 50 chars)
- Include technique_note equivalent (learning tip) per topic
```

### 17.3 Test Generation Prompt (Phase 3 — Per Milestone)
```
You are generating a knowledge assessment for a learner who just completed
the following milestone:

Skill: {skill_name}
Milestone: {milestone_title}
Topics covered: {topics_list}
Skill category: {skill_category}
User level: {user_level}

Generate a test with {question_count} questions (mix of types appropriate for {skill_category}).
For coding skills: include at least 2 code challenges.
For language skills: include at least 2 written translation/fill-in questions.
All skills: include at least 3 MCQ questions.

Passing score: 70%.
Return ONLY a valid JSON matching the MilestoneTest interface.
```

### 17.4 Test Evaluation Prompt (Phase 4 — Written/Code Answers)
```
You are evaluating a student's answer for a skills assessment.

Question: {question}
Evaluation criteria: {criteria}
Student's answer: {student_answer}
Expected output (if code): {expected_output}
Max points: {max_points}

Return ONLY:
{
  "points_awarded": number,
  "feedback": "specific, encouraging feedback in 1-2 sentences",
  "correct": boolean
}
```

### 17.5 Adaptation Analysis Prompt (Phase 5 — Weekly)
```
Analyse this learner's performance data for their skill roadmap.

Skill: {skill_name}
Weeks active: {weeks}
Session completion rate (last 14 days): {completion_rate}%
Average test score: {avg_test_score}%
Tests failed: {failed_tests}
Days ahead/behind schedule: {schedule_delta}

Determine if an adaptation is needed.
If yes: {"adapt": true, "reason": "overperforming|underperforming", "suggestion": {...}}
If no: {"adapt": false}
Suggestion must be specific and actionable. Maximum 1 change at a time.
```

---

## 18. File Structure

```
web/src/
├── app/
│   ├── (protected)/
│   │   └── skills/
│   │       ├── page.tsx                      # Skills dashboard
│   │       └── [skillId]/
│   │           ├── roadmap/page.tsx           # Full roadmap view
│   │           └── session/[dayId]/page.tsx   # Active study session
│   └── api/
│       └── skills/
│           ├── route.ts
│           ├── [id]/route.ts
│           ├── [id]/roadmap/route.ts
│           ├── [id]/sessions/route.ts
│           ├── [id]/milestones/[mid]/route.ts
│           ├── tests/[tid]/route.ts
│           ├── tests/[tid]/attempt/route.ts
│           └── tests/adhoc/route.ts
├── components/
│   └── skills/
│       ├── SkillCard.tsx                      # Skill overview card
│       ├── SkillsPage.tsx                     # Skills dashboard
│       ├── RoadmapTimeline.tsx                # Phase + milestone visual
│       ├── StudySessionView.tsx               # Active session execution (new)
│       ├── TopicCard.tsx                      # Topic card with resources (new)
│       ├── MilestoneTestView.tsx              # Test UI (new)
│       ├── TestResultCard.tsx                 # Result + feedback display (new)
│       ├── RoadmapPreviewModal.tsx            # Confirmation modal (new)
│       └── AdaptationSuggestionCard.tsx       # AI adaptation card (new)
├── lib/
│   ├── worker.ts                              # BullMQ background jobs
│   ├── gemma.ts                               # AI model interface
│   ├── youtube.ts                             # YouTube API wrapper
│   └── skills/
│       ├── roadmapGenerator.ts                # Roadmap creation logic (new)
│       ├── calendarCheck.ts                   # Availability checker
│       ├── dailyInjector.ts                   # Daily injection (new)
│       ├── testGenerator.ts                   # Test generation (new)
│       ├── testEvaluator.ts                   # AI answer evaluation (new)
│       ├── adaptationEngine.ts                # Weekly analysis (new)
│       └── resourceResolver.ts               # Library + YouTube lookup (new)
└── types/
    └── skills.ts                              # All skills TypeScript interfaces (new)
```

---

> *"The System does not grant knowledge. It creates the conditions for it. The rest is on you."*

---

**Document version:** 2.0  
**Last updated:** May 2026  
**Related documents:** `task_system_architecture.md`, `gamification_redesign.md`, `fitness_system_v2.md`
