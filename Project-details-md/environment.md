# SelfUp — Environment Variables Reference

> **Last synced with code:** 2026-10-04. This list covers every `process.env.*` read in `web/src` and `web/scripts`.
> The template is `web/.env.example`. Copy it to `web/.env.local` for local dev; in production set the values in Coolify's Environment tab.

---

## Variables

| Variable | Required | Exposed to browser | Used by |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Every Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Browser client (`lib/supabase.ts`) and user-scoped server clients in API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No, never** | Admin client for cross-user work: `lib/ai/scheduler.ts`, `lib/model-config.ts`, worker jobs, seed scripts |
| `GOOGLE_AI_API_KEY` | Yes | No | `lib/gemma.ts` (all generation and embeddings) |
| `NEXT_PUBLIC_APP_URL` | Production | Yes | Absolute app URL; Docker build arg |
| `NEXT_PUBLIC_API_BASE_URL` | Production | Yes | Absolute API URL; Docker build arg |
| `YOUTUBE_API_KEY` | No | No | `api/youtube/search`, `lib/skills/resourceResolver.ts`. Without it, search returns mock data |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No (unused) | Yes | Only read by `lib/client.ts`, `lib/server.ts` and `lib/middleware.ts`, which nothing imports. Set it if you wire up those SSR helpers |

`NODE_ENV` and `NEXT_RUNTIME` are set by Node/Next.

## Android app (`mobile/.env`)

| Variable | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Same as `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same as `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_API_URL` | Website origin the app syncs through, no trailing slash (HTTPS for release builds) |

All three are inlined into the app bundle at build time. Template: `mobile/.env.example`.

## Build-time vs runtime

`NEXT_PUBLIC_*` values are inlined into the client bundle at **build time**. The Dockerfile takes `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as build args (wired in `docker-compose.yml`), so changing them requires a rebuild, not just a restart.

## Not currently used

Earlier versions of this doc listed `REDIS_URL`, `RESEND_API_KEY`, `VAPID_*`, `GOOGLE_CLIENT_ID/SECRET`, `SUPABASE_JWT_SECRET` and `GEMMA_MODEL`. None of these are read by the code today:

- **Redis** is disabled (`lib/redis.ts` exports `null`). Re-enabling BullMQ will need `REDIS_URL` again.
- **Email (Resend)** and **web push (`web-push`)** are installed dependencies but are not wired up.
- **Google OAuth / Calendar** is not implemented.
- **Model choice** is per-user in the database (`lib/model-config.ts`), not an env var.

## Local example

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
GOOGLE_AI_API_KEY="..."
YOUTUBE_API_KEY=""
```
