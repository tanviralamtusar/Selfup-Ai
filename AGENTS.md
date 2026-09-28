# Repository Guidelines

## Project Structure & Module Organization

The application lives in `web/`; run Node commands from that directory. Route pages, layouts, and API handlers are in `web/src/app/` (including `(auth)`, `(protected)`, and `api/`). Reusable UI is in `web/src/components/`, domain and infrastructure code in `web/src/lib/`, global client state in `web/src/store/`, and shared types/constants in `web/src/types/` and `web/src/constants/`. Use `@/` for imports from `src/`. Static files belong in `web/public/`; operational scripts and seed data live in `web/scripts/`.

Read the applicable rules in `.agents/rules/` before changing frontend, backend, security-sensitive, or Git-related code. `docker-compose.yml` provides supporting local services such as Redis.

## Build, Test, and Development Commands

From `web/`:

- `npm install` installs locked dependencies.
- `npm run dev` starts the Turbopack development server.
- `npm run worker` starts the BullMQ background worker.
- `npm run lint` runs the Next.js ESLint configuration.
- `npm run build` creates a production build and performs TypeScript checks.
- `npm run seed:exercises` and `npm run seed:programs` populate development data when required.

There is no configured unit-test command yet. At minimum, run `npm run lint` and `npm run build` for code changes; manually exercise the affected route or API flow. Keep exploratory scripts in `web/scratch/` rather than application directories.

## Coding Style & Naming Conventions

Use TypeScript with strict compiler settings, 2-space indentation, semicolons, and the existing ESLint rules. Name React components in PascalCase (`WorkoutCard.tsx`), hooks `useX` (`useTasks.ts`), and services `<domain>.service.ts`. Keep components focused on presentation: put data access and business logic in service functions and TanStack Query hooks. Use Zustand only for truly global client state. Forms require React Hook Form plus Zod validation on both client and server.

## API, Security & Performance

Validate every incoming request with Zod, keep controllers/route handlers thin, and place database logic in typed services. Check ownership before reading, updating, or deleting user resources; never expose Supabase service-role credentials or commit `.env.local`. Paginate list endpoints, debounce search, and handle loading, error, and accessible UI states.

## Commits & Pull Requests

Follow the established Conventional Commit style: `feat: add daily check-in cron`, `fix: handle Redis restart`, or `refactor: extract coin service`. Branch from `develop` using `feature/<name>` or `fix/<name>`; reserve `main` for production. PRs should explain the user-visible change, link the issue when available, note configuration or migration needs, include screenshots for UI work, and state the validation commands run.
