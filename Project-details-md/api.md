# SelfUp — API Reference

> **Last synced with code:** 2026-10-05 (`main`).
> This replaces the original Express-era API spec. To regenerate the inventory, list the `route.ts` files under `web/src/app/api/` and their exported `GET`/`POST`/`PATCH`/`PUT`/`DELETE` handlers.

**Base URL:** same origin, `/api` (Next.js route handlers in `web/src/app/api/**/route.ts`)
**Auth:** `Authorization: Bearer <Supabase access token>`, checked with `verifyAuth()` (`web/src/lib/api-auth.ts`). Handlers then query Supabase as the user, so RLS applies.
**Format:** JSON. Success: `{ success: true, data }`. Errors: target shape is `{ success: false, error }`, but many older routes return a bare `{ error }`.

There is no `/api/health` endpoint; the Docker healthcheck hits `/`.

### Days and time zones

All day logic uses the user's own time zone (`user_profiles.timezone`, an IANA name; helpers in `web/src/lib/user-time.ts`). That covers today's dailies, `/api/dailies/cron`, completion/log dates and XP day keys, overdue to-dos, streaks, the weekly activity grid, today's pomodoros and recurring posts. `PATCH /api/settings/profile { timezone }` validates the zone. The Android app sets it from the phone before every sync.

### Offline-sync contract (used by the Android app)

