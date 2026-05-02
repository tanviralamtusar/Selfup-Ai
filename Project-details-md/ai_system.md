# SelfUp — AI System Design

---

## Overview
The AI system is the core differentiator of SelfUp. It acts as a personal life coach that:
- Converses naturally with the user (chat mode)
- Executes actions autonomously (scheduling, planning, analysis)
- Remembers everything across sessions
- Proactively reaches out to users (if enabled)

---

## AI Provider
- **Current:** Google AI Studio — Gemma (free tier)
- **SDK:** `@google/generative-ai`
- **Model:** `gemma-3-27b-it` (best free option) or `gemma-3-12b-it` as fallback
- **Rate limits:** ~60 requests/minute on free tier
- **Future:** Switch to Gemini Pro, Claude, or fine-tuned model when scaling

---

## AiCoin Economy

### Cost Table
| Action | AiCoin Cost |
|--------|------------|
| Chat message | 1 |
| AI auto-schedule day | 5 |
| AI progress analysis report | 10 |
| AI skill roadmap generation | 15 |
| AI meal/diet chart generation | 10 |
| AI workout plan generation | 10 |
| Onboarding (full session) | 0 |
| Morning check-in (system) | 0 |
| Weekly summary (system) | 0 |

### Earn Table
| Action | AiCoin Earned |
|--------|--------------|
| Daily login | +5 |
| Complete any task | +1 |
| Complete high-priority task | +3 |
| Complete critical task | +5 |
| Complete habit (per habit) | +1 |
| Complete workout session | +3 |
| Complete skill session | +2 |
| 7-day streak milestone | +20 |
| 30-day streak milestone | +50 |
| Complete quest | +20–100 (varies) |
| Daily photo upload (body) | +2 |
| Review weekly summary | +5 |
| Level up | +10 per level |

### Daily Limits
| Tier | Daily Grant | Max Earnable/day | Daily Cap |
|------|------------|-----------------|-----------|
| Free | +20 (midnight reset) | +30 | 50 |
| Pro | +50 | +100 | 200 |

---

## Memory System

### How It Works
1. During onboarding, AI extracts key info → saves to `ai_memory` table
2. Every chat session, backend fetches all `ai_memory` rows for user
3. Injects them into system prompt as structured context
4. After each AI response, AI may update memory keys via action tags

### Memory Keys
```
fitness_goal         "Lose 10kg in 3 months, clean diet"
fitness_level        "Intermediate, works out 3x/week"
current_weight       "72.5 kg"
target_weight        "65 kg"
diet_preference      "No pork, low sugar, likes rice"
daily_calories       "2200 kcal target"

skills_list          "Python, Guitar, Arabic"
skill_priorities     "Python is main focus"
skill_hours_week     "Python: 2hrs/day, Guitar: 30min/day"

sleep_schedule       "Sleeps 11pm, wakes 6:30am"
work_hours           "Study 9am-1pm, free afternoons"
biggest_time_waste   "Social media after 9pm"

style_preferences    "Casual minimalist, likes earth tones"
body_type            "Mesomorphic, 5'10\""
style_goals          "Look more put-together at university"

personality_notes    "Gets motivated by data, responds well to direct advice"
language_pref        "English"
ai_persona_name      "Aria"
ai_persona_style     "motivational"

last_weekly_summary  "2025-01-13: Good week overall, skipped gym Wed-Thu"
```

### Memory Update (via action tag in AI response)
```xml
<action type="memory_update">
{"key": "current_weight", "value": "71.2 kg"}
</action>
```

---

## System Prompt Architecture

```
SYSTEM PROMPT = [PERSONA] + [DATE/TIME] + [USER CONTEXT] + [MEMORY] + [INSTRUCTIONS]
```

### Full Template
```
You are {ai_persona_name}, a personal life coach AI for {display_name}.
Your coaching personality: {ai_persona_style}.
{style_description}

CURRENT DATE: {date}
USER TIMEZONE: {timezone}
CURRENT TIME: {local_time}

━━━ USER PROFILE ━━━
Age: {age} | Gender: {gender}
Level: {level} | Streak: {streak} days
Active goals: {goals}
AiCoin balance: {coins}

━━━ TODAY'S CONTEXT ━━━
Scheduled tasks today: {today_tasks_count} ({completed}/{total} done)
Active habits: {habits_summary}
Today's workout: {workout_plan_today}
Calories today: {calories_consumed}/{calories_target} kcal

━━━ ACTIVE QUESTS ━━━
{active_quests_list}

━━━ MEMORY ━━━
{memory_key_value_pairs}

━━━ INSTRUCTIONS ━━━
- Always respond in {language_pref}
- Match your coaching style to "{ai_persona_style}":
  friendly: warm, encouraging, uses emojis occasionally
  strict: direct, no excuses accepted, tough love
  motivational: high energy, inspirational, data-driven
  neutral: balanced, informational, professional
- Keep responses concise by default. Be detailed only when user asks for analysis/plans.
- When you perform an action (schedule task, update memory, suggest quest), wrap it in the appropriate <action> tag.
- Never break character. You genuinely care about this user's progress.
- If user mentions a body metric, extract and save it via memory_update action.
- When suggesting resources, prefer YouTube links (use YouTube search).
- Always acknowledge progress before giving advice.
- Maximum response length: 500 words unless user asks for detailed plan/analysis.
```

