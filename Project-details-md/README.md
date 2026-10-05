# Project-details-md — Index

Design specs and reference docs for SelfUp. Many of these were written in April–May 2026, when the plan was a React + Vite SPA with a separate Express backend. The app was instead built as a single **Next.js 16** app in `web/`, so check this index before trusting a doc.

For the current repo map and gotchas, start with [`../AGENTS.md`](../AGENTS.md).

**Legend:** ✅ Current, synced with the code (date noted) · 📐 Design spec (intent is still valid; implementation details may differ) · 🗄️ Historical (superseded; kept for context)

## Reference — reflects the code

| Doc | Status | Notes |
| --- | --- | --- |
| [api.md](api.md) | ✅ 2026-10-04 | Inventory of every `/api` route handler |
| [environment.md](environment.md) | ✅ 2026-10-04 | Every env var the code reads |
| [instruction.md](instruction.md) | ✅ 2026-10-04 | Local setup, migrations, Coolify deploy, common issues |
| [money.md](money.md) | ✅ 2026-10-04 | Money module: data rules, API, XP |
| [../mobile/README.md](../mobile/README.md) | ✅ 2026-10-05 | Android app: features, install, build & release, in-app updates, reminders, offline-sync design, troubleshooting |
| [database_structure.md](database_structure.md) | ✅ partial, 2026-10-04 | §14–17 come from migrations; §1–13 are the V1 design. Lists undocumented tables |
| [FEATURE_STATUS_REPORT.md](FEATURE_STATUS_REPORT.md) | ✅ 2026-10-04 update on top | April snapshot kept below it |
| [onboarding.md](onboarding.md) | 📐 | Written against `web/src/app/onboarding/page.tsx` (May 2026); not re-verified |

## Module design specs

| Doc | Status | Notes |
| --- | --- | --- |
| [ai_system_v3.md](ai_system_v3.md) | 📐 | Pathfinder Engine v3, the latest AI design. BullMQ parts don't apply while Redis is disabled |
| [fitness_system_v2.md](fitness_system_v2.md) | 📐 | Has a 2026-10-04 implementation note (workout-cool port, programs) |
| [skills_system_v2.md](skills_system_v2.md) | 📐 | Skills v2 (Scholar Protocol) |
| [task_system_architecture.md](task_system_architecture.md) | 📐 | Dailies / habits / to-dos and the cross-module task layer (v2.1) |
| [gamification_redesign.md](gamification_redesign.md) | 📐 | RPG edition: attributes, HP, ranks, dungeons |
| [gamification.md](gamification.md) | 📐 | Has 2026-10-04 notes on the as-built XP pipeline. Numbers live in `web/src/constants/gamification.ts` |
| [system_vitals_manual.md](system_vitals_manual.md) | 📐 | XP / MP / HP mechanics |
| [tasking_system.md](tasking_system.md) | 📐 | RPG framing of the task economy |
| [AI_MEMORY_SYSTEM.md](AI_MEMORY_SYSTEM.md), [AI_MEMORY_IMPLEMENTATION.md](AI_MEMORY_IMPLEMENTATION.md), [WORK_COMPLETED.md](WORK_COMPLETED.md) | 📐 | Cross-session AI memory (`lib/ai-memory.ts`) |

## Product & UX

| Doc | Status | Notes |
| --- | --- | --- |
| [overview.md](overview.md) | 📐 | Vision, market, naming |
| [features.md](features.md) | 📐 | V1/V2 feature list. Money isn't in it; see `money.md` |
| [design.md](design.md) | 📐 | Design system principles |
| [layout.md](layout.md) | 📐 | Original shell layout. The real shell is `components/layout/AppShell.tsx` |
| [extension.md](extension.md) | 📐 not built | Browser extension spec |

## Historical / superseded

| Doc | Superseded by |
| --- | --- |
| [architecture.md](architecture.md) | Next.js monolith; see `../AGENTS.md`. This doc argues for React + Vite + Express |
| [backend.md](backend.md) | `.agents/rules/backend-rules.md` + `api.md` (Express design) |
| [frontend.md](frontend.md) | `.agents/rules/frontend-rules.md` (React 18 + Vite design) |
| [rules.md](rules.md) | `.agents/rules/*` + `../AGENTS.md` |
| [planning.md](planning.md) | Original 15-day build plan |
| [ai_system.md](ai_system.md), [current ai system.md](current%20ai%20system.md) | `ai_system_v3.md` |
| [fitness details.md](fitness%20details.md) | `fitness_system_v2.md` |
| [skills details.md](skills%20details.md) | `skills_system_v2.md` |

## Keeping these docs current

- Added a table or column? Update `database_structure.md`.
- Added or changed an API route? Update `api.md`.
- Added an env var? Update `environment.md` and `web/.env.example`.
- Finished or reshaped a feature? Add a dated note to `FEATURE_STATUS_REPORT.md`.