- **`Idempotency-Key` header.** Mutation routes the app replays (dailies, habits, todos, pomodoro, all `money/*` writes, `dailies/cron` POST) are wrapped in `idempotent()` (`web/src/lib/idempotency.ts`). The first request with a key stores its response in `sync_idempotency`; a repeat gets that response back with `Idempotent-Replay: true` and does not run again. `503 { retry: true }` means the same key is still in flight. Requests without the header behave as before.
- **Client ids.** `POST` creates accept an optional `id` (UUID). Re-sending the same id returns the existing row instead of an error.
- **Action day.** `POST /api/dailies/[id]/complete` and `POST /api/habits/[id]/log` accept `{ date: 'YYYY-MM-DD' }` (a day in the user's time zone, within the last 7 days) so XP keys and logs land on the day the user acted. `POST /api/pomodoro` accepts `id` + `started_at`; `PATCH` accepts `completed_at`.

---

## AI

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/ai` | Placeholder stub |
| GET, POST, DELETE | `/api/ai/chat` | Conversations: list/history, send message, delete |
| POST | `/api/ai/chat/confirm` | Confirm an AI-proposed action (ActionWidget) |
| GET, POST, PUT, DELETE | `/api/ai/memory` | Cross-session AI memory |
| GET, POST | `/api/ai/queue` | Enqueue / inspect AI jobs (runs synchronously, since Redis is off) |
| GET, PATCH | `/api/ai/settings` | Per-user model selection |
| GET | `/api/ai/summary` | Weekly summary |
| POST | `/api/ai/habits/suggest` | AI habit suggestions |

## Auth, Onboarding, User, Settings

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/auth` | Placeholder stub. Auth itself is Supabase client-side |
| POST | `/api/onboarding` | Complete onboarding |
| POST | `/api/onboarding/questions` | AI onboarding interview questions |
| GET | `/api/user` | Profile |
| GET | `/api/user/activities` | Activity feed |
| GET | `/api/user/badges` | User badges |
| GET | `/api/user/transactions` | AiCoin transaction history |
| POST | `/api/user/streak-freeze` | Buy a streak freeze (100 AiCoins) |
| PATCH | `/api/settings/profile` | Update profile settings |

## Habits, Dailies, To-Dos, Tasks

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/habits` | |
| PATCH, DELETE | `/api/habits/[id]` | |
| POST | `/api/habits/[id]/log` | Log +/- for a habit |
| GET, POST | `/api/dailies` | GET returns dailies scheduled today |
| PATCH, DELETE | `/api/dailies/[id]` | |
| POST | `/api/dailies/[id]/complete` | Complete a daily (XP via GamificationService) |
| GET | `/api/dailies/cron` | Is a new day pending? Returns the dailies due on the last un-rolled day |
| POST | `/api/dailies/cron` | Run the new day. Body `{ completedIds: string[] }`: award XP for confirmed dailies, XP penalty + HP damage for the rest, roll streaks, reset completion |
| GET, POST | `/api/todos` | |
| PATCH, DELETE | `/api/todos/[id]` | |
| POST | `/api/todos/[id]/complete` | |
| PATCH | `/api/todos/batch` | Batch-update scheduling fields (`scheduled_start/end`) |
| GET, POST | `/api/goals` | Deadline goals. GET first fails expired ones (HP penalty). POST `{ title, target_value?, unit?, deadline, difficulty }`, deadline today or later |
| PATCH, DELETE | `/api/goals/[id]` | PATCH `{ progress }`, `{ current_value }` or `{ complete: true }` (+ `date` for offline); reaching the target completes it (XP); 409 after the deadline. DELETE of an active goal older than 1 h costs its HP penalty |
| GET, POST | `/api/tasks` | Cross-module tasks |
| PATCH, DELETE | `/api/tasks/[id]` | |
| PATCH | `/api/tasks/batch` | |

## Time

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/time` | Placeholder stub |
| POST | `/api/time/auto-schedule` | AI auto-schedule the day |
| GET, POST, PATCH | `/api/pomodoro` | Pomodoro sessions |
| GET | `/api/calendar/availability` | Find a free slot (`?day=&time=&duration=`) |

## Money

See [money.md](money.md) for details.

| Method | Path |
| --- | --- |
| GET, POST | `/api/money/accounts` · `/api/money/categories` · `/api/money/transactions` · `/api/money/recurring` · `/api/money/goals` |
| PATCH, DELETE | `/api/money/{accounts,categories,transactions,recurring,goals}/[id]` |
| GET, POST, DELETE | `/api/money/budgets` |
| POST | `/api/money/recurring/[id]/post` |
| GET | `/api/money/summary` · `/api/money/analytics` |
| POST | `/api/money/insights` |

## Fitness

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/fitness` | Placeholder stub |
| GET, POST | `/api/fitness/plans` | AI workout plans |
| GET, PATCH, DELETE | `/api/fitness/plans/[id]` | |
| PATCH | `/api/fitness/plans/[id]/days` | Edit plan days |
| GET, POST | `/api/fitness/plans/[id]/adjustments` | Adaptation-engine suggestions |
| GET, POST | `/api/fitness/sessions` | Workout sessions |
| POST | `/api/fitness/sessions/[id]` | Update/complete session (sets + reps in `sets_done`) |
| GET | `/api/fitness/exercises` | Exercise library (filters by muscle, equipment, type) |
| GET | `/api/fitness/programs` | Program catalog |
| GET | `/api/fitness/programs/[id]` | Program with weeks → sessions → exercises |
| POST, DELETE | `/api/fitness/programs/[id]/enroll` | Enroll / unenroll |
| POST | `/api/fitness/programs/[id]/progress` | Record session progress |
| GET, POST | `/api/fitness/logs` | |
| GET, POST | `/api/fitness/nutrition` | |
| GET, PATCH | `/api/fitness/diet/plan` | |
| GET, POST | `/api/fitness/water` | |
| GET, POST | `/api/fitness/body` | Body metrics |

## Skills

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/skills` | |
| GET | `/api/skills/[id]/roadmap` | |
| GET, PATCH | `/api/skills/[id]/milestones` | |
| PATCH | `/api/skills/[id]/topics` | |
| GET, POST | `/api/skills/[id]/sessions` | Study sessions |
| GET, POST | `/api/skills/tests` | AI-generated tests |
| GET, POST | `/api/skills/tests/[testId]/attempt` | |
| GET, POST | `/api/skills/resources/library` | Resource library |
| PATCH | `/api/milestones/[id]` | |
| POST | `/api/youtube/search` | YouTube search (mock data without `YOUTUBE_API_KEY`) |

## Gamification, Quests, Social

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/gamification` | GET: stats (expires stale dungeons). POST `{ action }`: `allocate_stat`, `spawn_dungeon`, `purchase_freeze` |
| GET | `/api/gamification/badges` | Badge catalog |
| GET | `/api/quests` | |
| POST | `/api/quests/generate` | AI quest generation |
| POST | `/api/quests/[id]/{accept,progress,complete,abandon}` | |
| GET | `/api/social/activities` · `/api/social/leaderboard` | (`/api/social` itself is a placeholder stub) |
| GET, POST | `/api/social/friends` | |

## Style, Notifications

| Method | Path |
| --- | --- |
| GET | `/api/style` (placeholder stub) |
| GET, POST | `/api/style/outfits` · `/api/style/moodboard` · `/api/style/recommendations` |
| GET | `/api/notifications` |
