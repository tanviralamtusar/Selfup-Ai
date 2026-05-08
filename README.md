# SelfUp AI — Personal Life-Operating System

SelfUp is an AI-powered personal development platform designed to help users (primarily age 10–30) optimize their lives through four core pillars: Fitness, Skills, Time Management, and Style. It combines the conversational power of AI with the engaging nature of gamified dashboards.

> **"If someone uses this app properly, they can change their life entirely."**

---

## 🚀 Core Pillars

| Pillar | Description |
| :--- | :--- |
| **🏋️ Fitness** | Personalized workout plans, meal/calorie tracking, and body transformation logs. |
| **🧠 Skills** | AI-generated roadmaps for learning any skill, integrated with YouTube and progress tracking. |
| **⏰ Time** | Task management, habit tracking, auto-scheduling, and Pomodoro timers. |
| **👗 Style** | Fashion recommendations and personal style profile management. |

---

## 🎭 Two Interactive Modes

SelfUp offers two distinct ways to interact with your data:

- **Chat Mode**: A full conversational AI interface (powered by Google's Gemma) that can understand your goals, update your tasks, and generate plans via natural language.
- **Dashboard Mode**: A Habitica-style visual interface for a quick overview of your profile, stats, active quests, and roadmaps.

---

## 🛠️ Tech Stack

### Frontend & Core
- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack)
- **UI Library**: [React 19](https://reactjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + Custom Design System
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Infrastructure
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI Engine**: Google AI Studio (Gemma)
- **Background Tasks**: [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)
- **Email**: [Resend](https://resend.com/)
- **Deployment**: [Coolify](https://coolify.io/) on VPS

---

## ✨ Key Features

- **Background AI Processing**: Large tasks like fitness plan generation and skill roadmaps run in the background. An **Activity Tracker** in the header provides real-time status updates (Processing, Done, Failed).
- **Gamification**: Earn **AiCoins** and XP to level up. Complete daily quests and maintain streaks to build consistency.
- **AI Memory**: The system remembers your preferences, progress, and previous conversations to provide highly personalized advice.
- **Automatic Scheduling**: Let the AI organize your day based on your habits and priorities.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+
- Redis (for BullMQ)
- Supabase Project
- Google AI Studio API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tanviralamtusar/Selfup-Ai.git
   cd Selfup-Ai
   ```

2. **Install dependencies**:
   ```bash
   cd web
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` in the `web` directory with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GOOGLE_AI_API_KEY=your_google_ai_key
   REDIS_URL=redis://localhost:6379
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Run the background worker**:
   ```bash
   npm run worker
   ```

---

## 📜 Development Rules & Guidelines

This project follows strict architectural rules defined in the `.agents/` directory. 
- **Frontend**: No business logic in components; use custom hooks.
- **Backend**: No business logic in controllers; all logic stays in services.
- **Security**: Always verify resource ownership; never expose the service role key to the frontend.

---

## 🗺️ Roadmap

- [x] V1 Core Web Implementation
- [ ] V2 Mobile Apps (Android/iOS)
- [ ] V2 Desktop App (Windows)
- [ ] V3 Deep Analytics & Parental Controls

---

Developed with ❤️ by the SelfUp Team.
