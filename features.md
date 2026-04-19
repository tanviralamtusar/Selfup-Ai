# SelfUp — Features Specification

---

## V1 Features (Launch — 15 Days)

### 🔐 Authentication
- Email + password signup/login
- Google OAuth
- Email verification
- Password reset via email
- Supabase Auth (JWT managed by Supabase)
- Session persistence
- "Remember me" option

---

### 🚀 Onboarding (5–10 min AI Interview)
- Step 1: Basic info (name, age, gender, timezone)
- Step 2: Goal selection (fitness / skills / time / style — can select multiple)
- Step 3: AI asks dynamic follow-up questions per selected goals
  - Fitness: current weight, target weight, activity level, diet preference
  - Skills: what skill, current level, how many hours/week
  - Time: sleep schedule, work/study hours, biggest time-wasting habit
  - Style: body type, color preferences, current style description
- Step 4: AI generates initial plan on completion:
  - Day 1 schedule
  - First week roadmap
  - Starting quests
  - Character setup (RPG avatar or photo upload)
- Onboarding costs 0 AiCoins

---

### 🤖 AI System (Chat Mode)
- Full conversational AI powered by Gemma (Google AI Studio)
- AI persona: user-defined name + personality
- Cross-session memory (stores context in DB, injects into prompts)
- AI can:
  - Auto-schedule tasks for the day/week
  - Generate workout plans
  - Generate diet/meal charts
  - Generate skill roadmaps with YouTube resources
  - Analyze progress with detailed feedback
  - Suggest fashion/style improvements
  - Give motivational coaching
  - Answer any self-improvement question
- Proactive messages (can be turned ON/OFF by user):
  - Morning check-in
  - Evening review
  - Missed task alerts
  - Milestone celebrations
- Rate limit handling: when Gemma free tier limit hit → queue request → notify user → process when available
- Voice input (Web Speech API — browser native)
- Voice output (Web Speech Synthesis API — browser native)

---

### 📊 Dashboard Mode
- **Profile Card:**
  - RPG character (selectable avatars) OR user-uploaded photo
  - Username, level, XP bar
  - Current streak
  - Total AiCoins
  - Active quest count
- **Stats Overview:**
  - Fitness score
  - Skill progress
  - Time management score
  - Style score
  - Overall Life Score (combined)
- **Active Quests Panel** (next 3 quests)
- **Category Cards:** Fitness / Skills / Time / Style — click to open sub-dashboard
- **Recent Activity Feed**
- **Weekly Summary Card** (AI-generated every Monday)

---

### 🏋️ Fitness Module
- **Workout:**
  - AI-generated workout plan (based on onboarding data)
  - Manual workout logging
  - Exercise library (pre-built + custom)
  - Sets / reps / weight / duration tracking
  - Rest timer
  - Workout streak tracking
- **Nutrition:**
  - AI-generated meal/diet chart
  - Manual food logging
  - Calorie + macro tracking (user-defined targets)
  - Water intake tracking
- **Body Transformation:**
  - Optional daily photo upload (stored in Supabase Storage)
  - Weight/measurement logging over time
  - Progress graph
- **Stats:** Workout streak, total workouts, weight progress chart

---

### 🧠 Skills Module
- Add any custom skill (coding, music, language, etc.)
- AI generates full roadmap for each skill with:
  - Milestones
  - Time estimates
  - YouTube video recommendations (via YouTube Data API v3 — free)
- Progress tracking modes (user-defined per skill):
  - Time-based (hours logged)
  - Milestone-based (checklist)
  - Point-based (self-rated sessions)
- Daily/weekly skill goals
- Skill XP (contributes to overall level)
- Notes per skill session

---

### ⏰ Time Management Module
- **Tasks:**
  - Create tasks with priority (low / medium / high / critical)
  - Due date + time
  - Recurring tasks
  - Subtasks
  - AI auto-scheduling (AI assigns tasks to time slots)
- **Habits:**
  - Daily / weekly habits
  - Habit streak tracking
  - Visual habit calendar (GitHub-style heatmap)
- **Schedule:**
  - Daily view (time-blocked schedule)
  - Weekly view
  - Google Calendar sync (import/export)
  - Pomodoro timer (built-in, 25/5 default, customizable)
- **Do Not Disturb / Focus Hours** setting
- AI daily planning session (optional, every morning)

---

### 👗 Style Module
- Style profile setup (body type, color preferences, preferred aesthetic)
- AI fashion recommendations (text-based suggestions)
- Outfit log (what you wore, rate it)
- Style goals (e.g., "improve casual style in 30 days")
- AI weekly style tip
- Mood board (save images/links as inspiration)

---

### 🎮 Gamification System
- **XP + Levels:**
  - Earn XP by: completing tasks, logging workouts, skill sessions, habits, quests
  - Level up every X XP (scaling formula)
  - 50 levels in V1
- **AiCoin Economy:**
  - Earn: daily login (+5), complete task (+1–3), streak milestone (+10–50), complete quest (+20–100), daily photo upload (+2), weekly summary reviewed (+5)
  - Spend: chat message (1), AI auto-schedule (5), AI analysis report (10), AI roadmap generation (15)
  - Free users: 20 AiCoins/day cap (earnable + daily grant)
  - Pro users: 200 AiCoins/day cap + monthly bonus
- **Streaks:**
  - Per-category streaks (fitness, skills, time, style)
  - Overall streak
  - Lose streak if miss a day (with 1 streak-freeze item/week as protection)
- **Quests:**
  - Pre-built quest templates (e.g., "7-Day Workout Challenge", "Learn 1 Skill for 30 Days")
  - AI-generated personal quests
  - Solo quests + friend challenges
  - Quest completion = XP + AiCoins + badge
- **Badges:**
  - Achievement badges (first workout, 7-day streak, level 10, etc.)
  - Displayed on public profile
- **Leaderboard:**
  - Global leaderboard (ranked by: XP + streak + tasks combined score)
  - Friends leaderboard
  - Weekly + all-time rankings
- **Social:**
  - Public profile (username, level, badges, stats — if user allows)
  - Friends list (send/accept friend requests)
  - Challenge friends (e.g., "Who completes more workouts this week?")

---

### 🔔 Notifications
- Browser push notifications (Web Push API)
- Email reminders (Resend)
- User-configurable:
  - Which notifications to receive
  - Time preferences
  - Do Not Disturb hours
- Smart scheduling by AI (sends at optimal time based on behavior)
- Types:
  - Daily morning check-in
  - Task due reminders
  - Habit reminders
  - Streak about-to-break alerts
  - Quest completion
  - Friend challenge updates
  - Weekly AI summary

---

### 🌐 Screen Time (Browser Extension — V1)
- Chrome/Firefox extension
- User sets blocked websites list
- Focus mode: blocks distracting sites during scheduled focus sessions
- Extension syncs with SelfUp account (reads schedule from API)
- ON/OFF toggle per session

---

### 👤 User Settings
- Profile: photo, name, username, bio, timezone
- AI persona: name, personality style (friendly / strict / motivational)
- Theme: dark / light
- Notification preferences
- Privacy: public/private profile
- Data export (JSON)
- Account deletion
- AiCoin balance + purchase history
- Subscription management

---

## V2 Features (Future Updates)
- Android native app
- iOS native app
- Windows native app
- OS-level screen time control
- Wearable integration (Apple Watch, Fitbit, Google Fit)
- Custom LLM fine-tuning on user data
- Parental controls / family accounts
- Fashion integration (shopping links)
- Admin dashboard
- Deep behavioral analytics
- Marketing email campaigns
- GDPR/COPPA compliance tools
