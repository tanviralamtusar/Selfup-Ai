# SelfUp — Backend Architecture

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Node.js + Express | HTTP server |
| TypeScript | Type safety |
| Supabase JS (Admin) | DB access with service role key |
| Bull + Redis | AI request queue |
| node-cron | Scheduled jobs (morning check-in, AI tasks) |
| Resend | Transactional emails |
| web-push | Browser push notifications |
| Google Generative AI SDK | Gemma AI calls |
| Zod | Request validation |
| Winston | Logging |
| Helmet + cors + rate-limiter | Security middleware |

---

## Folder Structure

```
backend/
├── src/
│   ├── index.ts               # Entry point
│   ├── app.ts                 # Express app setup
│   │
│   ├── config/
│   │   ├── env.ts             # Zod-validated env vars
│   │   ├── supabase.ts        # Supabase admin client
│   │   ├── redis.ts           # Redis client
│   │   ├── gemma.ts           # Google AI client
│   │   └── resend.ts          # Email client
│   │
│   ├── middleware/
│   │   ├── auth.ts            # Verify Supabase JWT
│   │   ├── validate.ts        # Zod request validation
│   │   ├── rateLimiter.ts     # Per-user rate limits
│   │   ├── coinCheck.ts       # Verify user has enough AiCoins
│   │   └── errorHandler.ts    # Global error handler
│   │
│   ├── routes/
│   │   ├── index.ts           # Mount all routers
│   │   ├── auth.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── habits.routes.ts
│   │   ├── fitness.routes.ts
│   │   ├── skills.routes.ts
│   │   ├── style.routes.ts
│   │   ├── gamification.routes.ts
│   │   ├── social.routes.ts
│   │   ├── notifications.routes.ts
│   │   ├── subscription.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── controllers/           # Request handlers
│   │   ├── ai.controller.ts
│   │   ├── tasks.controller.ts
│   │   └── ... (one per route file)
│   │
│   ├── services/              # Business logic
│   │   ├── ai/
│   │   │   ├── gemma.service.ts       # Raw AI API calls
│   │   │   ├── memory.service.ts      # Read/write ai_memory
│   │   │   ├── context.service.ts     # Build system prompt + context
│   │   │   ├── actions.service.ts     # AI-triggered actions (schedule, analyze)
│   │   │   ├── proactive.service.ts   # Morning check-in, evening review
│   │   │   └── queue.service.ts       # Bull queue management
│   │   │
│   │   ├── coins.service.ts           # AiCoin debit/credit/balance
│   │   ├── gamification.service.ts    # XP, level up, badge awarding
│   │   ├── tasks.service.ts
│   │   ├── fitness.service.ts
│   │   ├── skills.service.ts
│   │   ├── notifications.service.ts   # Push + email sending
│   │   └── calendar.service.ts        # Google Calendar sync
│   │
│   ├── jobs/                  # node-cron scheduled tasks
│   │   ├── scheduler.ts       # Registers all cron jobs
│   │   ├── morningCheckin.job.ts
│   │   ├── eveningReview.job.ts
│   │   ├── weeklyReport.job.ts
│   │   ├── streakReset.job.ts
│   │   ├── coinRefill.job.ts  # Daily coin grant for free users
│   │   └── queueWorker.ts     # Process AI queue
│   │
│   ├── utils/
│   │   ├── response.ts        # Standardized API responses
│   │   ├── xp.ts              # XP calculation formulas
│   │   ├── prompts.ts         # AI prompt templates
│   │   └── logger.ts
│   │
│   └── types/
│       ├── express.d.ts       # Extend Request with user
│       └── index.ts
│
├── .env
├── tsconfig.json
└── package.json
```

---

## API Endpoints

### Auth (`/api/auth`)
```
POST   /api/auth/register          # Email signup
POST   /api/auth/login             # Email login
POST   /api/auth/google            # Google OAuth callback
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me                # Current user profile
```

