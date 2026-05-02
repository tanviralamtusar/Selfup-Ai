# SelfUp — Frontend Architecture

---

## Tech Stack

| Tool | Purpose | Version |
|------|---------|---------|
| React | UI framework | 18 |
| Vite | Build tool | 5 |
| TypeScript | Type safety | 5 |
| TailwindCSS | Styling | 3 |
| shadcn/ui | Component library | latest |
| Zustand | Global state | 4 |
| TanStack Query | Server state + caching | 5 |
| React Router | Routing | 6 |
| Supabase JS | Auth + DB + Storage | 2 |
| Framer Motion | Animations | 11 |
| Recharts | Charts and graphs | 2 |
| React Hook Form | Forms | 7 |
| Zod | Schema validation | 3 |
| date-fns | Date utilities | 3 |
| Lucide React | Icons | latest |
| Sonner | Toast notifications | latest |

---

## Folder Structure

```
frontend/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (Web Push)
│   └── icons/                 # App icons
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                # Root with Router + Providers
│   │
│   ├── constants/
│   │   ├── app.ts             # APP_NAME, APP_URL, etc.
│   │   ├── routes.ts          # All route paths
│   │   ├── ai.ts              # AI coin costs, limits
│   │   └── gamification.ts    # XP formula, level thresholds
│   │
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── queryClient.ts     # TanStack Query config
│   │   ├── utils.ts           # cn(), formatDate(), etc.
│   │   └── validations/       # Zod schemas per domain
│   │       ├── auth.ts
│   │       ├── task.ts
│   │       ├── fitness.ts
│   │       └── ...
│   │
│   ├── types/
│   │   ├── database.ts        # Supabase generated types
│   │   ├── api.ts             # API response types
│   │   └── ui.ts              # UI-specific types
│   │
│   ├── store/                 # Zustand stores
│   │   ├── authStore.ts       # User session, profile
│   │   ├── uiStore.ts         # Theme, mode, sidebar state
│   │   ├── aiStore.ts         # AI conversation state
│   │   ├── timerStore.ts      # Pomodoro timer (real-time)
│   │   └── notifStore.ts      # Local notification queue
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAI.ts           # AI chat + credit management
│   │   ├── useTasks.ts
│   │   ├── useHabits.ts
│   │   ├── useFitness.ts
│   │   ├── useSkills.ts
│   │   ├── useGamification.ts
│   │   ├── useLeaderboard.ts
│   │   ├── useNotifications.ts
│   │   ├── useVoice.ts        # Web Speech API
│   │   ├── usePomodoro.ts
│   │   └── useTheme.ts
│   │
│   ├── services/              # API call functions
│   │   ├── api.ts             # Base axios/fetch instance
│   │   ├── auth.service.ts
│   │   ├── ai.service.ts
│   │   ├── tasks.service.ts
│   │   ├── fitness.service.ts
│   │   ├── skills.service.ts
│   │   ├── gamification.service.ts
│   │   └── notifications.service.ts
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui base components (do not edit)
│   │   │
│   │   ├── common/            # Shared app-level components
│   │   │   ├── AiCoinBadge.tsx
│   │   │   ├── XPBar.tsx
│   │   │   ├── StreakBadge.tsx
│   │   │   ├── LevelBadge.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── PageHeader.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # Main layout wrapper
│   │   │   ├── Sidebar.tsx        # Desktop sidebar
│   │   │   ├── MobileNav.tsx      # Bottom nav bar
│   │   │   ├── TopBar.tsx         # Top header
│   │   │   ├── ModeToggle.tsx     # Chat ↔ Dashboard toggle
│   │   │   └── NotificationBell.tsx
│   │   │
│   │   ├── ai/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx      # Text + voice input
│   │   │   ├── VoiceButton.tsx
│   │   │   ├── CoinCostBadge.tsx  # Shows cost before sending
│   │   │   └── ConversationList.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── QuestPanel.tsx
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── WeeklySummaryCard.tsx
│   │   │
│   │   ├── fitness/
│   │   │   ├── WorkoutCard.tsx
│   │   │   ├── ExerciseLogger.tsx
│   │   │   ├── NutritionLogger.tsx
│   │   │   ├── BodyMetricsChart.tsx
│   │   │   ├── PhotoProgress.tsx
│   │   │   └── WaterTracker.tsx
│   │   │
│   │   ├── skills/
│   │   │   ├── SkillCard.tsx
│   │   │   ├── RoadmapView.tsx
│   │   │   ├── MilestoneItem.tsx
│   │   │   ├── SessionLogger.tsx
│   │   │   └── SkillHeatmap.tsx
│   │   │
│   │   ├── time/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── HabitTracker.tsx
│   │   │   ├── HabitHeatmap.tsx
│   │   │   ├── DaySchedule.tsx
│   │   │   ├── WeekCalendar.tsx
│   │   │   └── PomodoroTimer.tsx
│   │   │
│   │   ├── style/
│   │   │   ├── StyleProfile.tsx
│   │   │   ├── OutfitLogCard.tsx
│   │   │   ├── Moodboard.tsx
│   │   │   └── RecommendationCard.tsx
│   │   │
│   │   ├── gamification/
│   │   │   ├── QuestCard.tsx
│   │   │   ├── BadgeGrid.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── FriendsList.tsx
│   │   │   ├── ChallengeCard.tsx
│   │   │   └── LevelUpModal.tsx
│   │   │
│   │   └── onboarding/
│   │       ├── OnboardingShell.tsx
│   │       ├── StepGoals.tsx
│   │       ├── StepFitness.tsx
│   │       ├── StepSkills.tsx
│   │       ├── StepTime.tsx
│   │       ├── StepStyle.tsx
│   │       ├── StepCharacter.tsx
│   │       └── StepAIInterview.tsx  # AI-driven Q&A
│   │
│   └── pages/
│       ├── auth/
│       │   ├── LoginPage.tsx
│       │   ├── SignupPage.tsx
│       │   └── ForgotPasswordPage.tsx
│       │
│       ├── onboarding/
│       │   └── OnboardingPage.tsx
│       │
│       ├── dashboard/
│       │   └── DashboardPage.tsx
│       │
│       ├── chat/
│       │   └── ChatPage.tsx
│       │
│       ├── fitness/
│       │   ├── FitnessPage.tsx
│       │   ├── WorkoutPlanPage.tsx
│       │   └── NutritionPage.tsx
│       │
│       ├── skills/
│       │   ├── SkillsPage.tsx
│       │   └── SkillDetailPage.tsx
│       │
│       ├── time/
│       │   ├── TimePage.tsx
│       │   └── CalendarPage.tsx
│       │
│       ├── style/
│       │   └── StylePage.tsx
│       │
│       ├── social/
│       │   ├── LeaderboardPage.tsx
│       │   ├── FriendsPage.tsx
│       │   └── PublicProfilePage.tsx
│       │
│       ├── quests/
│       │   └── QuestsPage.tsx
│       │
│       ├── settings/
│       │   └── SettingsPage.tsx
│       │
│       └── NotFoundPage.tsx
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## State Management Strategy

### Zustand Stores (Client State)
```ts
// authStore — persisted
{
  user: User | null,
  profile: UserProfile | null,
  session: Session | null,
  isLoading: boolean
}

