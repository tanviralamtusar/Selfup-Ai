# AI Cross-Session Memory System

## Overview
The cross-session memory system allows the AI to remember user preferences, goals, progress, and context across conversations. This creates a persistent, personalized experience where the AI "knows" the user over time.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 User Interaction                      │
│              (Chat / Onboarding / Settings)          │
└────────────────────┬────────────────────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │                                 │
┌───▼──────────────────┐    ┌────────▼──────────────┐
│   AI Chat Endpoint   │    │   Memory API Routes   │
│  /api/ai/chat (POST) │    │  /api/ai/memory/*     │
└───┬──────────────────┘    └────────┬──────────────┘
    │                                 │
    │  Fetch Memory                   │  Save/Update/Delete
    │  Format Context                 │  Batch Operations
    │  Extract New Memory             │  Clear All
    │                                 │
    └────────────────┬────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Supabase Database     │
        │   ai_memory Table       │
        │ (user_id, memory_key,   │
        │  memory_val, source)    │
        └─────────────────────────┘
```

## Database Schema

### ai_memory Table
```sql
CREATE TABLE ai_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  memory_key  TEXT NOT NULL,     -- e.g., 'fitness_goal', 'skill_plan', 'personality'
  memory_val  TEXT NOT NULL,     -- Stored as text (can be JSON string)
  source      TEXT,              -- 'onboarding', 'chat', 'system', 'user-input'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, memory_key)
);
```

### Supported Memory Keys

#### Fitness Memory
- `fitness_goal` - User's fitness objective (e.g., "lose 10kg", "build muscle")
- `workout_frequency` - How often they work out (e.g., "5 times per week")
- `fitness_level` - Current fitness level (e.g., "beginner", "advanced")
- `recent_workouts` - Summary of recent workout activity

#### Skills & Learning
- `active_skills` - Skills they're currently learning
- `learning_style` - How they prefer to learn (e.g., "visual", "hands-on")
- `skill_milestones` - Completed skill milestones

#### Time Management
- `sleep_schedule` - Sleep/wake time (e.g., "7:30 AM - 11:30 PM")
- `work_hours` - Work/study schedule
- `time_challenges` - Main time management issues
- `productivity_tools` - Tools they use (Pomodoro, calendar, etc.)

#### Style & Appearance
- `style_preference` - Fashion/aesthetic preference
- `body_type` - Body type for styling advice
- `color_preference` - Preferred colors
- `style_goals` - Fashion/styling goals

#### Personality & Preferences
- `communication_style` - How to communicate (e.g., "formal", "casual", "technical")
- `motivation_type` - What motivates them (e.g., "strict accountability", "supportive")
- `user_challenges` - Main life challenges
- `achievements` - Recent wins and accomplishments

#### AI Interaction
- `ai_interaction_style` - Preferred AI interaction style
- `preferred_advice_type` - Type of advice they prefer

## Features

### 1. Automatic Memory Extraction
When a user sends a message to the AI, the system automatically extracts key information:

```typescript
// In /api/ai/chat POST handler
extractAndSaveMemory(user.id, userMessage, aiResponse, token)
```

Pattern matching identifies:
- Fitness goals ("want to lose 10kg", "trying to build muscle")
- Skills being learned ("learning Python", "want to learn guitar")
- Time preferences ("wake up at 6am", "work 9-5")
- Style preferences ("love minimal aesthetic", "prefer dark colors")
- Communication preferences (extracted from AI suggestions)

### 2. Memory Injection into AI Context
Before generating a response, the AI receives the user's memory as context:

```typescript
// In /api/ai/chat POST handler
const userMemory = await fetchUserMemory(user.id, token)
const memoryContext = await formatMemoryContext(userMemory)
const contextualPrompt = `${SYSTEM_PROMPT}\n${memoryContext}`
```

The AI sees:
```
REMEMBERED - Fitness Goals:
- Goal: lose 10kg
- Frequency: 5 times per week
- Level: intermediate
- Recent Activity: 3 workouts this week

REMEMBERED - Learning & Skills:
- Skills Learning: Python and Web Development
- Style: project-based learning
- Milestones: Completed basics, working on OOP

REMEMBERED - About the User:
- Prefers: direct and technical communication
- Motivated by: seeing tangible progress
- Main Challenge: consistency
- Recent Wins: Completed first Django project
```

### 3. Manual Memory Management
Store memory from onboarding, settings, or other user inputs:

```typescript
// Via useAiMemory hook
const { saveMemory } = useAiMemory()
await saveMemory('fitness_goal', 'lose 10kg', 'onboarding')

// Or via API directly
POST /api/ai/memory
{
  "memoryKey": "fitness_goal",
  "memoryValue": "lose 10kg",
  "source": "onboarding"
}
```

### 4. Batch Memory Updates
Save multiple memory entries at once:

```typescript
PUT /api/ai/memory
{
  "memories": [
    { "key": "fitness_goal", "value": "lose 10kg", "source": "onboarding" },
    { "key": "workout_frequency", "value": "5 times per week", "source": "onboarding" },
    { "key": "sleep_schedule", "value": "6:30 AM - 11:00 PM", "source": "onboarding" }
  ]
}
```

### 5. Memory Retrieval
Get all memories for the user:

```typescript
GET /api/ai/memory

Response:
{
  "fitness_goal": "lose 10kg",
  "workout_frequency": "5 times per week",
  "fitness_level": "intermediate",
  "sleep_schedule": "6:30 AM - 11:00 PM",
  ...
}
```

### 6. Memory Clearing
Clear all memories for the user (requires confirmation header):

```typescript
DELETE /api/ai/memory
Headers: {
  "x-confirm-memory-clear": "true"
}
```

## Usage Examples

### Onboarding Integration
When collecting user preferences during onboarding, save them to memory:

```typescript
import { useAiMemory } from '@/lib/hooks/useAiMemory'

function OnboardingStep() {
  const { saveMemoryBatch } = useAiMemory()

  const handleOnboardingComplete = async (data) => {
    const memories = [
      { key: 'fitness_goal', value: data.fitnessGoal, source: 'onboarding' },
      { key: 'workout_frequency', value: data.workoutDays, source: 'onboarding' },
      { key: 'sleep_schedule', value: `${data.wakeTime} - ${data.sleepTime}`, source: 'onboarding' },
      { key: 'communication_style', value: data.communicationPreference, source: 'onboarding' }
    ]
    
    await saveMemoryBatch(memories)
  }
}
```

### Settings Integration
Allow users to update their memory from settings:

```typescript
import { useAiMemory } from '@/lib/hooks/useAiMemory'

function SettingsPage() {
  const { saveMemory } = useAiMemory()

  const handleUpdateGoal = async (newGoal) => {
    await saveMemory('fitness_goal', newGoal, 'user-settings')
  }
}
```

### Chat Context Usage
The AI automatically uses memory in all chat responses:

```
User: "I'm struggling with consistency"
AI: "Based on what you've shared, you're training 5 times a week and aiming to lose 10kg. That's great progress! 
     Here's how we can improve consistency:
     1. Set specific times for workouts (e.g., 6 AM Mon/Wed/Fri, 10 AM Tue/Sat)
     2. Create accountability system
     3. Track streaks..."
```

## Implementation Details

### Memory Extraction Algorithm
The extraction happens in `src/lib/ai-memory.ts`:

1. **Pattern Matching** — Uses regex to find goal statements
2. **Frequency Analysis** — Extracts frequency mentions ("5 times", "every day")
3. **Preference Detection** — Identifies communication/motivation styles
4. **Upsert Logic** — Updates existing memory or creates new entries

Example patterns:
```typescript
// Fitness
/want to|goal is|trying to|planning to\s+([^.,]+)/i
/(\d+)\s+times?\s+(?:a|per)\s+(?:week|day)/i

// Skills
/(?:learn|studying|want to learn)\s+([^.,]+)/i

// Time
/(?:wake at|sleep at|start at)\s+([^.,]+)/i

// Style
/(?:prefer|like|love|enjoy)\s+([^.,]+)/i
```

### Memory Formatting
The `formatMemoryContext()` function organizes memory into readable sections for the AI:

```
REMEMBERED - Fitness Goals:
- Goal: ${memory.fitness_goal}
- Frequency: ${memory.workout_frequency}
...

REMEMBERED - Learning & Skills:
- Skills Learning: ${memory.active_skills}
...
```

This structured format helps the AI understand priorities and context.

## Future Enhancements

### 1. ML-Based Memory Extraction
Replace regex with NLP to extract more sophisticated insights:
- Sentiment analysis ("I love", "I struggle with")
- Entity recognition (exercise types, food preferences)
- Relationship extraction (links between goals)

### 2. Memory Decay
Older memories gradually lose relevance:
- Fresh memories (< 1 week): full weight
- Old memories (> 1 month): reduced weight
- Archived memories: not included

### 3. Memory Conflicts
Handle contradictions:
- User says "I want to build muscle" then later "I want to lose weight"
- AI asks for clarification: "You mentioned both goals — what's the priority?"
- Updates memory with resolution

### 4. Memory Summarization
Periodically summarize conversations into key insights:
```
Weekly Summary (5 conversations):
- Consistent with gym schedule
- Struggling with diet
- Recently interested in nutrition coaching
```

### 5. Memory Privacy Controls
Let users control what gets remembered:
- Public memory (shared with AI always)
- Private memory (only used in current conversation)
- Archive memory (kept but not actively used)

## Testing

### Test Memory Extraction
```bash
# Send a message to the AI
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "I want to lose 10kg and I work out 5 times a week"}'

# Check if memory was saved
curl http://localhost:3000/api/ai/memory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Memory Injection
```bash
# Send a message and check if AI references previous memory
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "How can I stay consistent with my workouts?"}'

# The AI response should reference the previously saved goals
```

## Performance Considerations

- **Memory Fetch**: ~50-100ms (single query + parsing)
- **Memory Extraction**: ~100-200ms (regex processing, non-blocking)
- **Memory Injection**: Adds ~50 tokens to prompt (minimal impact)
- **Batch Saves**: ~500ms (multiple upserts optimized with batch)

The system is designed to be non-blocking — if memory extraction fails, the conversation still completes successfully.
