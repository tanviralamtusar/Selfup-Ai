# SelfUp — Current AI System Architecture

## 1. Core Engine: The Personal Life Coach
The SelfUp AI system is designed as a persistent, autonomous life coach. Unlike generic chatbots, it is deeply integrated with the user's data, schedule, and goals.

### AI Provider & Model
- **Primary Model:** Google AI Studio — **Gemma 3** (`gemma-3-27b-it`)
- **Fallback Model:** `gemma-3-12b-it` (used during high latency or rate-limiting)
- **SDK:** `@google/generative-ai`
- **Context Window:** Optimized for 100 recent messages with a sliding window of 20 for active context.

---

## 2. The Memory Engine (Cross-Session Persistence)
The "Brain" of the system is the **Cross-Session Memory System**. It ensures the AI doesn't "forget" who the user is between conversations.

### How it Works:
1.  **Extraction:** After every user interaction, the system runs a non-blocking background process to extract key entities (goals, weights, preferences, sleep times) using regex and pattern matching.
2.  **Storage:** Data is stored in the `ai_memory` table in Supabase, indexed by `user_id` and `memory_key`.
3.  **Injection:** Every time a user sends a message, the backend fetches all relevant memory rows and injects them into the **System Prompt** as structured context.

### Example Memory Categories:
- **Fitness:** `fitness_goal`, `current_weight`, `workout_frequency`.
- **Skills:** `active_skills`, `learning_style`.
- **Lifestyle:** `sleep_schedule`, `work_hours`, `biggest_time_waste`.
- **Persona:** `ai_persona_name` (e.g., Aria), `ai_persona_style` (Friendly, Strict, Motivational).

---

## 3. Autonomous Action System
The AI doesn't just talk; it **executes**. It uses a custom XML-based action tagging system to interact with the application backend.

### The `<action>` Tag Flow:
1.  **Generation:** Based on the conversation, the AI decides to perform an action.
2.  **Tagging:** It wraps the action data in a JSON object inside an `<action>` tag.
3.  **Parsing:** The backend intercepts the response, strips the tags for the user, and executes the commands.

### Supported Actions:
- `create_task`: Adds a specific task to the user's to-do list.
- `schedule_day`: Generates a full daily protocol with time-blocked slots.
- `skill_roadmap`: Creates a multi-week learning plan with YouTube resource integration.
- `workout_plan`: Designs customized exercise routines based on fitness levels.
- `memory_update`: Explicitly updates a memory key (e.g., "I weighed in at 70kg today").

---

## 4. Data Architecture (Database Integration)
The AI system is tightly coupled with a multi-table schema in Supabase to ensure low latency and high context accuracy.

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| `ai_conversations` | Thread management. | `id`, `user_id`, `is_archived`, `title`. |
| `ai_messages` | Individual chat logs. | `conversation_id`, `role`, `content`, `coins_spent`. |
| `ai_memory` | Long-term user facts. | `memory_key`, `memory_val`, `source`. |
| `ai_queue` | Async task handling. | `request_type`, `payload`, `status`, `result`. |
| `ai_coin_transactions` | Economic ledger. | `amount`, `reason`, `balance_after`. |

---

## 5. AI Persona & Customization
SelfUp allows users to define how they want to be coached. This is achieved by dynamic prompt injection.

### Supported Styles:
- **Friendly:** Warm, supportive, uses emojis, celebrates small wins.
- **Strict:** Direct, "tough love," holds high standards, calls out excuses.
- **Motivational:** High-energy, inspirational, focuses on data-driven progress.
- **Neutral:** Professional, balanced, informational.

### Persona Persistence:
The AI's persona is stored in `user_profiles` (`ai_persona_name`, `ai_persona_style`). This is fetched and injected into the `[PERSONA]` block of the system prompt for every message.

---

## 6. Rate-Limiting & Queue Management
To handle the free tier limits of Google AI Studio and ensure a smooth user experience, SelfUp uses a **Bull + Redis Queue System**.

### Queue Workflow:
- **Instant Response:** If the rate limit is clear, the AI responds immediately.
- **Queueing (429 Error):** If rate-limited, the request is added to a `Bull` queue.
- **Polling:** The frontend receives a `202 Accepted` status with a `queueId`. It then polls `/api/ai/queue/:id/status` every few seconds.
- **Worker Processing:** A dedicated worker processes the queue based on priority (Onboarding > Chat > Background Analysis).

---

## 7. Proactive Coaching (Cron Triggers)
The AI is proactive, not just reactive. It initiates contact at key moments using scheduled cron jobs.

| Trigger | Description | Output |
| :--- | :--- | :--- |
| **Morning Check-in** | Fires at user's wake time. | Top 3 tasks, motivational line, goal reminder. |
| **Evening Review** | Fires before sleep time. | Analysis of completed tasks, XP earned, areas to improve. |
| **Weekly Summary** | Every Monday at 8:00 AM. | Deep dive into stats, streaks, and next week's goals. |

---

## 8. System Prompt Architecture
The AI's personality and intelligence are governed by a dynamic system prompt structured as follows:

```
[PERSONA DEFINITION] + [REAL-TIME CONTEXT] + [USER DATA] + [REMEMBERED MEMORY] + [STRICT INSTRUCTIONS]
```

### Dynamic Variables:
- **User Profile:** Level, Streak, Coins, Active Quests.
- **Context:** Current Time, Timezone, Scheduled Tasks for today, Habits completed.
- **Style:** Injects specific instructions based on the selected persona (e.g., "Strict" persona uses "tough love" and "direct advice").

---

## 9. Resource Integration (YouTube API)
When generating roadmaps or learning plans, the AI doesn't just suggest topics; it provides actual resources.
- **Process:** The AI provides a search query → Backend calls **YouTube Data API v3** → Real video URLs and thumbnails are returned and embedded in the roadmap.

---

## 10. AI Economy (AiCoins)
To balance server costs and provide a sense of progression, AI features are gated by **AiCoins**.
- **Chat:** 1 Coin per message.
- **Complex Tasks:** 5–15 Coins (Scheduling, Roadmaps, Analysis).
- **Earnings:** Users earn coins by completing tasks, workouts, and maintaining streaks.

---