// uiStore — not persisted
{
  mode: 'chat' | 'dashboard',
  sidebarOpen: boolean,
  activeCategory: 'fitness' | 'skills' | 'time' | 'style' | null,
  theme: 'dark' | 'light'
}

// aiStore — partially persisted
{
  activeConversationId: string | null,
  pendingMessage: string,
  isTyping: boolean,
  coinBalance: number,
  queuedRequests: QueueItem[]
}

// timerStore — not persisted
{
  mode: 'work' | 'break' | 'idle',
  timeLeft: number,
  isRunning: boolean,
  taskId: string | null
}
```

### TanStack Query (Server State)
- All DB data fetched via React Query
- Optimistic updates for tasks and habits
- Cache invalidation strategy documented per feature
- Query keys: `['tasks', userId]`, `['fitness', userId, date]`, etc.

---

## Routing Structure

```
/                        → redirect to /dashboard or /login
/login                   → LoginPage
/signup                  → SignupPage
/forgot-password         → ForgotPasswordPage
/onboarding              → OnboardingPage (protected, only if !onboarding_done)
/dashboard               → DashboardPage (protected)
/chat                    → ChatPage (protected)
/fitness                 → FitnessPage (protected)
/fitness/workout         → WorkoutPlanPage
/fitness/nutrition       → NutritionPage
/skills                  → SkillsPage
/skills/:skillId         → SkillDetailPage
/time                    → TimePage
/time/calendar           → CalendarPage
/style                   → StylePage
/quests                  → QuestsPage
/social/leaderboard      → LeaderboardPage
/social/friends          → FriendsPage
/u/:username             → PublicProfilePage
/settings                → SettingsPage
*                        → NotFoundPage
```

---

## Key Patterns

### API Calls
```ts
// All API calls go through services/api.ts
// Uses fetch with base URL from env
const api = {
  get: (url) => fetch(`${BASE_URL}${url}`, { headers: authHeaders() }),
  post: (url, body) => fetch(...)
}
```

### Protected Routes
```tsx
// All app routes wrapped in <AuthGuard>
// Redirects to /login if no session
// Redirects to /onboarding if !onboarding_done
```

### Error Handling
- Global error boundary
- Toast notifications via Sonner for user-facing errors
- Console logging only in development
- Sentry integration (V2)

### Voice Input
```ts
// Uses Web Speech API (no external dependency)
const recognition = new webkitSpeechRecognition()
recognition.lang = 'en-US'  // user can switch to bn-BD
recognition.onresult = (e) => setChatInput(e.results[0][0].transcript)
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=https://selfup.botbhai.net/api
VITE_APP_NAME=SelfUp
VITE_VAPID_PUBLIC_KEY=     # Web Push
```

---

## Build & Run

```bash
# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

---

## Performance Rules
- Lazy load all page components (`React.lazy`)
- Images: use Supabase Storage CDN URL + width param
- Charts: only render when tab is active
- AI chat: virtualize message list (react-virtual) if > 50 messages
- Avoid re-renders: memoize expensive components
