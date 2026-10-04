# Repository Guidelines

## Project Structure & Module Organization

The application is a single Next.js 16 app in `web/`; run Node commands from that directory. Route pages, layouts, and API handlers are in `web/src/app/` (including `(auth)`, `(protected)`, and `api/`). Reusable UI is in `web/src/components/<module>/`, domain and infrastructure code in `web/src/lib/`, global client state in `web/src/store/`, and shared types/constants in `web/src/types/` and `web/src/constants/`. Use `@/` for imports from `src/`. Static files belong in `web/public/`; operational scripts, seed data, and SQL migrations live in `web/scripts/`.

The Android app is an Expo / React Native project in `mobile/` (run its commands from that directory; see `mobile/README.md`). It is offline-first: it keeps a local SQLite copy of the user's data, queues every change in an outbox, and replays the queue through the website's `/api` routes when online. It never writes to Supabase directly.

Read the applicable rules in `.agents/rules/` before changing frontend, backend, security-sensitive, or Git-related code. Design specs and reference docs are in `Project-details-md/` — check its `README.md` index first, since many of those files describe planned designs rather than the current code. `docker-compose.yml` and `web/Dockerfile` describe the production container deployed by Coolify.

### Module map

| Module | Page | API | Logic |
| --- | --- | --- | --- |
| Dashboard (habits/dailies/todos) | `(protected)/dashboard` | `api/habits`, `api/dailies`, `api/todos`, `api/tasks` | `lib/task-economy.service.ts`, `lib/hooks/use{Habits,Dailies,Todos}.ts` |
| Time | `(protected)/time` | `api/time`, `api/pomodoro`, `api/calendar` | `components/time/`, `lib/hooks/` |
| Money | `(protected)/money` | `api/money/*` | `lib/money/{client,server,format}.ts`, `types/money.ts` |
| Analysis | `(protected)/analysis` | `api/user/*`, `api/gamification` | `lib/attribute.service.ts` |
| Fitness | `(protected)/fitness` | `api/fitness/*` (plans, sessions, programs, exercises) | `lib/fitness/`, `types/fitness.ts` |
| Skills | `(protected)/skills` | `api/skills/*` | `lib/skills/`, `types/skills.ts` |
| Gamification | — | `api/gamification`, `api/dailies/cron`, `api/quests` | `lib/gamification.service.ts`, `constants/gamification.ts` |
| AI | `(protected)/chat` | `api/ai/*` | `lib/gemma.ts`, `lib/model-config.ts`, `lib/ai-memory.ts`, `lib/worker.ts`, `lib/ai/` |

Navigation lives in `web/src/components/layout/AppShell.tsx`. Chat, Fitness, Skills, Style, Quests and Social are implemented but hidden via `temporarilyHiddenNavItems`; their routes still work.

## Current-State Notes

