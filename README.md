# SelfUp AI — Personal Life-Operating System

SelfUp is an AI-powered, gamified personal development platform. It tracks the parts of your life that matter — habits, dailies and to-dos, money, fitness, skills, and style — and turns progress into XP, levels, ranks, and AiCoins.

> **"If someone uses this app properly, they can change their life entirely."**

---

## 🚀 Modules

| Module | Route | Status | What it does |
| :--- | :--- | :--- | :--- |
| **📋 Dashboard** | `/dashboard` | Live | Habitica-style board of Habits, Dailies and To-Dos; profile, XP/HP bars, streaks, badges. |
| **⏰ Time** | `/time` | Live | Board, Pomodoro focus timer, habit heatmaps/calendar, time-blocking schedule with AI auto-schedule. |
| **💰 Money** | `/money` | Live | Accounts, transactions, monthly budgets, recurring bills/income, savings goals, analytics, AI spending insights. |
| **📊 Analysis** | `/analysis` | Live | Attribute radar, stat allocation, activity feed and progress charts. |
| **🏋️ Fitness** | `/fitness` | Hidden from nav | AI workout plans, 873-exercise library with muscle-map picker, multi-week programs, session tracker with rest timer, nutrition, body metrics. |
| **🧠 Skills** | `/skills` | Hidden from nav | AI roadmaps, topics/milestones, YouTube resources, AI-generated tests. |
| **👗 Style** | `/style` | Hidden from nav | Outfit log, moodboard, AI recommendations. |
| **⚔️ Quests / 👥 Social / 💬 AI Chat** | `/quests`, `/social/*`, `/chat` | Hidden from nav | Quests, leaderboard/friends, conversational AI with memory. |
| **📱 Android app** | `mobile/` | New | Dashboard, Money, Time and Analysis on your phone. Works fully offline and syncs with the website in real time when connected. See [mobile/README.md](mobile/README.md). |

"Hidden from nav" modules are implemented and routable, but are deliberately left out of the sidebar (`temporarilyHiddenNavItems` in `web/src/components/layout/AppShell.tsx`) until they are revisited.

### Gamification

- All XP flows through `GamificationService` (`web/src/lib/gamification.service.ts`) — level-ups, rank, AiCoins, stat points and HP.
- **New-day check-in** (Habitica-style): on the first visit of a day, `DayStartModal` asks which of yesterday's dailies you actually did; the rest cost XP and HP, and streaks roll over (`/api/dailies/cron`).
- Money actions also earn XP: +5 per logged transaction, +8 per goal contribution (+25 bonus when a goal is reached).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) — single app in `web/`, UI and API routes together
- **UI**: React 19, Tailwind CSS 4, Radix UI / shadcn, Framer Motion, Lucide, Recharts
- **State & data**: TanStack Query v5, Zustand (global client state only), React Hook Form + Zod
- **Database & Auth**: Supabase (PostgreSQL + RLS)
- **AI**: Google GenAI SDK — `gemini-2.5-flash` default with automatic fallback; `gemma-4-31b-it` and `gemini-2.5-pro` selectable per user; `gemini-embedding-2` for memory embeddings
- **Background jobs**: BullMQ worker code exists, but **Redis is currently disabled** — `addAiTask()` runs jobs synchronously in the request (see `web/src/lib/queue.ts`, `web/src/lib/redis.ts`). Proactive alerts and weekly summaries run from an in-process hourly loop started in `web/src/instrumentation.ts`.
- **Deployment**: Docker (`web/Dockerfile`) via Coolify on a VPS

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- A Google AI Studio API key
- *(Optional)* YouTube Data API key — without it, YouTube search returns mock data

### Setup

```bash
git clone https://github.com/tanviralamtusar/Selfup-Ai.git
cd Selfup-Ai/web
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Environment variables (`web/.env.local`)

| Variable | Required | Used for |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser + user-scoped server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only admin client — never expose to the browser |
| `GOOGLE_AI_API_KEY` | Yes | All AI features |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL` | Prod | Absolute URLs; also Docker build args |
| `YOUTUBE_API_KEY` | No | Skills resources and YouTube search |

### Database migrations

Base schema lives in Supabase. Incremental migrations are in `web/scripts/migrations/*.sql` and are applied by pasting them into the **Supabase SQL editor** (they are idempotent). They are not tracked by the Supabase migrations table, so verify against `information_schema` rather than `list_migrations`.

| File | Adds |
| :--- | :--- |
| `add_exercise_media_columns.sql` | Exercise muscle + image columns |
| `add_exercise_attributes.sql` | Exercise type/mechanics/force attributes + indexes |
| `create_programs.sql` | Multi-week fitness programs + enrollments/progress |
| `create_money.sql` | Money module tables + RLS |
| `add_day_cron.sql` | `last_cron_date`, daily streaks, XP idempotency index |
| `add_mobile_sync.sql` | `sync_idempotency` table + realtime publication for the Android app and live website updates |

Then seed fitness data if needed: `npm run seed:exercises` and `npm run seed:programs`.

### Scripts (run from `web/`)

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build + type check |
| `npm run lint` | ESLint |
| `npm run worker` | BullMQ worker — won't start while Redis is disabled |
| `npm run seed:exercises` | Seed/backfill the exercise library (free-exercise-db) |
| `npm run seed:programs` | Seed fitness programs |

There is no unit-test suite yet. Validate changes with `npm run lint`, `npm run build`, and by exercising the affected route.

---

## 📚 Documentation

- **[AGENTS.md](AGENTS.md)** — contributor & AI-agent guide: structure, conventions, current-state gotchas. Start here.
- **[.agents/rules/](.agents/rules/)** — frontend, backend, security, performance and Git rules.
- **[Project-details-md/](Project-details-md/README.md)** — design specs and reference docs; the index marks which describe the current system and which are historical specs.

---

## 🗺️ Roadmap

- [x] V1 core web app (dashboard, time, gamification)
- [x] Money module
- [x] Fitness v2 (exercise library, programs, session tracker)
- [ ] Re-enable Fitness, Skills, Style, Quests, Social and Chat in navigation
- [ ] Re-enable Redis/BullMQ for true background processing
- [x] Android app with offline sync (`mobile/`)
- [ ] iOS build and desktop app
- [ ] Deep analytics & parental controls

---

Developed with ❤️ by the SelfUp Team.
