# SelfUp — Pathfinder Engine v3.0
> **Version:** 3.0  
> **Internal Name:** Pathfinder Engine  
> **Philosophy:** One global AI coach. Remembers everything. Acts on intent. Stays in scope.  
> **Default Model:** Gemma 4 (user-configurable)  
> **Memory Architecture:** RAG + Vector Store + Key-Value Facts  
> **Scope:** Self-improvement only — fitness, skills, time, style, gamification

---

## Table of Contents
1. [What Changed from v2.5](#1-what-changed-from-v25)
2. [System Architecture](#2-system-architecture)
3. [Model Strategy & User Configuration](#3-model-strategy--user-configuration)
4. [Memory Engine — RAG + Vector Store](#4-memory-engine--rag--vector-store)
5. [Context Construction Pipeline](#5-context-construction-pipeline)
6. [Conversation Scope & Mode Detection](#6-conversation-scope--mode-detection)
7. [Autonomous Action System](#7-autonomous-action-system)
8. [AI Persona System](#8-ai-persona-system)
9. [Proactive AI — Alert System](#9-proactive-ai--alert-system)
10. [Weekly Summary System](#10-weekly-summary-system)
11. [Test Evaluation Pipeline](#11-test-evaluation-pipeline)
12. [AiCoin Economy](#12-aicoin-economy)
13. [Rate Limiting & Queue Strategy](#13-rate-limiting--queue-strategy)
14. [Background Worker Architecture](#14-background-worker-architecture)
15. [API Reference](#15-api-reference)
16. [Database Schema](#16-database-schema)
17. [System Prompt Architecture](#17-system-prompt-architecture)
18. [Developer Guide — Adding New Actions](#18-developer-guide--adding-new-actions)

---

## 1. What Changed from v2.5

| Feature | v2.5 | v3.0 |
|---------|-------|-------|
| Memory system | Key-value fact store | RAG + Vector Store + Key-value facts |
| Model selection | Fixed 3-tier | User-configurable in settings, default Gemma 4 |
| Conversation scope | Implied global | Explicitly one global chat for all modules |
| Task creation | Generic `create_task` only | Separate `create_daily`, `create_habit`, `create_todo` with confirmation |
| AI personas | 4 fixed styles | 4 original + 2 new + fully custom free-text persona |
| Proactive messages | Morning check-ins + all alerts | Critical alerts only (streak danger, HP collapse) |
| Weekly summary | Auto every Monday | User-scheduled, AI delivers on chosen day/time |
| Test evaluation | Not in AI system | Integrated into main chat pipeline |
| Fitness plan cost | 25 coins | 25 coins (confirmed) |
| Skills plan cost | Not in AI doc | Variable 5–20 coins (see skills doc) |
| Voice | Planned | Deferred to V2 |
| AI scope | General coaching | Self-improvement only — redirects off-topic queries |
| Interview mode | Formal locked state | Conversational — AI stays focused without locking |
| Guild actions | Not defined | AI suggests guild actions, never executes them |

---

## 2. System Architecture

### 2.1 The Observer-Retriever Pattern
The v3 Pathfinder Engine combines two patterns:

**Observer** — The AI has access to the user's live application state (HP, XP, streaks, active plans, recent task history). It doesn't wait to be told what's happening — it knows.

**Retriever** — When context from past conversations or specific memories is needed, the AI uses RAG (Retrieval-Augmented Generation) to fetch relevant vector embeddings from the memory store before generating a response.

```
User message received
        ↓
Intent classifier → determines if retrieval is needed
        ↓
[If retrieval needed] → Vector search → fetch relevant memory chunks
        ↓
Context assembly: system prompt + live state snapshot + retrieved memories + conversation window
        ↓
Model generation (streamed)
        ↓
Post-processing: action parsing → memory extraction → coin deduction
        ↓
Response delivered to user
```

### 2.2 Core Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **AI Core** | Google AI Studio | Gemma 4 (default), user-configurable |
| **Background Tasks** | Google AI Studio | Same model as chat, or user-configured model |
| **Runtime** | Node.js + Next.js App Router | |
| **Primary DB** | Supabase (PostgreSQL) | All persistent data |
| **Vector Store** | Supabase `pgvector` extension | Stores conversation embeddings for RAG |
| **Embedding Model** | `text-embedding-004` (Google) | Converts text to vectors |
| **Job Queue** | BullMQ + Redis | Background plan generation |
| **Streaming** | HTTP streaming | With polling fallback for background jobs |
| **Frontend** | React 19, TailwindCSS, Framer Motion | |

---

## 3. Model Strategy & User Configuration

### 3.1 Default Model
By default, **Gemma 4** handles all AI tasks — both real-time chat and background plan generation. This simplifies the architecture and reduces API surface area.

### 3.2 User-Configurable Model Selection
Users can override the model in **Settings → AI Configuration**:

| Setting | Options | Default |
|---------|---------|---------|
| **Chat model** | Gemma 4 / Gemini 2.5 Flash / Gemini 2.5 Pro | Gemma 4 |
| **Background model** | Gemma 4 / Gemini 2.5 Flash / Gemini 2.5 Pro | Gemma 4 |
| **Embedding model** | text-embedding-004 | text-embedding-004 (fixed) |

```typescript
// lib/model-config.ts
interface ModelConfig {
  chat_model: 'gemma-4-31b-it' | 'gemini-2.5-flash' | 'gemini-2.5-pro'
  background_model: 'gemma-4-31b-it' | 'gemini-2.5-flash' | 'gemini-2.5-pro'
}

async function getUserModelConfig(userId: string): Promise<ModelConfig> {
  const profile = await db.user_profiles.findOne({ where: { id: userId } })
  return {
    chat_model: profile.ai_chat_model ?? 'gemma-4-31b-it',
    background_model: profile.ai_background_model ?? 'gemma-4-31b-it'
  }
}
```

### 3.3 Model Configuration Per Task
Even though the model is user-selected, temperature and sampling parameters are task-fixed:

| Task Type | Temperature | topP | maxOutputTokens |
|-----------|-------------|------|-----------------|
| Chat (conversational) | 0.7 | 0.95 | 2048 |
| Plan generation (fitness/skills) | 0.4 | 0.90 | 8192 |
| Test generation | 0.3 | 0.85 | 4096 |
| Test evaluation | 0.2 | 0.80 | 1024 |
| Weekly summary | 0.6 | 0.90 | 2048 |
| Memory extraction | 0.1 | 0.80 | 512 |

Lower temperature for structured outputs (plans, tests, evaluation) ensures consistent JSON. Higher temperature for chat ensures natural, varied responses.

---

## 4. Memory Engine — RAG + Vector Store

### 4.1 Three-Layer Memory Architecture

The v3 memory system has three distinct layers that work together:

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Conversation Window                        │
│  Last 20 messages injected directly into context     │
│  Fast, no retrieval needed, handles immediate flow   │
├─────────────────────────────────────────────────────┤
│  Layer 2: Key-Value Fact Store (ai_memory table)    │
│  Structured facts: weight, goal, injuries, etc.     │
│  Always injected as a "User Profile Snapshot"       │
│  Updated via memory extraction after every message  │
├─────────────────────────────────────────────────────┤
│  Layer 3: Vector Store (ai_memory_vectors table)    │
│  Semantic embeddings of conversation chunks         │
│  Retrieved via RAG when user references past events │
│  "that time I struggled", "what I told you before"  │
└─────────────────────────────────────────────────────┘
```

### 4.2 Key-Value Fact Store (Layer 2)
Unchanged from v2.5 but expanded with new categories:

| Category | Keys |
|----------|------|
| **Fitness** | `fitness_goal`, `current_weight`, `height`, `age`, `injuries`, `preferred_gym_time`, `equipment`, `diet_restrictions`, `bmr`, `tdee` |
| **Skills** | `active_learning_focus`, `learning_style`, `skill_roadmaps_active`, `coding_language`, `experience_level` |
| **Gamification** | `current_rank`, `current_level`, `total_xp`, `active_streak`, `hp_current` |
| **Personality** | `ai_persona_name`, `ai_persona_style`, `ai_custom_persona`, `preferred_language` |
| **Lifestyle** | `sleep_schedule`, `work_hours`, `dietary_restrictions`, `budget_bdt`, `timezone` |
| **Goals** | `primary_goal`, `target_date`, `weekly_summary_day`, `weekly_summary_time` |

### 4.3 Vector Store — RAG Implementation (Layer 3)

#### How Conversation Chunks Are Stored
Every AI conversation message is chunked and embedded after the conversation:

```typescript
// lib/memory/vectorStore.ts

async function embedAndStoreMessage(
  userId: string,
  conversationId: string,
  messageId: string,
  content: string,
  role: 'user' | 'assistant'
) {
  // 1. Generate embedding
  const embedding = await googleAI.embedContent({
    model: 'text-embedding-004',
    content: content,
    taskType: 'RETRIEVAL_DOCUMENT'
  })

  // 2. Store in pgvector table
  await db.ai_memory_vectors.create({
    user_id: userId,
    conversation_id: conversationId,
    message_id: messageId,
    role: role,
    content_chunk: content,
    embedding: embedding.values,   // vector(768)
    created_at: new Date()
  })
}
```

#### How Retrieval Works
When the AI detects a backward-reference in the user's message, it runs a vector search:

```typescript
async function retrieveRelevantMemories(
  userId: string,
  currentMessage: string,
  topK: number = 5
): Promise<string[]> {

  // 1. Embed the current query
  const queryEmbedding = await googleAI.embedContent({
    model: 'text-embedding-004',
    content: currentMessage,
    taskType: 'RETRIEVAL_QUERY'
  })

  // 2. Cosine similarity search in pgvector
  const results = await db.$queryRaw`
    SELECT content_chunk, role, created_at,
           1 - (embedding <=> ${queryEmbedding.values}::vector) AS similarity
    FROM ai_memory_vectors
    WHERE user_id = ${userId}
      AND similarity > 0.75
    ORDER BY similarity DESC
    LIMIT ${topK}
  `

  return results.map(r =>
    `[${r.role} — ${formatDate(r.created_at)}]: ${r.content_chunk}`
  )
}
```

#### Retrieval Trigger Detection
The AI does not run vector search on every message — only when retrieval signals are detected:

```typescript
const RETRIEVAL_SIGNALS = [
  'you told me', 'i told you', 'remember when', 'last time',
  'before', 'previously', 'earlier', 'we discussed', 'you said',
  'what did i say about', 'what was my', 'recall'
]

function needsRetrieval(message: string): boolean {
  return RETRIEVAL_SIGNALS.some(signal =>
    message.toLowerCase().includes(signal)
  )
}
```

This keeps retrieval costs low — most messages don't need it.

### 4.4 Memory Extraction Pipeline
After every AI response, a lightweight extraction pass runs to update the key-value fact store:

```typescript
// Memory extraction prompt (run on every exchange)
const EXTRACTION_PROMPT = `
Extract any new user facts from this conversation exchange.
Return ONLY a JSON array of {key, value, category} objects.
If no new facts, return [].
Do not repeat facts already in the user profile below.

User Profile (existing): ${existingFacts}
User message: ${userMessage}
AI response: ${aiResponse}
`
```

---

## 5. Context Construction Pipeline

This is the full pipeline that runs before every AI generation call:

```typescript
async function buildContext(userId: string, message: string, conversationId: string) {

  const [
    userProfile,
    memoryFacts,
    conversationHistory,
    liveStateSnapshot
  ] = await Promise.all([
    getUserProfile(userId),
    getMemoryFacts(userId),                    // Layer 2: key-value facts
    getRecentMessages(conversationId, 20),      // Layer 1: last 20 messages
    getLiveStateSnapshot(userId)               // Live app state
  ])

  // Layer 3: RAG retrieval (only if needed)
  let retrievedMemories: string[] = []
  if (needsRetrieval(message)) {
    retrievedMemories = await retrieveRelevantMemories(userId, message, 5)
  }

  return {
    systemPrompt: buildSystemPrompt(userProfile, memoryFacts),
    liveState: liveStateSnapshot,
    retrievedMemories,
    conversationHistory,
    userMessage: message
  }
}
```

### 5.1 Live State Snapshot
Injected into every context as a structured block:

```typescript
interface LiveStateSnapshot {
  // Gamification
  level: number
  rank: string
  xp_current: number
  xp_to_next_level: number
  hp_current: number
  hp_max: number
  hp_state: 'healthy' | 'weakened' | 'critical' | 'collapse'
  active_streak: number
  aicoin_balance: number

  // Today's tasks
  dailies_completed_today: number
  dailies_total_today: number
  habits_completed_today: number
  habits_total_today: number
  todos_overdue: number

  // Active plans
  active_fitness_plan: string | null
  active_skill_roadmaps: string[]   // skill names

  // Recent activity (last 7 days)
  workouts_this_week: number
  skill_hours_this_week: number
  xp_earned_this_week: number
}
```

This snapshot gives the AI full situational awareness in every response without querying each module separately.

---

## 6. Conversation Scope & Mode Detection

### 6.1 One Global Chat
There is a single AI chat interface. It handles all modules — fitness, skills, time management, style, gamification, and general self-improvement coaching. The AI detects intent from each message and responds in the appropriate mode.

### 6.2 Intent Classification
On every incoming message, the AI's system prompt instructs it to internally classify the intent before responding:

| Intent | Trigger Examples | AI Mode |
|--------|-----------------|---------|
| `fitness_plan_creation` | "make me a workout plan", "I want to build muscle" | Starts fitness interview flow |
| `fitness_query` | "how was my workout this week", "adjust my diet" | Reads fitness module data |
| `skill_plan_creation` | "I want to learn Python", "teach me guitar" | Starts skills interview flow |
| `skill_query` | "how am I doing with Python", "what's next in my roadmap" | Reads skills module data |
| `task_creation` | "add a task", "remind me to", "I need to do" | Creates Daily/Habit/To-Do with confirmation |
| `schedule_request` | "plan my day", "auto-schedule my tasks" | Reads calendar + Dailies, generates schedule |
| `progress_review` | "how am I doing", "show my stats", "analyse my week" | Reads live state + RAG for context |
| `gamification_query` | "what's my rank", "how much XP do I need", "dungeon info" | Reads gamification state |
| `coaching` | "I'm feeling unmotivated", "I'm struggling with habits" | Pure coaching response |
| `off_topic` | "who won the World Cup", "write me a poem" | Redirect to self-improvement |

### 6.3 Off-Topic Handling
The AI is strictly scoped to self-improvement. When it detects an off-topic query:

> *"I'm built specifically to help you level up your life — fitness, skills, habits, and goals. I can't help with that, but I'm ready when you want to work on something that matters to your growth."*

The AI never apologises excessively or lectures the user. One clean redirect, then waits for the next message.

### 6.4 Fitness & Skills Interview — Conversational Mode
Rather than a formal locked interview state, the AI handles fitness and skills plan creation **conversationally**. It asks questions one at a time naturally, remembers answers within the conversation window, and proceeds to generation when enough data is collected.

If the user goes off-topic mid-interview, the AI gently redirects:
> *"Let's finish building your plan first — I just need 2 more questions. You can ask me anything else right after."*

It does not refuse to respond — it nudges, then continues.

---

## 7. Autonomous Action System

### 7.1 The XML Protocol
The AI embeds structured commands in its responses using XML action tags. These are parsed, executed, and stripped before the response reaches the user.

```xml
<action type="[ACTION_NAME]">
{
  "param": "value"
}
</action>
```

### 7.2 Full Action Catalogue v3

#### A. Create Daily (`create_daily`)
```json
{
  "title": "String (required)",
  "description": "String (optional)",
  "priority": "low | medium | high | critical",
  "category": "general | fitness | skills | style | system",
  "scheduled_time": "HH:mm (optional)",
  "repeat_type": "daily | weekly",
  "repeat_days": ["mon", "tue", ...],
  "expires_on": "YYYY-MM-DD (optional)",
  "requires_confirmation": true
}
```

#### B. Create Habit (`create_habit`)
```json
{
  "title": "String (required)",
  "description": "String (optional)",
  "category": "general | fitness | skills | style | system",
  "reset_type": "daily | weekly | monthly",
  "is_indefinite": true,
  "end_date": "YYYY-MM-DD (optional)",
  "requires_confirmation": true
}
```

#### C. Create To-Do (`create_todo`)
```json
{
  "title": "String (required)",
  "description": "String (optional)",
  "priority": "low | medium | high | critical",
  "category": "general | fitness | skills | style | system",
  "due_date": "YYYY-MM-DD (optional)",
  "scheduled_time": "HH:mm (optional)",
  "requires_confirmation": true
}
```

#### D. Start Fitness Interview (`fitness_interview_start`)
```json
{
  "message": "Trigger acknowledgement string"
}
```

#### E. Generate Fitness Plan (`fitness_plan_generate`)
```json
{
  "goal": "build_muscle | lose_fat | endurance | strength | overall",
  "plan_type": "ongoing | fixed | full | diet_only",
  "duration_days": "Number (for fixed plans)",
  "days_per_week": "Number",
  "rest_days": ["mon", "tue", ...],
  "experience_level": "beginner | intermediate | advanced",
  "equipment": "full_gym | home_gym | bodyweight | minimal",
  "preferred_time": "HH:mm",
  "session_duration_minutes": "Number",
  "health_conditions": "String",
  "includes_diet": "Boolean",
  "budget_bdt": "Number (for diet plan)",
  "food_preference": "vegetarian | non_vegetarian | vegan | no_restriction",
  "requires_confirmation": true
}
```

#### F. Generate Skill Roadmap (`skill_roadmap_generate`)
```json
{
  "skill_name": "String",
  "skill_category": "coding | language | music | creative | other",
  "goal": "String",
  "plan_type": "fixed | open_ended | goal_based",
  "duration_days": "Number (for fixed plans)",
  "experience_level": "beginner | intermediate | advanced",
  "daily_study_minutes": "Number",
  "study_days": ["mon", "wed", ...],
  "preferred_time": "HH:mm",
  "includes_tests": "Boolean",
  "learning_style": "videos | reading | projects | mixed",
  "target_date": "YYYY-MM-DD (optional)",
  "requires_confirmation": true
}
```

#### G. Auto-Schedule Day (`schedule_day`)
```json
{
  "date": "YYYY-MM-DD",
  "include_unscheduled_dailies": true,
  "include_overdue_todos": true,
  "respect_dnd_hours": true
}
```

#### H. Update Memory (`update_memory`)
```json
{
  "key": "String",
  "value": "String",
  "category": "fitness | skills | gamification | personality | lifestyle | goals",
  "confidence": "Float (0.0–1.0)"
}
```

#### I. Generate Weekly Summary (`weekly_summary_generate`)
```json
{
  "period_start": "YYYY-MM-DD",
  "period_end": "YYYY-MM-DD"
}
```

#### J. Evaluate Test Answer (`evaluate_test_answer`)
```json
{
  "test_id": "UUID",
  "attempt_id": "UUID",
  "question_id": "String",
  "question_type": "written | code_challenge",
  "question": "String",
  "evaluation_criteria": "String",
  "student_answer": "String",
  "expected_output": "String (for code only)",
  "max_points": "Number"
}
```

#### K. Suggest Guild Action (`suggest_guild_action`)
```json
{
  "action_type": "send_hp | post_order | activate_buff | challenge_member",
  "suggestion_text": "String (shown to user as a suggestion card)",
  "target_member": "String (optional)",
  "parameters": {}
}
```

> **Guild note:** The AI never directly executes guild actions. It emits a `suggest_guild_action` which renders as an interactive card. The user taps to confirm, which triggers the actual guild API call from the frontend.

### 7.3 Confirmation Flow for Task Creation
All task-creation actions have `requires_confirmation: true`. When parsed, they render a **confirmation widget** in chat instead of immediately creating:

```
╔══════════════════════════════════════╗
║  CREATE DAILY                        ║
║  "Morning Run — 7:00 AM"             ║
║  Priority: High  Category: Fitness   ║
║  Repeats: Mon, Wed, Fri              ║
║                                      ║
║  [ CONFIRM ]        [ CANCEL ]       ║
╚══════════════════════════════════════╝
```

Only on user tap of **CONFIRM** does the backend create the task. Cancel dismisses with no action.

### 7.4 Parser Pipeline (`lib/ai-actions.ts`)
1. **Regex capture** — isolates all `<action>` blocks
2. **JSON validation** — validates against Zod schema per action type
3. **Confirmation check** — if `requires_confirmation: true`, render widget; do not execute
4. **Command routing** — task actions → TaskController; fitness → FitnessWorkerQueue; skills → SkillsWorkerQueue; memory → MemoryStore; test → TestEvaluator
5. **Sanitisation** — strips all XML tags from the text shown to the user

---

## 8. AI Persona System

### 8.1 Six Standard Personas + Custom

| Persona | Style Description | Tone |
|---------|------------------|------|
| **Friendly** | Warm, encouraging, celebrates small wins | "You've got this! 🎉" |
| **Strict** | Blunt, no excuses, drill sergeant energy | "No excuses. You missed it. Fix it." |
| **Motivational** | High-energy, inspirational, big-picture focus | "Every rep is building the person you're becoming." |
| **Neutral** | Analytical, data-driven, structured lists | "Completion rate: 68%. Recommend: reduce daily target." |
| **Sensei** *(new)* | Wise, calm, uses metaphor and philosophy, mentor energy | "The seed does not rush to become a tree. Patience is the skill." |
| **Rival** *(new)* | Competitive, challenges the user, trash-talk energy done respectfully | "That's it? I expected more from someone at your rank. Prove me wrong tomorrow." |
| **Custom** | User writes a free-text description | AI follows the described style |

### 8.2 Custom Persona
When the user selects **Custom**, they see a text input:
> *"Describe how you want your AI to speak to you. Be as specific as you like."*

Example inputs:
- *"Talk to me like an anime mentor — dramatic, intense, believes in me unconditionally"*
- *"Be like a tough older brother — honest, a bit harsh, but always wants the best for me"*
- *"Be calm, scientific, reference research when possible, no motivational fluff"*

The custom description is stored in `ai_memory` as `ai_custom_persona` and injected directly into the system prompt.

### 8.3 Persona Injection in System Prompt
```typescript
function buildPersonaBlock(profile: UserProfile): string {
  if (profile.ai_persona_style === 'custom' && profile.ai_custom_persona) {
    return `PERSONA INSTRUCTION: ${profile.ai_custom_persona}`
  }

  const personaMap = {
    friendly: `Be warm, encouraging, and empathetic. Celebrate small wins. Use inclusive language. Act like a supportive best friend who genuinely wants the user to succeed.`,
    strict: `Be blunt. If the user fails, call out the lack of discipline directly. No platitudes. Short punchy sentences. Act like a drill sergeant who respects results only.`,
    motivational: `Be high-energy and inspirational. Focus on the 'Why'. Use powerful metaphors. Act like a world-class performance coach giving a pre-game speech.`,
    neutral: `Be analytical and objective. Provide data-driven advice. Use structured lists and professional terminology. No emotional language.`,
    sensei: `Be wise, calm, and philosophical. Use metaphors from nature, martial arts, or classic stories. Speak in measured, thoughtful sentences. Act like an ancient mentor who has seen many students rise and fall.`,
    rival: `Be competitive and challenging. Push the user to prove themselves. Use light trash-talk that is respectful but demanding. Act like a rival who secretly wants them to win but will never admit it.`
  }

  return `PERSONA INSTRUCTION: ${personaMap[profile.ai_persona_style]}`
}
```

---

## 9. Proactive AI — Alert System

### 9.1 Philosophy
The AI sends proactive messages **only for critical system alerts**. It does not send morning check-ins, evening reviews, or general encouragement unprompted — these create notification fatigue. When the AI does send a proactive message, it must feel urgent and meaningful.

### 9.2 Critical Alert Triggers

| Trigger | Condition | Message Type |
|---------|-----------|-------------|
| **Streak Danger** | Active streak ≥ 5 days + no activity logged by 8:00 PM | Push notification → opens chat with AI alert |
| **HP Collapse Warning** | HP drops below 20 | Push notification → opens chat with AI alert |
| **HP Zero — Level Regression** | HP hits 0, level regression triggered | Push notification → opens chat with AI recovery quest assignment |
| **Plan Auto-Paused** | 3+ consecutive missed days in fixed plan | Push notification → opens chat with AI message |
| **Guild Raid Expiring** | Active S-rank raid expires in < 6 hours | Push notification → opens chat with AI urgency message |

### 9.3 Alert Message Style
Proactive alerts use the user's active persona but always lead with the System framing:

**Streak Danger (Neutral persona):**
> *"System Alert: Streak integrity at risk. 23-day streak — no activity logged today. 4 hours remain before reset."*

**HP Collapse (Strict persona):**
> *"Vessel critical. HP at 15. One more missed habit and you're in level regression. You know what to do."*

**HP Zero — Level Regression (Sensei persona):**
> *"The tree has bent to its limit. Level regression has been triggered. But a tree that survives the storm grows deeper roots. Your Recovery Protocol awaits."*

### 9.4 Proactive Message Implementation
Proactive messages are generated by a scheduled BullMQ job that runs at the trigger times:

```typescript
// worker jobs/proactiveAlerts.ts
async function checkAndSendAlerts(userId: string) {
  const state = await getLiveStateSnapshot(userId)
  const alerts: ProactiveAlert[] = []

  // Streak danger — runs at 8:00 PM if no activity
  if (state.active_streak >= 5 && state.dailies_completed_today === 0) {
    alerts.push({ type: 'streak_danger', state })
  }

  // HP collapse warning
  if (state.hp_current < 20 && state.hp_current > 0) {
    alerts.push({ type: 'hp_warning', state })
  }

  for (const alert of alerts) {
    const message = await generateAlertMessage(userId, alert)
    await saveProactiveMessage(userId, message)
    await sendPushNotification(userId, {
      title: 'System Alert',
      body: message.preview,
      url: '/chat'
    })
  }
}
```

---

## 10. Weekly Summary System

### 10.1 User-Scheduled Delivery
During onboarding (or in Settings → AI Configuration), the user sets:
- **Day:** Which day of the week to receive the summary
- **Time:** What time to deliver it

The AI asks this when it generates the first weekly summary:
> *"Your first weekly summary is ready. When would you like to receive these every week? I'll send it at your chosen time automatically."*

The user's choice is stored in `ai_memory` as `weekly_summary_day` and `weekly_summary_time`.

### 10.2 What a Weekly Summary Contains

The AI generates a structured narrative summary covering:

```typescript
interface WeeklySummary {
  period: { start: string, end: string }

  highlights: string[]              // top 3 wins of the week

  stats: {
    xp_earned: number
    level_change: number            // +1, 0, or -1
    streak_current: number
    streak_change: number
    hp_average: number
    dailies_completion_rate: number // %
    habits_completion_rate: number  // %
  }

  fitness: {
    sessions_completed: number
    sessions_target: number
    total_volume: string            // e.g. "12,450 kg lifted"
    nutrition_compliance_rate: number
  } | null

  skills: {
    skill_name: string
    hours_logged: number
    milestones_completed: number
    tests_passed: number
  }[]

  gamification: {
    dungeons_cleared: number
    quests_completed: number
    badges_earned: string[]
    guild_contributions: number
  }

  ai_observation: string            // 2-3 sentence personalised coaching note
  focus_recommendation: string      // what AI recommends focusing on next week
}
```

### 10.3 Summary Delivery
1. BullMQ job fires at user's configured time on configured day
2. AI generates summary using `weekly_summary_generate` action internally
3. Summary saved as a special chat message with `metadata.type = 'weekly_summary'`
4. Push notification sent: *"Your Week [N] System Report is ready."*
5. User opens chat to see the full summary

---

## 11. Test Evaluation Pipeline

### 11.1 Integration Into Main Chat Pipeline
Test evaluation is not a separate standalone endpoint — it runs through the same `/api/ai/chat` pipeline, triggered by the `evaluate_test_answer` action.

When the skills module submits a written or code answer for evaluation:

```typescript
// The test module calls the AI chat endpoint with a structured evaluation request
const evaluationMessage = `
SYSTEM TASK: Evaluate this student answer.
[evaluate_test_answer action payload included]
Return evaluation JSON only. No conversational response.
`
```

### 11.2 Evaluation Response Schema

```typescript
interface TestEvaluationResult {
  question_id: string
  points_awarded: number          // 0 to max_points
  max_points: number
  correct: boolean
  feedback: string                // 1-2 sentences, encouraging + specific
  sample_answer?: string          // for code challenges — shown after evaluation
}
```

### 11.3 Code Challenge Evaluation Logic
The AI evaluates code challenges on three criteria:
1. **Logic correctness** — does the approach solve the problem?
2. **Output correctness** — does it produce the expected output?
3. **Code quality** — is it reasonably clean? (partial credit for working but messy code)

Partial credit rules:
- Correct logic + syntax error → 60% of points
- Correct output for test case + inefficient approach → 80% of points
- Wrong output but correct direction → 30% of points

### 11.4 Written Answer Evaluation Logic
The AI compares the student's answer against the `evaluation_criteria` field:
- Full marks if all criteria points are addressed
- Partial marks if some criteria are addressed
- Feedback always mentions both what was done well and what was missing

### 11.5 Coin Cost for Evaluation
Test evaluations are **free** — they do not deduct AiCoins. They are part of the skills roadmap the user already paid for. Ad-hoc test requests from chat cost 2 AiCoins (as defined in the skills doc).

---

## 12. AiCoin Economy

### 12.1 Complete Cost Table

| AI Feature | AiCoin Cost | Notes |
|------------|-------------|-------|
| Chat message | 1 | Per message sent |
| Auto-schedule day | 5 | Reads calendar + all tasks |
| Skill roadmap — 7-day | 5 | |
| Skill roadmap — 14-day | 8 | |
| Skill roadmap — 30-day | 10 | |
| Skill roadmap — full open-ended | 15 | |
| +Tests added to skill roadmap | +5 | Add-on cost |
| Fitness protocol — any type | 25 | Higher compute |
| Ad-hoc test from chat | 2 | On-demand quiz |
| Weekly summary (auto) | 0 | Free — scheduled |
| Test evaluation | 0 | Included in roadmap |
| Memory retrieval (RAG) | 0 | Free — internal |
| Guild action suggestion | 0 | Free — suggestion only |

### 12.2 Earn Table (Complete)

| Action | AiCoins Earned |
|--------|---------------|
| Daily login | +5 |
| Complete low-priority task | +1 |
| Complete high-priority task | +3 |
| Complete daily quest | +10–20 |
| Complete weekly quest | +25–50 |
| 7-day streak milestone | +20 |
| 30-day streak milestone | +100 |
| Guild raid win | +30 (shared) |
| Weekly Boss clear | +50 |
| System Cache drop | +10–200 (random) |
| Weekly summary reviewed | +5 |
| Invite friend who registers | +30 |

### 12.3 AiCoin Pre-flight Check
Before every AI operation, the backend checks the user's balance:

```typescript
async function checkCoinBalance(userId: string, requiredCoins: number) {
  const balance = await getUserCoinBalance(userId)
  if (balance < requiredCoins) {
    return {
      allowed: false,
      message: `Insufficient AiCoins. Required: ${requiredCoins}. Balance: ${balance}.
                Earn more by completing tasks, or purchase a coin pack.`
    }
  }
  return { allowed: true }
}
```

---

## 13. Rate Limiting & Queue Strategy

### 13.1 Current Scale
SelfUp is currently in early access with a very small user base. The rate limiting strategy is minimal but is designed to scale:

- **Free tier API limits** from Google AI Studio are the primary constraint
- **No per-user rate limiting** is enforced in V1 (not needed at current scale)
- **Background jobs** (plan generation) are queued via BullMQ with concurrency of 5

### 13.2 API Limit Handling
When the Google AI Studio rate limit is hit:

```typescript
async function callWithRetry(
  modelFn: () => Promise<Response>,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await modelFn()
    } catch (error) {
      if (error.status === 429) {
        // Rate limit hit
        const waitMs = Math.pow(2, attempt) * 1000  // exponential backoff
        await sleep(waitMs)
        if (attempt === maxRetries) {
          // Final attempt failed — notify user
          throw new RateLimitError(
            'System is under heavy load. Your request has been queued and will process shortly.'
          )
        }
      } else {
        throw error  // non-rate-limit errors throw immediately
      }
    }
  }
}
```

When a `RateLimitError` is thrown, the chat frontend shows:
> *"System processing queue active. Your message will be delivered shortly."*

The message is queued in BullMQ and retried when capacity is available.

### 13.3 Future Scaling Plan (V2+)
- Per-user hourly request limits (Free: 30/hour, Pro: 200/hour)
- Dedicated model instances for Pro users
- Automatic fallback to Tier 2 model on primary limit

---

## 14. Background Worker Architecture

### 14.1 Job Types

| Job Type | Trigger | Model Used | Est. Duration |
|----------|---------|-----------|--------------|
| `fitness_plan_generate` | User confirms fitness plan preview | User-configured (default Gemma 4) | 15–30s |
| `skill_roadmap_generate` | User confirms skill roadmap preview | User-configured (default Gemma 4) | 10–25s |
| `test_generate` | Milestone completed (if tests enabled) | User-configured | 5–15s |
| `weekly_summary_generate` | Scheduled job at user-set time | User-configured | 5–10s |
| `proactive_alert_check` | Cron job at 8:00 PM daily per user | User-configured | 1–3s |
| `embed_message` | After every chat exchange | text-embedding-004 | 1–2s |
| `memory_extraction` | After every chat exchange | Gemma 4 (fixed) | 1–3s |
| `plan_adaptation_check` | Weekly cron per active plan | Gemma 4 (fixed) | 3–8s |

### 14.2 Job Lifecycle

```
Created → Pending → Active → Completed / Failed
                                    ↓
                              Failed: auto-retry
                              up to 3 times with
                              exponential backoff
                              (1s → 2s → 4s)
```

### 14.3 Worker Configuration

```typescript
// lib/worker.ts
const worker = new Worker('ai_task_queue', processJob, {
  connection: redis,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000  // max 10 jobs per second
  }
})

async function processJob(job: Job) {
  const { type, userId, payload } = job.data
  const modelConfig = await getUserModelConfig(userId)

  switch (type) {
    case 'fitness_plan_generate':
      return await fitnessPlanGenerator.generate(payload, modelConfig)
    case 'skill_roadmap_generate':
      return await skillRoadmapGenerator.generate(payload, modelConfig)
    case 'test_generate':
      return await testGenerator.generate(payload, modelConfig)
    case 'weekly_summary_generate':
      return await weeklySummaryGenerator.generate(payload, modelConfig)
    case 'embed_message':
      return await vectorStore.embedAndStore(payload)
    case 'memory_extraction':
      return await memoryExtractor.extract(payload)
    case 'plan_adaptation_check':
      return await adaptationEngine.check(payload, modelConfig)
  }
}
```

---

## 15. API Reference

### Core Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Main chat endpoint — all conversations |
| `GET` | `/api/ai/conversations` | Get all conversations for user |
| `GET` | `/api/ai/conversations/:id/messages` | Get messages for a conversation |
| `DELETE` | `/api/ai/conversations/:id` | Archive a conversation |

### Memory
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/memory` | Get all key-value memory facts |
| `PATCH` | `/api/ai/memory/:key` | Manually update a memory fact |
| `DELETE` | `/api/ai/memory/:key` | Delete a memory fact |

### Background Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/queue/:jobId/status` | Poll background job status |
| `POST` | `/api/ai/queue/cancel/:jobId` | Cancel a pending job |

### Weekly Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/summary/latest` | Get most recent weekly summary |
| `GET` | `/api/ai/summary/history` | Get all past summaries |

### Test Evaluation
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/evaluate` | Submit answer for AI evaluation (routes through chat pipeline) |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/settings` | Get user's AI configuration |
| `PATCH` | `/api/ai/settings` | Update model selection, persona, summary schedule |

---

## 16. Database Schema

```sql
-- AI CONVERSATIONS
CREATE TABLE ai_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title         TEXT,                          -- auto-generated from first message
  is_archived   BOOLEAN DEFAULT false,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- AI MESSAGES
CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  -- metadata contains: { actions[], token_count, latency_ms, type, retrieved_memories[] }
  coin_cost       INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- AI MEMORY — KEY-VALUE FACTS (Layer 2)
CREATE TABLE ai_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  memory_key  TEXT NOT NULL,
  memory_val  TEXT NOT NULL,
  category    TEXT CHECK (category IN ('fitness','skills','gamification','personality','lifestyle','goals')),
  confidence  FLOAT DEFAULT 1.0 CHECK (confidence BETWEEN 0.0 AND 1.0),
  source      TEXT CHECK (source IN ('chat','onboarding','manual','system')),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, memory_key)
);

-- AI MEMORY VECTORS — RAG STORE (Layer 3)
CREATE TABLE ai_memory_vectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
  role            TEXT CHECK (role IN ('user', 'assistant')),
  content_chunk   TEXT NOT NULL,
  embedding       vector(768),                 -- pgvector, text-embedding-004 output
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Vector similarity index
CREATE INDEX ON ai_memory_vectors
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- AI TASK QUEUE (synced from BullMQ/Redis for persistence)
CREATE TABLE ai_task_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  request_type  TEXT NOT NULL,
  payload       JSONB NOT NULL,
  status        TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','active','completed','failed','cancelled')),
  result        JSONB,
  error         TEXT,
  attempts      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- WEEKLY SUMMARIES
CREATE TABLE ai_weekly_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  content       JSONB NOT NULL,              -- full WeeklySummary object
  message_id    UUID REFERENCES ai_messages(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- USER AI SETTINGS (added columns to user_profiles)
-- ai_persona_style    TEXT DEFAULT 'friendly'
-- ai_persona_name     TEXT DEFAULT 'System'
-- ai_custom_persona   TEXT
-- ai_chat_model       TEXT DEFAULT 'gemma-4-31b-it'
-- ai_background_model TEXT DEFAULT 'gemma-4-31b-it'
-- weekly_summary_day  TEXT   -- 'mon'|'tue'|...
-- weekly_summary_time TIME
```

---

## 17. System Prompt Architecture

The system prompt is assembled dynamically per request from modular blocks:

```typescript
function buildSystemPrompt(profile: UserProfile, memoryFacts: MemoryFact[]): string {
  return [
    CORE_IDENTITY_BLOCK,
    buildPersonaBlock(profile),
    SCOPE_RESTRICTION_BLOCK,
    buildLiveStateBlock(profile),
    buildMemoryFactsBlock(memoryFacts),
    ACTION_SCHEMA_BLOCK,
    RESPONSE_FORMAT_BLOCK
  ].join('\n\n---\n\n')
}
```

### Block Definitions

**CORE_IDENTITY_BLOCK**
```
You are the SelfUp System AI — an autonomous life-coaching intelligence.
You are known as "the System" — a powerful, unseen force that monitors the user's 
progress and guides their ascension. You speak with authority and purpose.
You manage four pillars of human development: Fitness, Skills, Time, and Style.
The user is your Player. Their growth is your mission.
```

**SCOPE_RESTRICTION_BLOCK**
```
STRICT SCOPE: You only respond to topics related to self-improvement, fitness, skills,
time management, style, personal development, and the SelfUp gamification system.
If asked anything outside this scope, respond with exactly:
"I'm built to help you level up — not for that. What do you want to work on?"
Do not elaborate. Do not apologise. One line, then stop.
```

**ACTION_SCHEMA_BLOCK**
```
AUTONOMOUS ACTIONS: You can issue system commands by embedding XML action tags in your
response. These are invisible to the user and execute automatically.
Available actions: [full action catalogue injected here]
Rules:
- Always set requires_confirmation: true for task creation and plan generation
- Never emit guild execute actions — suggestions only
- Never issue more than 3 actions in a single response
- Strip all XML from your visible response text
```

---

## 18. Developer Guide — Adding New Actions

### Step 1 — Define the Action Schema in `lib/validations/ai-actions.ts`
```typescript
export const newActionSchema = z.object({
  param_one: z.string(),
  param_two: z.enum(['option_a', 'option_b']),
  requires_confirmation: z.boolean().default(false)
})
```

### Step 2 — Add to System Prompt in `lib/gemma.ts`
```
#### new_action_name:
<action type="new_action_name">
{
  "param_one": "description of what goes here",
  "param_two": "option_a | option_b"
}
</action>
Use when: [describe the trigger condition]
```

### Step 3 — Add Parser Case in `lib/ai-actions.ts`
```typescript
case 'new_action_name': {
  const validated = newActionSchema.parse(payload)
  if (validated.requires_confirmation) {
    return { type: 'confirmation_pending', data: validated }
  }
  await myService.handleNewAction(userId, validated)
  break
}
```

### Step 4 — Create UI Widget in `components/chat/ActionWidget.tsx`
```typescript
case 'new_action_name':
  return <NewActionWidget data={action.data} onConfirm={handleConfirm} />
```

### Step 5 — Add Embed Message to Vector Store
If the new action generates content worth remembering (e.g., a plan summary), queue an `embed_message` job after execution to store it in the vector store for future RAG retrieval.

---

> *"The System does not sleep. It observes. It remembers. It adapts. It waits for you to act."*

---

**Document version:** 3.0  
**Last updated:** May 2026  
**Related documents:** `fitness_system_v2.md`, `skills_system_v2.md`, `task_system_architecture.md`, `gamification_redesign.md`
