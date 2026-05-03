# SelfUp — 15-Day Development Plan

**Solo developer + AI IDE (Claude Code / Cursor)**  
**Stack:** React + Node.js + Supabase  
**Goal:** Full working web version deployed at selfup.botbhai.net

---

## Pre-Development (Day 0 — Before You Start)

- [ ] Create Supabase project
- [ ] Set up GitHub repository (monorepo: `frontend/` + `backend/`)
- [ ] Configure subdomain `selfup.botbhai.net` on Coolify VPS
- [ ] Get Google AI Studio API key (Gemma)
- [ ] Get Google OAuth credentials
- [ ] Get Resend API key
- [ ] Generate VAPID keys for Web Push (`npx web-push generate-vapid-keys`)
- [ ] Get YouTube Data API v3 key
- [ ] Install Redis on VPS (`apt install redis`)
- [ ] Create `.env` files from `.env.example`

---

## Day 1 — Project Scaffolding + Auth

**Morning (Frontend)**
- [ ] Create Vite + React + TS project
- [ ] Install all dependencies (TailwindCSS, shadcn/ui, Zustand, React Query, Router)
- [ ] Set up folder structure (all folders from `frontend.md`)
- [ ] Configure TailwindCSS with design system tokens from `design.md`
- [ ] Add dark/light theme support

**Afternoon (Backend)**
- [ ] Create Express + TS backend project
- [ ] Set up folder structure
- [ ] Configure Supabase admin client
- [ ] Set up Helmet, CORS, rate limiter middleware
- [ ] Configure Winston logger

**Evening (Database)**
- [ ] Run all SQL from `database_structure.md` in Supabase
- [ ] Set up RLS policies
- [ ] Create storage buckets
- [ ] Set up triggers (new user → create profile)
- [ ] Test Supabase connection from both frontend + backend

**Deliverable:** Project runs locally, DB connected, tables created.

---

## Day 2 — Authentication + Onboarding Shell

**Frontend**
- [ ] `LoginPage` — email + Google OAuth
- [ ] `SignupPage` — email registration
- [ ] `ForgotPasswordPage`
- [ ] Auth middleware (Supabase Auth + `authStore`)
- [ ] `AuthGuard` HOC for protected routes
- [ ] Route setup (all routes in `frontend.md`)

**Backend**
- [ ] Auth routes (`/api/auth/*`)
- [ ] Auth middleware (JWT verification)
- [ ] User profile CRUD endpoints

**Deliverable:** User can sign up, log in, log out. Google OAuth works.

---

## Day 3 — Onboarding Flow

**Frontend**
- [ ] `OnboardingShell` with step progress indicator
- [ ] `StepGoals` — multi-select goal cards
- [ ] `StepFitness`, `StepSkills`, `StepTime`, `StepStyle` — goal-specific questions
- [ ] `StepCharacter` — RPG avatar selector or photo upload
- [ ] AI persona name + personality picker

**Backend**
- [ ] `POST /api/onboarding/start` — save answers
- [ ] AI interview endpoint — Gemma generates follow-up questions dynamically
- [ ] `POST /api/onboarding/complete` — AI generates initial plan, marks onboarding done

**AI**
- [ ] Initial Gemma integration (`gemma.service.ts`)
- [ ] Onboarding plan prompt template
- [ ] Memory seeding from onboarding answers

**Deliverable:** Full onboarding flow working end-to-end.

---

## Day 4 — AppShell + Dashboard (Static)

**Frontend**
- [ ] `AppShell` — sidebar (desktop) + bottom nav (mobile)
- [ ] `TopBar` — logo, mode toggle, notification bell, avatar
- [ ] `Sidebar` — nav links, coin balance, level
- [ ] `MobileNav` — bottom bar
- [ ] `DashboardPage` layout — Profile card, stats, category cards
- [ ] `ProfileCard` — avatar, level, XP bar, streak, coins
- [ ] `StatsOverview` — 4 pillars + life score
- [ ] `CategoryGrid` — 4 category cards (static data)

**Backend**
- [ ] `GET /api/gamification/profile` — fetch user's XP, level, coins, streaks, badges

**Deliverable:** Dashboard renders with real user data. Looks good on desktop and mobile.

---

## Day 5 — AI Chat (Core)

**Frontend**
- [ ] `ChatPage` layout — conversation list + chat window
- [ ] `ChatWindow` — message list (scrollable)
- [ ] `ChatMessage` — assistant + user bubbles, markdown rendering
- [ ] `ChatInput` — text input + send button + coin cost display
- [ ] `VoiceButton` — Web Speech API input
- [ ] Typing indicator animation
- [ ] `ConversationList` — sidebar history

