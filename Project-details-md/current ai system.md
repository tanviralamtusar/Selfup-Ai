# SelfUp — The Pathfinder Engine: Ultimate Technical Reference (v2.5)

## 1. Executive Summary
The SelfUp AI system, known internally as the **"Pathfinder Engine,"** is a complex, multi-layered autonomous life-coaching platform. It is designed to transform the traditional "Chatbot" experience into a proactive, data-integrated agent that manages user progression across Fitness, Skills, Time, and Style.

This document serves as the absolute technical sovereign reference for the engine's internals. It covers the entirety of the system's logic, from model orchestration and autonomous action parsing to background worker tasking and gamified economics.

---

## 2. System Architecture Overview

### 2.1. The "Observer" Pattern
SelfUp's AI operates on an observer pattern. It doesn't just respond to prompts; it observes the entire application state:
- **State Perception:** The engine receives snapshots of user stats, active quests, recent task history, and stored memories.
- **Logical Reasoning:** Using the Gemma 4 model, it evaluates this state against the user's current intent.
- **Autonomous Output:** It generates natural language feedback while simultaneously issuing system-level commands through XML-wrapped actions.

### 2.2. Core Technology Stack
- **AI Core:** Google AI Studio (Primary: Gemma 4, Background: Gemini 2.5).
- **Runtime:** Node.js (Next.js 16 App Router).
- **State & Storage:** Supabase (PostgreSQL), Redis (Job Queue).
- **Task Management:** BullMQ (Reliable background job execution).
- **Frontend UI:** React 19, TailwindCSS, Framer Motion, Lucide-React.
- **Communication:** Streaming HTTP with fallback to polling for long-running tasks.

---

## 3. Core Engine: The LLM Orchestrator

### 3.1. Model Tiering Strategy
To optimize for both speed, intelligence, and cost-efficiency, the system employs a three-tier model strategy:

#### Tier 1: The Conversational Brain (`gemma-4-31b-it`)
- **Role:** Primary chat interface and real-time decision maker.
- **Reasoning:** High instruction-following accuracy for XML/JSON generation.
- **Configuration:**
  - `temperature: 0.7`: Balanced for creativity and reliability.
  - `topP: 0.95`: Ensures diverse but safe token selection.
  - `maxOutputTokens: 2048`: Prevents runaway generations.

#### Tier 2: The Logic Specialist (`gemma-4-26b-a4b-it`)
- **Role:** High-concurrency fallback and simple task parsing.
- **Reasoning:** Optimized for lower latency in high-traffic scenarios.

#### Tier 3: The Heavy Lifter (`gemini-2.5-flash`)
- **Role:** Deep-analysis background tasks (Fitness Protocols, Skill Roadmaps).
- **Reasoning:** Massive context window (1M+ tokens) allows it to synthesize user history with internal training data to create hyper-personalized plans.

### 3.2. SDK Implementation (`lib/gemma.ts`)
The integration uses the `@google/genai` library directly. Key implementation patterns include:
- **System Instructions:** Privileged context blocks that define the AI's persona, rules, and action schemas.
- **History Management:** Chat history is managed as a sliding window. We preserve the most recent 100 messages but prioritize the last 20 for immediate context injection.
- **Safety Guardrails:** Custom safety filters are applied to block harmful content while maintaining the "Strict" coaching persona.

---

## 4. The Memory Engine (Persistent Cognition)

### 4.1. Architecture of Memory
SelfUp uses a "Fact-Based Memory" system stored in Supabase (`ai_memory`). This allows the AI to "remember" a user's weight, goals, or preferences indefinitely without filling the token context window.

### 4.2. Memory Extraction Workflow
1.  **Incoming Message:** User says "I hit a 100kg deadlift today!"
2.  **Analysis:** The `lib/ai-memory.ts` service identifies this as a `fitness_stat`.
3.  **Deduplication:** The system checks if a `deadlift_max` key already exists.
4.  **Upsert:** The new value is saved, and a "Memory Updated" flag is returned to the chat system.

### 4.3. Critical Memory Key Categories
- **Fitness:** `fitness_goal`, `current_weight`, `injuries`, `preferred_gym_time`.
- **Skills:** `active_learning_focus`, `learning_style`, `skill_roadmaps_active`.
- **Personality:** `ai_persona_name`, `ai_persona_style` (Friendly, Strict, etc.).
- **Lifestyle:** `sleep_schedule`, `work_hours`, `dietary_restrictions`.

