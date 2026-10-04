# SelfUp — Setup & Deployment Instructions

> **Last synced with code:** 2026-10-04. SelfUp is a single Next.js 16 app in `web/` that serves both the UI and the API. The earlier split into a Vite frontend plus an Express backend no longer applies.

---

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project
- A Google AI Studio API key (<https://aistudio.google.com/apikey>)
- Optional: a YouTube Data API v3 key

### 1. Install

```bash
git clone https://github.com/tanviralamtusar/Selfup-Ai.git
cd Selfup-Ai/web
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values; see [environment.md](environment.md).

### 3. Database

1. The base schema already exists in the Supabase project (see [database_structure.md](database_structure.md)).
2. Run each file in `web/scripts/migrations/` in the Supabase **SQL editor**. They are idempotent, so re-running is safe:
   `add_exercise_media_columns.sql`, `add_exercise_attributes.sql`, `create_programs.sql`, `create_money.sql`, `add_day_cron.sql`, `add_mobile_sync.sql`.
3. Because they are applied through the editor, they will **not** appear in Supabase's migration history. Check `information_schema.columns` / `tables` to confirm they ran.
4. Seed fitness data as needed:

   ```bash
   npm run seed:exercises   # free-exercise-db library (873 exercises) + attribute backfill
   npm run seed:programs    # sample multi-week programs
   ```

### 4. Run

```bash
npm run dev      # http://localhost:3000 (UI + /api)
```

No separate worker or Redis is needed: Redis is disabled and AI jobs run synchronously through `addAiTask()`. `src/instrumentation.ts` starts an hourly in-process loop for proactive alerts and weekly summaries.

### 5. Validate changes

```bash
npm run lint
npm run build    # includes the TypeScript check
```

There is no unit-test suite yet, so exercise the affected page or API flow manually.

---

## Production Deployment (Coolify VPS)

Deployment uses `docker-compose.yml` at the repo root, which builds `web/Dockerfile`: a multi-stage `node:20-alpine` image serving on port 3000, with a `wget` healthcheck on `/`.

1. In Coolify, create a **Docker Compose** resource from the GitHub repo (`main` branch).
2. In the Environment tab, add the variables from [environment.md](environment.md). The four `NEXT_PUBLIC_*` values used as build args must be present **before** building.
3. Point the domain (e.g. an `A` record for `selfup` → VPS IP) and enable Let's Encrypt in Coolify.
4. Deploy. Pushes to `main` redeploy.

### Supabase auth URLs

Supabase → Authentication → URL Configuration:

```text
Site URL: https://<your-domain>
Redirect URLs: https://<your-domain>/**
```

### Verify

Open the site, sign up, finish onboarding, and complete a daily. Then confirm that the XP bar moves and that the next day's check-in modal appears.

---

## Database Backups

- Supabase free tier: daily backups (7-day retention); Pro tier: point-in-time recovery.
- Manual: `pg_dump "postgresql://postgres:[password]@db.<project-ref>.supabase.co:5432/postgres" > backup.sql`

## Monitoring

- Coolify dashboard: container CPU/RAM and logs.
- App logs go to stdout (`console.*`, tagged like `[Gemma]`, `[Queue Bypass]`, `[Pathfinder Scheduler]`).

---

## Common Issues

**AI calls failing / rate-limited**
`generateResponse()` retries once on `gemini-2.5-flash`. If both attempts fail, check `GOOGLE_AI_API_KEY` and AI Studio quotas. Per-user model choice is stored on `user_profiles` (`getUserModelConfig()` in `lib/model-config.ts`).

**"Column does not exist" errors (e.g. `last_cron_date`, `current_streak`, `exercise_type`)**
A migration from `web/scripts/migrations/` hasn't been run on this database. Run it in the SQL editor.

**XP granted twice on double-click**
The unique index `xp_transactions_source_uniq` from `add_day_cron.sql` is missing.

**Supabase RLS blocking queries**
API routes query as the user, so RLS applies. Check the table's policies before reaching for the service-role key. Use that key only for genuinely cross-user work, and never in the browser.

**`npm run worker` logs "Redis connection missing. Worker will not start."**
Expected: Redis is disabled, so jobs run in-process and the worker isn't needed.