**Backend**
- [ ] `POST /api/ai/chat` — full pipeline: context build → Gemma call → response
- [ ] `context.service.ts` — builds system prompt with memory + stats
- [ ] `memory.service.ts` — read/write ai_memory
- [ ] `coins.service.ts` — deduct 1 coin per message
- [ ] Conversation CRUD endpoints

**Deliverable:** Full AI chat working. Memory persists across sessions. Coins deducted correctly.

---

## Day 6 — AI Queue + Actions + Voice Output

**Frontend**
- [ ] Queue status polling (when request is queued, show "waiting..." state)
- [ ] Voice output toggle (Web Speech Synthesis)
- [ ] AI action result rendering (when AI schedules a task, show confirmation)

**Backend**
- [ ] `queue.service.ts` — Bull queue setup
- [ ] `queueWorker.ts` — processes pending requests when rate limit clears
- [ ] `POST /api/ai/actions/schedule` — AI auto-schedules day (5 coins)
- [ ] `POST /api/ai/actions/analyze` — AI generates analysis report (10 coins)
- [ ] `POST /api/ai/actions/roadmap` — AI generates skill roadmap (15 coins)
- [ ] Action parsing — extract `<action>` XML from AI responses + execute

**Deliverable:** AI chat handles rate limits gracefully. AI can create tasks/schedules automatically.

---

## Day 7 — Time Management Module

**Frontend**
- [ ] `TimePage` with 4 tabs: Tasks / Habits / Schedule / Pomodoro
- [ ] `TaskCard` + `TaskForm` — create, edit, complete tasks
- [ ] Priority colors, due date picker
- [ ] `HabitTracker` — daily check-in grid
- [ ] `HabitHeatmap` — GitHub-style calendar
- [ ] `DaySchedule` — time-blocked day view
- [ ] `PomodoroTimer` — work/break cycles, task linkage

**Backend**
- [ ] Tasks CRUD (`/api/tasks/*`) + complete endpoint (awards XP + coins)
- [ ] Habits CRUD + log endpoint
- [ ] Habit history endpoint (for heatmap)
- [ ] Pomodoro session logging

**Deliverable:** Full time management module working.

---

## Day 8 — Fitness Module

**Frontend**
- [ ] `FitnessPage` with tabs: Workout / Nutrition / Body / Progress
- [ ] `WorkoutCard` — today's plan display
- [ ] `ExerciseLogger` — log sets/reps/weight, rest timer
- [ ] `NutritionLogger` — meal entry form, macro progress bars
- [ ] `WaterTracker` — quick add buttons
- [ ] `BodyMetricsChart` — line graph (Recharts)
- [ ] `PhotoProgress` — optional photo upload + gallery

**Backend**
- [ ] Workout plan CRUD
- [ ] Workout log endpoints
- [ ] Food log CRUD
- [ ] Water log endpoints
- [ ] Body metrics CRUD + photo upload (Supabase Storage)
- [ ] Exercise library endpoints

**Deliverable:** Full fitness tracking working.

---

## Day 9 — Skills Module

**Frontend**
- [ ] `SkillsPage` — skill card grid
- [ ] `SkillDetailPage` — roadmap view, session logging, heatmap
- [ ] `RoadmapView` — milestone list with YouTube links
- [ ] `MilestoneItem` — checkable, expandable
- [ ] `SessionLogger` — log time/points + mood

**Backend**
- [ ] Skills CRUD
- [ ] Roadmap + milestones endpoints
- [ ] Skill session logging (awards XP + updates streak)
- [ ] YouTube search integration (for roadmap resources)

**Deliverable:** Skills module fully working. AI generates roadmaps.

---

## Day 10 — Style Module + Gamification Core

**Frontend (Style)**
- [ ] `StylePage` — profile, recommendations, outfit log, moodboard
- [ ] `StyleProfile` setup form
- [ ] `RecommendationCard` — AI advice cards
- [ ] `OutfitLogCard` — daily outfit entry
- [ ] `Moodboard` — image/link collection

**Frontend (Gamification)**
- [ ] `QuestCard` + `QuestsPage`
- [ ] `BadgeGrid`
- [ ] `LevelUpModal` — animated celebration
- [ ] XP bar animations
- [ ] AiCoin earn animations

**Backend**
- [ ] Style CRUD endpoints
- [ ] Style AI recommendation endpoint
- [ ] Quests CRUD + join/complete/abandon
- [ ] Badge award system
- [ ] XP + level-up logic in `gamification.service.ts`
- [ ] Coin earn transactions on task/habit/workout completion

**Deliverable:** Style module + full gamification economy working.

---

## Day 11 — Social Features + Notifications

**Frontend (Social)**
- [ ] `LeaderboardPage` — global + friends, weekly + all-time
- [ ] `FriendsPage` — list, search, friend request
- [ ] `PublicProfilePage` — badges, stats, challenge button
- [ ] `ChallengeCard`