---

## 5. Autonomous Action System (The Command Layer)

### 5.1. The XML Protocol
The AI communicates with the system using a proprietary XML-based tagging system. This prevents "prompt injection" where a user might try to trick the AI into executing unauthorized commands.

#### Standard Action Envelope:
```xml
<action type="[ACTION_NAME]">
  {
    "param_1": "value",
    "param_2": "value"
  }
</action>
```

### 5.2. Action Catalogue & Schema Detail

#### A. Task Management (`create_task`)
Used for quick entries into the user's daily protocols or to-do list.
- **Payload Schema:**
  ```json
  {
    "title": "String (Required)",
    "description": "String (Optional)",
    "priority": "low | medium | high | critical",
    "due_date": "YYYY-MM-DD (Optional)",
    "estimated_minutes": "Number (Optional)"
  }
  ```

#### B. Skill Roadmapping (`skill_roadmap`)
Creates a structured learning curriculum with linked resources.
- **Payload Schema:**
  ```json
  {
    "skillName": "String",
    "category": "coding | music | language | fitness | style | business | other",
    "milestones": [
      { 
        "title": "String", 
        "description": "String", 
        "estimated_hours": "Number",
        "youtube_search_query": "String" 
      }
    ]
  }
  ```

#### C. Fitness Interview (`fitness_interview_start`)
Activates the specialized interview state.
- **Payload:** `{ "message": "Trigger string" }`

#### D. Fitness Generation (`fitness_plan_generate`)
The heavy-duty trigger for the v2 protocol worker.
- **Payload Schema:**
  ```json
  {
    "goal": "build_muscle | lose_fat | endurance | maintenance",
    "days": "Number (1-7)",
    "experience_level": "beginner | intermediate | advanced",
    "equipment_available": "full_gym | home_gym | bodyweight",
    "preferred_time": "HH:mm",
    "session_duration_minutes": "Number",
    "health_conditions": "String",
    "plan_type": "ongoing | fixed_duration",
    "rest_days": ["mon", "tue", "etc"]
  }
  ```

### 5.3. The Parser Pipeline (`lib/ai-actions.ts`)
1.  **Regex Capture:** Isolates all `<action>` blocks in the response.
2.  **JSON Validation:** Validates the payload against the corresponding Zod schema.
3.  **Command Routing:** 
    - `tasks` go to the `TaskController`.
    - `fitness` goes to the `FitnessWorkerQueue`.
    - `memory` updates the `MemoryStore`.
4.  **Sanitization:** Removes the tags so they are invisible to the end user.

---

## 6. Fitness v2.0: The Physical Vessel Engine

### 6.1. The Architecture of Progress
Fitness is not just a list of workouts; it's a dynamic system of adaptation.

#### Phase 1: The Assessment (The Interview)
The AI is instructed to act as an elite physiologist. It must gather:
- Primary Goal (Bulking, Cutting, Athleticism).
- Experience Level (To prevent injury).
- Equipment (To ensure feasibility).
- Time Constraints (To ensure consistency).

#### Phase 2: The Generation (Worker Job)
Once the data is submitted via the `fitness_plan_generate` action:
1.  **Job Enqueued:** BullMQ creates a persistent job in Redis.
2.  **Context Assembly:** The worker fetches the user's age, height, and weight from memory.
3.  **Protocol Design:** The background Gemini model designs a 4-week split.
4.  **Resource Fetching:** The worker calls the YouTube API to find form videos for every exercise.
5.  **Commitment:** The generated JSON is saved to `fitness_protocols`, `workout_sessions`, and `diet_plans`.

### 6.2. Nutritional Logic Flow
The worker calculates nutritional targets using the **Mifflin-St Jeor Equation**:
- **BMR Calculation:** 
  - *Male:* `10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5`
  - *Female:* `10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161`
- **TDEE Scaling:** Multiplied by an activity factor (1.2 for Sedentary to 1.9 for Extra Active).
- **Goal Offset:** Adjusts +/- calories based on the `fitness_goal`.
- **Macro Distribution:** 
  - *Strength Goal:* High Protein (2.2g/kg).
  - *Endurance Goal:* High Carb (6g/kg).

---