### Onboarding (`/api/onboarding`)
```
POST   /api/onboarding/start       # Submit onboarding data → AI generates plan
POST   /api/onboarding/complete    # Mark onboarding done, return initial state
```

### AI (`/api/ai`)
```
POST   /api/ai/chat                # Send message (costs 1 AiCoin)
GET    /api/ai/conversations       # List conversations
GET    /api/ai/conversations/:id   # Get messages in conversation
DELETE /api/ai/conversations/:id
POST   /api/ai/actions/schedule    # AI auto-schedules day (costs 5 coins)
POST   /api/ai/actions/analyze     # AI analysis report (costs 10 coins)
POST   /api/ai/actions/roadmap     # Generate skill roadmap (costs 15 coins)
GET    /api/ai/queue/status        # Check if queued request is done
GET    /api/ai/coins/balance
GET    /api/ai/coins/transactions
```

### Tasks (`/api/tasks`)
```
GET    /api/tasks                  # List tasks (filter by status, date)
POST   /api/tasks                  # Create task
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/complete     # Complete task → award XP + coins
POST   /api/tasks/bulk-update      # For drag-drop reordering
```

### Habits (`/api/habits`)
```
GET    /api/habits
POST   /api/habits
PATCH  /api/habits/:id
DELETE /api/habits/:id
POST   /api/habits/:id/log         # Log habit for today
GET    /api/habits/:id/history     # Heatmap data
```

### Fitness (`/api/fitness`)
```
# Workouts
GET    /api/fitness/plans
POST   /api/fitness/plans
GET    /api/fitness/plans/:id
PATCH  /api/fitness/plans/:id
POST   /api/fitness/logs           # Log workout session
GET    /api/fitness/logs           # History

# Nutrition
GET    /api/fitness/food-logs
POST   /api/fitness/food-logs
DELETE /api/fitness/food-logs/:id
GET    /api/fitness/water-logs
POST   /api/fitness/water-logs

# Body metrics
GET    /api/fitness/metrics
POST   /api/fitness/metrics
POST   /api/fitness/metrics/photo  # Upload body photo

# Exercises library
GET    /api/fitness/exercises
POST   /api/fitness/exercises      # Create custom exercise
```

### Skills (`/api/skills`)
```
GET    /api/skills
POST   /api/skills
GET    /api/skills/:id
PATCH  /api/skills/:id
DELETE /api/skills/:id
GET    /api/skills/:id/roadmap
POST   /api/skills/:id/session     # Log skill session
GET    /api/skills/:id/history
```

### Style (`/api/style`)
```
GET    /api/style/profile
PUT    /api/style/profile
GET    /api/style/recommendations
POST   /api/style/outfit-logs
GET    /api/style/outfit-logs
GET    /api/style/moodboard
POST   /api/style/moodboard
DELETE /api/style/moodboard/:id
```

### Gamification (`/api/gamification`)
```
GET    /api/gamification/profile   # XP, level, coins, badges, streaks
GET    /api/gamification/quests    # Active + available quests
POST   /api/gamification/quests/:id/join
POST   /api/gamification/quests/:id/abandon
GET    /api/gamification/badges
GET    /api/gamification/leaderboard?type=global|friends&period=weekly|alltime
```

### Social (`/api/social`)
```
GET    /api/social/friends
POST   /api/social/friends/request    # Send friend request
PATCH  /api/social/friends/:id        # Accept/reject
DELETE /api/social/friends/:id
GET    /api/social/challenges
POST   /api/social/challenges         # Create challenge
PATCH  /api/social/challenges/:id     # Accept/reject
GET    /api/users/:username           # Public profile
GET    /api/users/search?q=           # Search users
```

### Notifications (`/api/notifications`)
```
GET    /api/notifications             # List notifications
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read
GET    /api/notifications/settings
PUT    /api/notifications/settings
POST   /api/notifications/subscribe   # Save Web Push subscription
```

