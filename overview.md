# SelfUp — Project Overview

> **Working name:** SelfUp  
> **URL:** selfup.botbhai.net  
> **Type:** Freemium SaaS — Self-Improvement Platform  
> **Primary Market:** Bangladesh (age 10–30)  
> **Goal:** If someone uses this app properly, they can change their life entirely.

---

## App Name Options
| Name | Notes |
|------|-------|
| **SelfUp** ✅ | Matches subdomain. Clean. Recommended. |
| AscendX | Premium/startup feel |
| GlowUp | Viral with 10-30 age group |
| UpQuest | Gamification-forward |
| RisePath | Journey/roadmap feel |

Change the name in: `frontend/src/constants/app.ts` → `APP_NAME`

---

## Core Concept
SelfUp is an AI-powered personal life-operating system. It manages four pillars of human development:

| Pillar | What it does |
|--------|-------------|
| 🏋️ Fitness | Workout plans, meal/calorie tracking, body transformation tracking |
| 🧠 Skills | Custom skill roadmaps, learning tracking, YouTube integration |
| ⏰ Time Management | Task management, habit tracking, scheduling, Pomodoro, calendar sync |
| 👗 Style | Fashion recommendations, personal style profile |

---

## Two Core Modes
| Mode | Description |
|------|-------------|
| **Chat Mode** | Full conversational AI — like Claude/ChatGPT — manages everything via conversation |
| **Dashboard Mode** | Habitica-style visual dashboard — profile, stats, quests, roadmaps, categories |

Both modes are available to all users. User can switch anytime.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Router | React Router v6 |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI | Google AI Studio — Gemma (free tier → paid later) |
| Email | Resend (free tier) |
| Queue | Bull + Redis (for AI rate-limit queue) |
| Deployment | Coolify VPS (16GB RAM, 4 Core) |
| Domain | selfup.botbhai.net |

---

## Monetization
| Tier | Price | AI Credits/day |
|------|-------|---------------|
| Free | 0 BDT | 20 AiCoins/day |
| Pro | 200 BDT/month | Unlimited + extra AiCoins |

**AiCoin** = in-app AI currency. Used for: chat messages, auto-scheduling, analysis, roadmap generation.

---

## Phase Plan
- **V1 (Days 1–15):** Full working web version — core features, AI, gamification
- **V2 (Future):** Android/iOS app, Windows app, OS-level screen time, wearables, custom LLM
- **V3 (Future):** Admin dashboard, deep analytics, parental controls