### Persona Style Descriptions
```
friendly:     "Be warm, supportive, and encouraging. Use the user's first name often. 
               Celebrate small wins. Never make them feel bad for slipping up."

strict:       "Be direct and hold high standards. Call out excuses directly. 
               Push them to do more. No sugarcoating."

motivational: "Be high-energy and inspiring. Use data to show progress. 
               Connect their daily actions to their bigger vision."

neutral:      "Be professional and informative. Give balanced perspective.
               Don't over-celebrate or over-criticize."
```

---

## Action System

### Available Actions
AI embeds these in responses. Backend parses and executes.

```xml
<!-- Create a task -->
<action type="create_task">
{
  "title": "Evening run",
  "priority": "high",
  "scheduled_start": "2025-01-14T18:00:00",
  "scheduled_end": "2025-01-14T18:45:00",
  "category": "fitness"
}
</action>

<!-- Schedule multiple tasks (AI Schedule Day) -->
<action type="schedule_day">
{
  "date": "2025-01-14",
  "tasks": [
    {"title": "Morning workout", "start": "07:00", "duration_min": 45},
    {"title": "Python study", "start": "09:00", "duration_min": 120}
  ]
}
</action>

<!-- Generate workout plan -->
<action type="workout_plan">
{
  "title": "Fat Loss Program",
  "days": [...]
}
</action>

<!-- Generate skill roadmap -->
<action type="skill_roadmap">
{
  "skill_id": "...",
  "milestones": [
    {"title": "Week 1: Basics", "resources": [{"type": "youtube", "query": "Python basics tutorial"}]}
  ]
}
</action>

<!-- Update memory -->
<action type="memory_update">
{"key": "current_weight", "value": "71.2 kg"}
</action>

<!-- Suggest a quest -->
<action type="quest_suggest">
{
  "title": "7-Day Morning Workout",
  "category": "fitness",
  "duration_days": 7,
  "xp_reward": 200,
  "coin_reward": 50
}
</action>
```

### Action Parser (Backend)
```typescript
function parseActions(aiResponse: string): { text: string; actions: Action[] } {
  const actionRegex = /<action type="(\w+)">([\s\S]*?)<\/action>/g
  const actions: Action[] = []
  let match
  while ((match = actionRegex.exec(aiResponse)) !== null) {
    actions.push({ type: match[1], data: JSON.parse(match[2]) })
  }
  const cleanText = aiResponse.replace(actionRegex, '').trim()
  return { text: cleanText, actions }
}
```

---

## Rate Limit Queue

### Flow
```
AI request comes in
  → Check Gemma API (call attempt)
    → Success → return response immediately
    → 429 Rate Limit → add to Bull queue
      → Return HTTP 202 { queueId, estimatedWait }
      → Frontend polls GET /api/ai/queue/:id/status every 5 seconds
      → queueWorker processes when slot available
      → When done → update ai_queue.status = 'done', store result
      → Frontend receives result, renders normally
```

### Queue Priority
1. Onboarding (highest — user is waiting on setup)
2. Direct chat messages
3. Auto-schedule actions
4. Background analysis (lowest — can wait)

---

## Proactive Messaging

### Morning Check-in (User-enabled)
```
Trigger: cron at user's preferred morning time
Prompt: "Generate a short morning message for {name}. 
         Today's date: {date}. Their schedule: {today_schedule}.
         Be {persona_style}. Include:
         1. One motivational line
         2. Top 3 tasks for today
         3. One reminder about their current goal
         Keep it under 150 words."
Delivery: Push notification + in-app notification + chat message
```

### Evening Review (User-enabled)
```
Trigger: cron at user's preferred evening time
Prompt: "Generate a brief evening review for {name}.
         What they completed today: {completed_tasks}.
         Workouts: {workout_log}. Habits: {habits_done}/{habits_total}.
         Be {persona_style}. Include:
         1. What went well
         2. What to improve tomorrow
         3. XP earned today
         Keep it under 200 words."
```

### Weekly Summary (Every Monday 8am)
```
Prompt: "Generate a detailed weekly review for {name}.
         Week of {week_dates}.
         Stats: tasks {done}/{total}, workouts {count}, 
         skills {hours}hrs, habits {completion_pct}%.
         XP earned: {weekly_xp}. Streak: {streak} days.
         Include: wins, areas to improve, goals for next week.
         Max 300 words."
Delivery: Push notification + email + full chat message with charts data
```

---

## Conversation History Management

- Store last **100 messages** per conversation in DB
- Inject last **20 messages** into context (prevents token overflow)
- After 100 messages, archive old conversation, auto-start new one
- User can access archived conversations in conversation list
- Message content is stored as-is (including action tags stripped version)

---

## YouTube Integration (Skill Resources)

```typescript
// When AI generates a roadmap with YouTube resources
// Backend calls YouTube Data API v3 to search + get actual URLs

async function searchYouTube(query: string): Promise<VideoResult[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.items.map(item => ({
    title: item.snippet.title,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails.default.url
  }))
}
```
