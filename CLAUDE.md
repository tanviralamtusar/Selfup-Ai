# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The imported AGENTS.md covers the module map, conventions, current-state gotchas (Redis disabled, hidden nav items, XP rules) and the migration workflow. This file adds the commands and the cross-file flows that take several files to piece together.

## Commands

Run everything from `web/`:

```bash
npm run dev          # Next.js dev server (Turbopack), UI + /api on :3000
npm run lint         # ESLint (flat config, eslint-config-next)
npm run build        # production build; this is the only TypeScript check
npm run seed:exercises && npm run seed:programs   # fitness seed data (tsx scripts)
```

Android app, from `mobile/`:

```bash
npx expo start                        # dev server; open in Expo Go
npm run typecheck && npx expo lint
npx expo export --platform android    # full Metro/Hermes bundle — catches bad imports without a device
npx expo install <pkg>                # add mobile deps (SDK-matched versions)
```

Android releases are built by GitHub Actions (`.github/workflows/android-apk.yml`) on every push to `main` that touches `mobile/`; there's no local native build step.

There is no test runner in either project, so there is no way to run a single test. Validate with `lint` + `build`, then exercise the route or page by hand. Exploratory scripts go in `web/scratch/` (gitignored).

## Architecture: how a request flows

1. **Client auth state:** `store/authStore.ts` (Zustand `persist`) holds the Supabase `session` and `profile`. `app/(protected)/layout.tsx` redirects to `/login` or `/onboarding` on the client; there is no Next middleware.
2. **Client → API:** components and hooks call `fetch('/api/...')` with `Authorization: Bearer ${session.access_token}`.
3. **Route handler:** `verifyAuth(req)` (`lib/api-auth.ts`) resolves the user. The handler then builds a per-request Supabase client from the anon key **plus the caller's token**, so RLS scopes every query. Most routes inline a `getDb(req)` helper; Money centralizes it in `lib/money/server.ts` (`authed`, `getDb`). The service-role client is reserved for cross-user code: the scheduler, worker jobs, `model-config.ts`, `ai-actions.ts` and the seed scripts.

## Architecture: AI

- **Model calls:** `generateResponse(prompt, history, systemPrompt, model, taskType)` in `lib/gemma.ts` (Google GenAI SDK). `taskType` selects temperature and token limits from `TASK_PARAMS` in `lib/model-config.ts`. Each user's model choice comes from `getUserModelConfig()` (`user_profiles`). `buildSystemPrompt()` and the memory helpers in `lib/ai-memory.ts` assemble context.
- **Chat action protocol:** the model embeds `<action type="...">{json}</action>` tags in its reply. `parseActions()` in `lib/ai-actions.ts` strips them out and splits them into immediate actions (e.g. `update_memory`, run via `executeActions`) and confirmation actions (e.g. `create_daily`, `create_habit`, `create_todo`, `fitness_plan_generate`, `tasks_clear_all`). Confirmation actions are returned to the client, shown in `components/chat/ActionWidget.tsx`, and run through `POST /api/ai/chat/confirm` → `executeConfirmedAction()`. Payloads are validated in `lib/validations/ai-actions.ts`. A new action type needs a parser branch, a validator and an executor case.
- **Long jobs:** `addAiTask({ userId, type, payload })` (`lib/queue.ts`) calls `executeAiTask()` in `lib/worker.ts` **synchronously**. That function is a `switch` over `AiJobType` (plan generation, skill roadmaps/tests, memory extraction, embeddings, proactive alerts, weekly summaries). `src/instrumentation.ts` starts `lib/ai/scheduler.ts`, an hourly in-process loop that enqueues proactive-alert and weekly-summary jobs.

## Architecture: tasks and gamification

- **Three task types:** dailies, habits and to-dos (`api/dailies`, `api/habits`, `api/todos`). `TaskEconomyService` (`lib/task-economy.service.ts`) prices completions and penalties and delegates every XP/HP/coin change to `GamificationService`. All tuning numbers (XP rewards, HP damage, ranks, AiCoin earn/spend, streak freeze) are in `constants/gamification.ts`.
- **Cross-module injection:** fitness plans and skill roadmaps turn into dailies and habits. `lib/fitness/dailyInjector.ts` and `lib/skills/dailyInjector.ts` go through `TaskInjectionService` (`lib/task-injection.service.ts`), which deduplicates on title + category + source. `cleanupPlanTasks` removes them when a plan is updated or deleted (`api/fitness/plans/[id]`).
- **Day rollover:** handled client-side by `DayStartModal` → `/api/dailies/cron` (see AGENTS.md).

## Architecture: Android app offline sync

`mobile/` (Expo SDK 57, expo-router) is local-first.

- **Writes:** every action in `src/domain/actions.ts` calls `commitLocal()`, which writes the optimistic row (SQLite `records` table, JSON per row) and an `outbox` op in one transaction.
- **Flush:** `src/sync/engine.ts` replays the outbox FIFO against the website's `/api` with `Idempotency-Key: op_id`. Transient failures stop the flush and back off; 4xx rejections drop the op and land in `sync_failures`.
- **Pull:** reads the user's rows straight from Supabase (RLS) and replaces the cache, skipping rows that still have queued ops.
- **Realtime:** `postgres_changes` applies other devices' edits.
- **Day-scored ops:** daily completes and habit logs carry `action_date`. They are sent only when it equals the server's open day (`GET /api/dailies/cron` → `lastCronDate`); later days wait for the in-app check-in, and closed days are reported as failures.
- **Adding a synced table or action:** server route (wrapped, accepting a client `id`), realtime publication, `SYNCED_TABLES` + the `specs` list in `pullAll()`, an action in `actions.ts`, and an `onSuccess` case if the response should replace the local row.
- **SQLite writes:** everything goes through one connection behind a promise-chain lock (`withWriteLock` / `writeTransaction` in `src/db/database.ts`). Inside a transaction, pass the executor to `putRecord`/`patchRecord`/`removeRecord`. Calling them without it re-takes the lock and deadlocks.
- **Pull resilience:** the profile is fetched first (falling back to a direct `user_profiles` read when `/api/user` fails), and each table pulls independently via `Promise.allSettled`. Problems are collected into `lastError`, which is shown on the header, in Settings → Sync and in Settings → Connection → *Test connection*. `src/sync/api.ts` keeps the platform's real error text, so read it before guessing at sync bugs.
- **Reminders:** `src/lib/notifications.ts` rebuilds the OS notification schedule from local `dailies` / `todos` / `pomodoro_sessions`, debounced, on any change and on foreground. It's a pure function of synced data, so website-set times ring too. `scheduled_time` is a Postgres `TIME` interpreted as phone-local time.
- **Updates:** `src/lib/updater.ts` compares the latest GitHub Release tag `mobile-v<version>-b<build>` with the installed `versionCode` and installs via the package installer. The tag format and a public repo are load-bearing.
- **Build config:** `src/lib/env.ts` trims/unquotes `EXPO_PUBLIC_*` values. A pasted trailing newline in the API URL once broke all API calls on Android.

## Other docs

`Project-details-md/README.md` indexes the design docs and marks which are current. `api.md`, `environment.md`, `database_structure.md` and `money.md` are the up-to-date references. `.agents/rules/*.md` hold the frontend, backend, security, performance and Git rules.
