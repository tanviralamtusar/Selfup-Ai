# SelfUp — Architecture Decisions

---

## Why This Stack Was Chosen

### Frontend: React + Vite (not Next.js)
- You already have React experience
- Vite is faster than CRA and simpler than Next.js
- This is a SPA (Single Page App) — no SEO needed for authenticated content
- SSR (Next.js) would add complexity with no real benefit here
- **When to switch to Next.js:** If you add a public marketing page or need SEO

### Styling: TailwindCSS + shadcn/ui (not plain CSS or MUI)
- Tailwind = fastest styling for solo developer
- shadcn/ui = unstyled accessible components you own (no style conflicts)
- No CSS bundle bloat — only used classes are included
- Dark mode is trivial with Tailwind `dark:` variants

### State: Zustand (not Redux/Context)
- Redux is overkill for this project size
- Context causes too many re-renders
- Zustand is simple, TypeScript-friendly, tiny bundle
- TanStack Query handles server/async state — Zustand only handles client state

### Database: Supabase (not MongoDB/Firebase)
- You already have Supabase experience
- PostgreSQL gives proper relational integrity — critical for complex relationships
- Supabase includes Auth, Storage, Realtime, and Edge Functions
- Free tier is generous (500MB DB, 1GB storage, 50k MAU)
- RLS (Row Level Security) = built-in authorization at DB level
- **Advantage over Firebase:** SQL queries, proper JOINs, no vendor lock-in

### Backend: Node.js + Express (not Next.js API routes or Fastify)
- Keeps frontend and backend cleanly separated
- Easier to reason about cron jobs and Bull queues as standalone service
- Fastify would be marginally faster but Express ecosystem is more familiar
- Separate deployment on Coolify = can scale independently

### AI Queue: Bull + Redis (not simple retry)
- Gemma free tier has strict rate limits — must queue overflow
- Bull is battle-tested for job queues, has retry logic built in
- Redis is already needed for session caching and leaderboard
- Alternative: pg-boss (PostgreSQL-based) — simpler but Redis is better for queues

### Deployment: Coolify on VPS (not Vercel/Railway)
- You already have a Coolify VPS — zero additional cost
- 16GB RAM / 4 Core = more than enough for 20-50 users
- Full control over Redis, background jobs, cron
- **When to migrate to managed hosting:** When traffic exceeds VPS capacity or DevOps time becomes a problem

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  Browser → React SPA (selfup.botbhai.net)               │
│  Chrome Extension (screen time blocker)                 │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                    COOLIFY VPS                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Nginx (Reverse Proxy)               │   │
│  │  /       → Frontend (static files)              │   │
│  │  /api/*  → Backend (port 3000)                  │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────▼──────────────┐                       │
│  │   Node.js + Express API     │                       │
│  │   - Auth middleware         │                       │
│  │   - Route handlers          │                       │
│  │   - Services layer          │                       │
│  │   - Cron jobs (node-cron)   │                       │
│  └──────┬──────────────┬───────┘                       │
│         │              │                                │
│  ┌──────▼──────┐ ┌─────▼──────────────────────────┐   │
│  │    Redis    │ │          Supabase Cloud          │   │
│  │  Bull Queue │ │  PostgreSQL + Auth + Storage     │   │
│  │  Cache      │ │  + Realtime                      │   │
│  └─────────────┘ └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
             ┌───────────▼──────────────┐
             │    External Services      │
             │  Google AI Studio (Gemma) │
             │  Google OAuth/Calendar    │
             │  YouTube Data API         │
             │  Resend (Email)           │
             └───────────────────────────┘
```

---

## Data Flow Examples

### User Sends AI Chat Message
```
1. User types message → clicks send
2. Frontend: check coin balance (Zustand) → if 0, show upgrade modal
3. Frontend: POST /api/ai/chat { message, conversation_id }
   → shows typing indicator
4. Backend auth middleware: verify JWT → attach user to req
5. coinCheck middleware: verify user has ≥1 coin
6. ai.controller → ai.service.chat()
7. context.service: fetch user memory + today's tasks + profile → build system prompt
8. gemma.service: call Google AI Studio API
   → success: return response text
   → rate limit: add to Bull queue → return 202 { queue_id }
9. If success:
   → Parse action tags from response → execute actions
   → Save message to ai_messages table
   → Update ai_memory if needed
   → Deduct 1 coin → log transaction
   → Award XP if applicable
10. Return { message, coins_remaining, actions_executed }
11. Frontend: render AI message → play voice if enabled → update coin display
```

### User Completes a Task
```
1. User clicks ✓ on task card
2. Frontend: optimistic update (task shows as done immediately)
3. PATCH /api/tasks/:id/complete
4. Backend:
   → verify task belongs to user
   → update task status = 'done', completed_at = now()
   → gamification.service.awardXP(userId, task.xp_reward)
     → update user_profiles.xp
     → check if level up → if yes: update level, send notification
   → coins.service.earn(userId, task.coin_reward, 'task_complete')
   → gamification.service.updateQuestProgress(userId, { type: 'task_complete' })
   → check overall streak → update if needed
5. Return { xp_earned, coins_earned, new_level?: number }
6. Frontend: show XP floating animation, coin earn animation
   → if level_up: show LevelUpModal
```

---

## Scalability Notes (For Future Reference)

### Current Setup (0–500 users)
- Single VPS handles everything comfortably
- Supabase free tier sufficient
- No caching needed beyond Redis queue

### 500–5,000 users
- Upgrade Supabase to Pro ($25/month) — more connections, PITR
- Add Redis caching for leaderboard + user profile
- Consider Read Replicas for heavy analytics queries

### 5,000–50,000 users
- Split frontend/backend to separate services
- Add CDN (Cloudflare) for static assets
- Separate Redis to managed service (Upstash)
- Switch AI to paid Gemini Pro API (much higher rate limits)
- Database connection pooling (PgBouncer)

### 50,000+ users
- Microservices split (AI service, notifications service, gamification service)
- Kubernetes on Coolify or migrate to managed cloud (AWS/GCP)
- Consider custom fine-tuned LLM for cost efficiency
- Real-time features via dedicated WebSocket server

---

## Known Technical Limitations (V1)

1. **AI rate limits** — Gemma free tier (1,500 req/day) may bottleneck if many users active simultaneously. Queue mitigates but doesn't eliminate delay.

2. **Screen time control** — Browser extension only. OS-level blocking not possible in web app. Users must install extension manually.

3. **Voice input/output** — Browser Web Speech API varies by browser. Best in Chrome. Not available in all browsers.

4. **Google Calendar sync** — OAuth tokens expire; refresh token rotation needed. Complex edge cases when user revokes access.

5. **Push notifications** — Require HTTPS + service worker. Won't work in incognito mode. iOS Safari has limitations (requires iOS 16.4+).

6. **Offline support** — No offline mode in V1. All features require internet connection.

7. **Payment** — No payment gateway in V1. Pro subscriptions managed manually. SSLCommerz integration needed for V2 (Bangladesh-local payment).