### User / Settings (`/api/user`)
```
GET    /api/user/profile
PATCH  /api/user/profile
POST   /api/user/avatar              # Upload photo
DELETE /api/user/account             # Delete account
POST   /api/user/export              # Export data as JSON
GET    /api/user/subscription
```

---

## AI System — Core Architecture

### Request Flow
```
User sends message
  → coinCheck middleware (verify balance)
  → controller calls ai.service
    → context.service builds system prompt:
        [AI persona] + [user memory] + [recent stats] + [current schedule] + [conversation history last 20 msgs]
    → gemma.service calls Google AI Studio API
      → if rate limit hit → queue.service adds to Bull queue → returns 202 + queueId
      → if success → response streamed back to client
    → memory.service updates relevant memory keys
    → coins.service deducts coins
    → gamification.service awards XP if applicable
```

### System Prompt Structure
```
You are {persona_name}, a personal life coach AI for {user_name}. 
Your personality: {persona_style}.
Today: {date}. User timezone: {timezone}.

USER CONTEXT:
- Goals: {goals}
- Current streak: {streak} days
- Level: {level}
- Today's schedule: {schedule}
- Active quests: {quests}

MEMORY:
{memory_keys_and_values}

INSTRUCTIONS:
- Always respond in the user's preferred language
- When you schedule tasks, output structured JSON wrapped in <action type="schedule">
- When you generate a plan, output structured JSON wrapped in <action type="plan">
- Keep responses concise unless detailed analysis is requested
- Use motivational but realistic tone
```

### Action Parsing
AI can embed structured actions in responses:
```xml
<action type="schedule">
{"tasks": [{"title": "Morning run", "time": "07:00", "duration": 30}]}
</action>

<action type="quest_suggest">
{"title": "7-Day Hydration Challenge", "category": "fitness"}
</action>
```
Backend parses these and executes them automatically.

---

## Cron Jobs

| Job | Schedule | What it does |
|-----|----------|-------------|
| `coinRefill` | `0 0 * * *` (midnight) | Grant 20 free coins to free users |
| `streakCheck` | `0 1 * * *` (1am) | Check for broken streaks, notify users |
| `morningCheckin` | Per-user pref | AI morning message (if enabled) |
| `eveningReview` | Per-user pref | AI evening summary (if enabled) |
| `weeklyReport` | `0 8 * * 1` (Mon 8am) | AI weekly summary for all users |
| `aiScheduling` | `0 6 * * *` (6am) | Auto-schedule for users with it enabled |
| `queueWorker` | Every 30 seconds | Process pending AI queue items |
| `leaderboardCalc` | `0 * * * *` (hourly) | Recalculate leaderboard scores |

---

## Security

### Auth Middleware
```ts
// Every protected route uses this
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })
  req.user = user
  next()
}
```

### Rate Limiting
```ts
// Per-user, per-endpoint limits
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,                // 5 AI requests per minute per user
  keyGenerator: (req) => req.user.id
})
```

### Headers (Helmet)
- Content Security Policy
- XSS protection
- CORS: only allow `selfup.botbhai.net` origin

---

## Environment Variables

```env
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # NEVER expose to frontend

# Google AI Studio
GEMMA_API_KEY=

# Redis (local on VPS)
REDIS_URL=redis://localhost:6379

# Resend Email
RESEND_API_KEY=
RESEND_FROM=noreply@botbhai.net

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=admin@botbhai.net

# Google OAuth / Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# YouTube Data API
YOUTUBE_API_KEY=

# JWT (Supabase handles this, but needed for verification)
SUPABASE_JWT_SECRET=

# App
APP_URL=https://selfup.botbhai.net
```

---

## Build & Run

```bash
npm install
npm run dev     # ts-node with watch
npm run build   # tsc compile to dist/
npm run start   # node dist/index.js
```