## 7. Interactive Action Widgets (UI Meta-Layer)

### 7.1. The Design Philosophy
AI "Magic" often feels disconnected. We solve this by making background actions visible through **Metadata Widgets**.

### 7.2. Implementation Specs
- **Database Entry:** Every message in `ai_messages` can have a `metadata` object.
- **State Flow:** `parseActions` -> `db.insert(metadata: { actions })` -> `frontend.render()`.

### 7.3. Widget Library
| Widget | Visual Style | Functionality |
| :--- | :--- | :--- |
| **Fitness Interview** | Blue / Info | Informs the user that the AI is in "assessment mode". |
| **Protocol Created** | Green / Success | Displays a "Review Plan" CTA linking to `/fitness`. |
| **Roadmap Created** | Purple / Discovery | Displays a "View Roadmap" CTA linking to `/skills`. |
| **Task Created** | Dark / Minimal | Shows a small confirmation of the new task title. |

---

## 8. Queueing & Resilience (The BullMQ Layer)

### 8.1. Infrastructure
To handle long-running generations (15-30 seconds), we cannot block the HTTP request. Redis provides a persistent buffer.
- **Service:** `lib/worker.ts`
- **Queue:** `ai_task_queue`
- **Concurrency:** `5` (Adjustable based on server load).

### 8.2. Job Lifecycle
1.  **Created:** User submits data.
2.  **Pending:** Waiting for an available worker thread.
3.  **Active:** Worker is calling the LLM/YouTube APIs.
4.  **Completed:** Result is saved; `job_id` status is updated.
5.  **Failed:** Auto-retry triggered (up to 3 times) with exponential backoff.

---

## 9. AI Persona Engineering & Tone Injection

### 9.1. The Persona Matrix
The system prompt is dynamically modified by the `user_profiles.ai_persona_style` column.

#### The "Strict" Logic:
> "Be blunt. If the user fails, call out the lack of discipline. Do not offer platitudes. Use short, punchy sentences. Act like a drill sergeant."

#### The "Friendly" Logic:
> "Be warm, encouraging, and empathetic. Celebrate small wins. Use inclusive language. Act like a supportive best friend."

#### The "Motivational" Logic:
> "Be high-energy and inspirational. Focus on the 'Why'. Use powerful metaphors. Act like a high-performance coach."

#### The "Neutral" Logic:
> "Be analytical and objective. Provide data-driven advice. Use structured lists and professional terminology."

---

## 10. AI Economy: The AiCoin Ledger

### 10.1. Tokenomics of Mastery
SelfUp uses a virtual economy to balance high API costs and provide a progression loop.

| Action | Cost | Rationale |
| :--- | :--- | :--- |
| **Chat Message** | 1 | Standard GPT-4o / Gemma token cost. |
| **Day Schedule** | 5 | Multi-factor calendar logic. |
| **Skill Roadmap** | 15 | YouTube API calls + curriculum design. |
| **Fitness Protocol** | 25 | High-compute worker job + complex math. |

### 10.2. Earning Mechanics (The Positive Feedback Loop)
- **Task Completion:** +1 to +5 coins.
- **Daily Streak:** +10 coins daily.
- **Weekly Mastery:** +50 coins.
- **Dungeon Clear:** +100 coins.

---

## 11. API Technical Reference (Full Specification)

### 11.1. `POST /api/ai/chat`
The main entry point for all conversational intelligence.
- **Input Payload:**
  ```json
  {
    "content": "Message string",
    "conversationId": "UUID",
    "modelName": "gemma-4-31b-it"
  }
  ```
- **Internal Pipeline:**
  1. **Authentication:** Verify user session and JWT.
  2. **Economy Check:** Verify user has enough AiCoins.
  3. **Context Construction:** Fetch conversation history + user profile + memory facts.
  4. **Generation:** Call Google AI Studio.
  5. **Post-Processing:**
     - `parseActions()`: Extract XML tags.
     - `executeActions()`: Trigger system updates.
     - `extractMemory()`: Update user facts.
     - `deductCoins()`: Process transaction.
  6. **Response:** Return clean text + metadata.

### 11.2. `GET /api/ai/queue/[jobId]/status`
Used for polling background generation status.

---

## 12. Scenario Deep-Dive: The Fitness Journey