**Frontend (Notifications)**
- [ ] `NotificationBell` with unread badge
- [ ] `NotificationPanel` dropdown
- [ ] Web Push subscription setup (service worker)

**Backend**
- [ ] Friends CRUD (`/api/social/friends/*`)
- [ ] Challenges endpoints
- [ ] Leaderboard calculation
- [ ] User search (`/api/users/search`)
- [ ] Push notification service (web-push)
- [ ] Email notification service (Resend)
- [ ] Notification settings endpoints
- [ ] `POST /api/notifications/subscribe` — save push subscription

**Deliverable:** Friends, challenges, leaderboard, and push notifications all working.

---

## Day 12 — Cron Jobs + Proactive AI

**Backend**
- [ ] `morningCheckin.job.ts` — sends AI morning message to users who opted in
- [ ] `eveningReview.job.ts` — AI evening summary
- [ ] `weeklyReport.job.ts` — weekly AI summary for all users (Monday)
- [ ] `streakCheck.job.ts` — detect broken streaks, send alert notifications
- [ ] `coinRefill.job.ts` — grant daily 20 coins to free users
- [ ] `queueWorker.ts` — poll and process AI queue items
- [ ] `leaderboardCalc.job.ts` — hourly score recalculation
- [ ] Register all jobs in `scheduler.ts`

**Deliverable:** Automated AI messaging, streak alerts, daily coin refills all working.

---

## Day 13 — Settings + User Account

**Frontend**
- [ ] `SettingsPage` — all 8 sections
- [ ] Profile edit form + avatar upload
- [ ] Notification preferences (all toggles + DND hours)
- [ ] Theme toggle wiring
- [ ] AI persona settings
- [ ] Google Calendar OAuth connect button
- [ ] Data export download
- [ ] Account deletion flow (confirmation dialog)
- [ ] Subscription section (current plan display)

**Backend**
- [ ] Profile update endpoint
- [ ] Notification settings CRUD
- [ ] Data export endpoint (aggregate all user data → JSON)
- [ ] Account deletion (cascade via DB + Supabase Auth)
- [ ] Google Calendar OAuth flow + sync endpoint
- [ ] Subscription management (manual for now, upgrade to payment later)

**Deliverable:** Full settings page working. Calendar sync working.

---

## Day 14 — Polish, Bug Fixes, Performance

**Frontend**
- [ ] Loading skeletons on all data-fetching components
- [ ] Empty states for all lists (no tasks, no skills, etc.)
- [ ] Error states + retry buttons
- [ ] Confirm dialogs for all destructive actions
- [ ] Mobile layout QA — test all pages on 375px
- [ ] Animation review — XP gain, level up, coin earn
- [ ] PWA manifest + service worker
- [ ] Lazy loading all pages (React.lazy)
- [ ] Page transition animations

**Backend**
- [ ] Audit all endpoints — add missing validation
- [ ] Ensure all DB queries use RLS
- [ ] Add request logging
- [ ] Error handling audit

**Deliverable:** App feels polished. No obvious bugs. Looks good on mobile.

---

## Day 15 — Deployment + Testing

**Deployment (Coolify VPS)**
- [ ] Set up two services in Coolify:
  - `selfup-frontend` (static build served via Nginx)
  - `selfup-backend` (Node.js service on port 3000)
- [ ] Configure environment variables in Coolify dashboard
- [ ] Set up subdomain routing: `selfup.botbhai.net` → frontend, `/api` → backend
- [ ] Enable SSL (Let's Encrypt via Coolify)
- [ ] Run DB migrations on production Supabase
- [ ] Test Redis on VPS

**Final Testing**
- [ ] Full user journey: signup → onboarding → dashboard → chat → workout → task → quest
- [ ] Test on mobile (real device)
- [ ] Test dark/light mode
- [ ] Test AI chat with queue (manually trigger rate limit)
- [ ] Test friend request + challenge flow
- [ ] Test push notifications
- [ ] Test data export
- [ ] Test account deletion

**Deliverable:** Live at `selfup.botbhai.net` ✅

---

## Priority Order (If Running Out of Time)
1. Auth + Onboarding ← non-negotiable
2. AI Chat ← core differentiator
3. Dashboard ← first thing users see
4. Time Management ← most used daily
5. Gamification (XP/coins/quests) ← retention
6. Fitness ← high value
7. Skills ← high value
8. Notifications ← needed for retention
9. Social (leaderboard/friends) ← nice to have
10. Style ← can ship with minimal implementation

---

## Post-Launch (Week 3+)
- User feedback collection
- Bug fixes from real usage
- Add payment gateway (SSLCommerz for Bangladesh)
- Admin panel (basic user list)
- Analytics dashboard
- Start V2 planning (Android app)