- **Auth**: route protection is client-side in `(protected)/layout.tsx` (redirects to login/onboarding); there is no Next middleware. API routes authenticate with `verifyAuth()` from `@/lib/api-auth`, which reads the `Authorization: Bearer <token>` header, and then query Supabase as the user so RLS applies. `lib/client.ts`, `lib/server.ts` and `lib/middleware.ts` (SSR helpers using a publishable key) are currently unused.
- **Background jobs**: Redis is disabled (`lib/redis.ts` exports `null`). `addAiTask()` in `lib/queue.ts` runs the job synchronously inside the caller via `executeAiTask()` in `lib/worker.ts`, and `npm run worker` just logs that it won't start. Don't add code that assumes a live queue. `src/instrumentation.ts` also starts an in-process hourly `setInterval` loop (`lib/ai/scheduler.ts`) that runs proactive-alert checks and weekly summaries for up to 100 users.
- **AI**: call `generateResponse()` from `lib/gemma.ts`. It retries once on `gemini-2.5-flash` if the primary model fails. Per-task generation params are in `TASK_PARAMS` (`lib/model-config.ts`).
- **XP**: route every XP, coin, HP and level change through `GamificationService`; never write `user_profiles.xp`/`level` directly. `TaskEconomyService` delegates to it. Pass a task `category` to `awardXp` instead of pre-multiplying attribute bonuses. Idempotency relies on the unique index on `xp_transactions (user_id, source_type, source_id)`. Do not reintroduce the `increment_user_xp` RPC; it never existed in the database.
- **Daily reset**: `GET/POST /api/dailies/cron`, driven by `DayStartModal`, rolls the day per user using `user_profiles.last_cron_date`. The reset only runs when the user next opens the app; there is no scheduled server job for it.
- **Money**: amounts are always positive and `type` gives the sign. Account balances are computed (opening balance + Σ transactions), never stored.
- **Mobile sync contract** (don't break it when editing these routes): mutation routes the app replays are wrapped in `idempotent()` (`lib/idempotency.ts`), so a repeated `Idempotency-Key` returns the stored response instead of re-running. Create routes accept a client-generated `id` (`clientId()` / `existingOnDuplicate()`). `dailies/[id]/complete` and `habits/[id]/log` accept a `date` so offline completions score on the day they happened. When you add a mutation the app uses, wrap it the same way.
- **Realtime**: synced tables are in the `supabase_realtime` publication (`add_mobile_sync.sql`). Website pages refresh through `useRealtimeRefresh()` (`lib/hooks/useRealtimeRefresh.ts`); the protected layout keeps the profile (XP/HP) live.

## Build, Test, and Development Commands

From `web/`:

- `npm install` installs locked dependencies.
- `npm run dev` starts the Turbopack development server.
- `npm run lint` runs the Next.js ESLint configuration.
- `npm run build` creates a production build and performs TypeScript checks.
- `npm run seed:exercises` and `npm run seed:programs` populate fitness data when required.
- `npm run worker` starts the BullMQ worker. It won't start while Redis is disabled.

From `mobile/`: `npx expo start` (dev, Expo Go), `npm run typecheck`, `npx expo lint`, `npx expo export --platform android` (bundle check), `eas build -p android --profile preview` (APK).

There is no configured unit-test command yet. At minimum, run `npm run lint` and `npm run build` for code changes; manually exercise the affected route or API flow. Keep exploratory scripts in `web/scratch/` rather than application directories.

## Database Changes

Add schema changes as an idempotent SQL file in `web/scripts/migrations/` (`IF NOT EXISTS`, with RLS policies for any new user-owned table). They are applied by running them in the Supabase SQL editor, or through the Supabase MCP once it is authenticated to project `qpfdxyskjirdmkayuvly`. They do not show up in Supabase's migration history, so verify against `information_schema`. Update `Project-details-md/database_structure.md` when you add tables or columns.

## Coding Style & Naming Conventions

Use TypeScript with strict compiler settings, 2-space indentation, semicolons, and the existing ESLint rules. Name React components in PascalCase (`WorkoutCard.tsx`), hooks `useX` (`useTasks.ts`), and services `<domain>.service.ts`. Keep components focused on presentation: put data access and business logic in service functions and TanStack Query hooks. Use Zustand only for truly global client state. Forms require React Hook Form plus Zod validation on both client and server.

## API, Security & Performance

Validate every incoming request with Zod, keep controllers/route handlers thin, and place database logic in typed services. Check ownership before reading, updating, or deleting user resources; never expose Supabase service-role credentials or commit `.env.local`. Paginate list endpoints, debounce search, and handle loading, error, and accessible UI states.

## Commits & Pull Requests

Follow the established Conventional Commit style: `feat: add daily check-in cron`, `fix: handle Redis restart`, or `refactor: extract coin service`. `main` is production (Coolify deploys it). Work happens on module branches (such as `fitness-v2` or `skills-v2`) or on `feature/<name>` / `fix/<name>`, and is merged into `main` through a PR. No `develop` branch currently exists. PRs should explain the user-visible change, link the issue when available, note configuration or migration needs, include screenshots for UI work, and state the validation commands run.

## Knowledge Graph

`graphify-out/` (gitignored) holds a graphify knowledge graph of the codebase; see `.agents/rules/graphify.md`. Run `graphify update .` from the repo root after code changes.
