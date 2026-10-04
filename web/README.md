# SelfUp AI — Web App

The Next.js 16 app (UI and API routes) for SelfUp. The project overview, module list and setup are in the [root README](../README.md); contributor conventions are in [AGENTS.md](../AGENTS.md).

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Google AI keys
npm run dev                  # http://localhost:3000
```

## Layout

```text
src/
  app/
    (auth)/          login, signup, forgot-password
    (protected)/     dashboard, time, money, analysis, fitness, skills, style, quests, social, chat, settings
    onboarding/
    api/             route handlers (verifyAuth + Supabase as the user)
  components/<module>/
  lib/               services, AI client, hooks, money/fitness/skills logic
  store/             Zustand (auth, UI)
  types/, constants/
scripts/
  migrations/        idempotent SQL, run in the Supabase SQL editor
  seed-exercises.ts, seed-programs.ts
```

## Checks

No unit tests yet. Before pushing, run:

```bash
npm run lint
npm run build
```