### Step 1: Initial Intent
- **User:** "I want to start working out."
- **AI Backend:** Detects `fitness_goal` intent. 
- **AI Response:** "That's great! Let's build a plan. I need to ask you a few questions first. <action type='fitness_interview_start'>{}</action>"
- **UI:** Shows the "Fitness Interview Active" widget.

### Step 2: The Assessment
- **AI asks:** "What's your goal? How many days can you commit? Do you have a gym?"
- **User answers:** "Build muscle, 4 days, home gym."
- **AI Backend:** Extracts these into `ai_memory`.

### Step 3: Triggering the Worker
- **AI Response:** "Copy that. Designing your 'Home Muscle' protocol now... <action type='fitness_plan_generate'>{ 'goal': 'build_muscle', 'days': 4, ... }</action>"
- **Backend:** Creates job `job_123` in Redis.
- **UI:** Shows "Protocol Generation in Progress..."

### Step 4: Worker Execution
- **Worker:** Calls Gemini Flash.
- **Worker:** "Design a 4-day hypertrophy split using home gym equipment (dumbbells, bench)."
- **Worker:** Fetches YouTube videos for "Dumbbell Bench Press", "Goblet Squats", etc.
- **Worker:** Calculates 2500 kcal target.

### Step 5: Plan Activation
- **Worker:** Saves to `workout_plans`.
- **UI:** Shows green widget "Protocol Generated! Review Now."
- **User:** Clicks Review -> Sees full calendar and diet.

---

## 13. Developer Guide: Adding a New Action

To add a new autonomous action to the Pathfinder engine, follow these steps:

### 1. Update the System Prompt
Add the new schema to the `SYSTEM_PROMPT` constant in `lib/gemma.ts`.
```xml
#### New Action Name:
<action type="new_action_name">
{
  "param": "description"
}
</action>
```

### 2. Define the Zod Schema
Add the validation schema in `lib/validations/ai-actions.ts`.
```typescript
export const newActionSchema = z.object({
  param: z.string()
});
```

### 3. Update the Parser
Add a case for the new action in the `executeActions` function in `lib/ai-actions.ts`.
```typescript
case 'new_action_name':
  await myService.handle(payload);
  break;
```

### 4. Create the UI Widget
Add a new case to `components/chat/ActionWidget.tsx` to render the interactive card.

---

## 14. Database Schema Breakdown (AI Module)

### Table: `ai_conversations`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key)
- `title`: Text (Auto-generated from first message)
- `is_archived`: Boolean (Default: false)
- `metadata`: JSONB (Stores conversation-specific flags)

### Table: `ai_messages`
- `id`: UUID (Primary Key)
- `conversation_id`: UUID (Foreign Key)
- `role`: Text ('user' | 'assistant')
- `content`: Text (The raw response)
- `metadata`: JSONB (Stores `actions`, `token_count`, `latency_ms`)
- `coin_cost`: Integer (Amount deducted)

### Table: `ai_memory`
- `user_id`: UUID (Foreign Key)
- `memory_key`: Text (Indexable key)
- `memory_val`: Text (The stored value)
- `confidence`: Float (0.0 to 1.0)
- `source`: Text ('chat' | 'onboarding' | 'manual')
- `updated_at`: Timestamp

### Table: `ai_task_queue` (Simulated via Redis/Supabase)
- `id`: UUID
- `request_type`: Text ('fitness_plan', 'skill_roadmap', etc)
- `payload`: JSONB
- `status`: Text ('pending', 'active', 'completed', 'failed')
- `result`: JSONB (The final generated plan)

---

## 15. Maintenance & Monitoring

### 15.1. Performance Metrics
- **Average Latency:** Goal < 3000ms for chat, < 15s for background tasks.
- **Token Efficiency:** Monitored via the `metadata.token_count` column to optimize costs.
- **Accuracy Rate:** Regular audits of `ai_memory` to ensure facts are being extracted correctly.

### 15.2. Logging Standards
We use `winston` for structured logging:
- `[AI Chat Error]`: Contextual error with user ID and conversation ID.
- `[AI Action Execution]`: Success/Failure of background actions.
- `[AI Memory Saved]`: Confirmation of fact extraction.

---

*Document Revision: 2.5 (Ultimate Reference Edition)*
*Last Updated: 2026-05-05*
*Author: Antigravity AI Architecture Team*
*SelfUp Protocol Version: 4.1.2*
