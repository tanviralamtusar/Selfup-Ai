# SelfUp — Layout Specification

---

## Global Shell Layout

### Desktop
```
┌─────────────────────────────────────────────┐
│ TopBar [Logo] [Mode Toggle] [Notif] [Avatar]│  60px
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │   Main Content Area              │
│ 240px    │   (scrollable)                   │
│          │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### Mobile
```
┌─────────────────────────────┐
│ TopBar [Logo] [Notif] [≡]  │  56px
├─────────────────────────────┤
│                             │
│   Main Content Area         │
│   (scrollable)              │
│                             │
├─────────────────────────────┤
│ [🏠][🤖][📊][⚔️][👤]       │  64px Bottom Nav
└─────────────────────────────┘
```

---

## Sidebar (Desktop)

```
┌──────────────────┐
│ 🌀 SelfUp        │  Logo
├──────────────────┤
│ [Chat/Dashboard] │  Mode Toggle (pill switch)
├──────────────────┤
│                  │
│ 🏠 Dashboard     │
│ 🤖 AI Chat       │
│ ─────────────── │
│ 🏋️ Fitness       │
│ 🧠 Skills        │
│ ⏰ Time          │
│ 👗 Style         │
│ ─────────────── │
│ ⚔️  Quests       │
│ 🏆 Leaderboard   │
│ 👥 Friends       │
├──────────────────┤
│ 🪙 420 AiCoins   │  Coin balance
│ ⚡ Level 7       │  Level + XP mini bar
├──────────────────┤
│ ⚙️  Settings     │
└──────────────────┘
```

---

## Dashboard Page

### Desktop Layout
```
┌─────────────────────────────────────────────────────┐
│ Profile Card (left)     │  Stats Overview (right)   │
│ [Avatar + Name + Level] │  [Life Score + 4 pillars] │
│ [Streak + Coins]        │                           │
├─────────────────────────────────────────────────────┤
│ Active Quests (3 cards, horizontal scroll on mobile)│
├─────────────────────────────────────────────────────┤
│  Fitness Card  │  Skills Card  │  Time Card │ Style │
│  (click→page)  │  (click→page) │ (click→pg) │ card  │
├─────────────────────────────────────────────────────┤
│ Recent Activity Feed    │  Weekly Summary (AI card) │
└─────────────────────────────────────────────────────┘
```

### Profile Card Component
```
┌─────────────────────────┐
│  [RPG Avatar / Photo]   │
│  @username    Level 7   │
│  ██████████░░ 680/1000  │  XP Bar
│  🔥 14 day streak       │
│  🪙 420 AiCoins         │
│  [5 badges shown]       │
└─────────────────────────┘
```

### Category Card
```
┌────────────────────┐
│ 🏋️ Fitness         │
│ Score: 78/100      │
│ ████████░░         │
│ Today: 1 workout   │
│ Streak: 🔥 5 days  │
│ [View Details →]   │
└────────────────────┘
```

---

## Chat Page (Chat Mode)

```
┌──────────────────────────────────────────────┐
│ [← Back]  💬 Chat with Aria      [New Chat]  │
├──────────────────────────────────────────────┤
│ Conversations List │ Chat Window              │
│ (collapsible on   │                          │
│  mobile)          │  [Assistant message]     │
│                   │                          │
│ • Today           │     [User message]       │
│   Chat #1         │                          │
│   Chat #2         │  [Assistant message]     │
│                   │  typing... ●●●           │
│ • Yesterday       │                          │
│   Chat #3         │                          │
│                   │                          │
│                   ├──────────────────────────┤
│                   │ 🎙️ [Type a message...] ▶ │
│                   │    🪙 1 coin              │
└───────────────────┴──────────────────────────┘
```

**Chat Input bar:**
```
┌──────────────────────────────────────┐
│ [🎙️] [Type message...         ] [▶] │
│ Cost: 🪙 1 • Balance: 420           │
└──────────────────────────────────────┘
```

---

## Fitness Page

```
┌─────────────────────────────────────────┐
│ 🏋️ Fitness         [🤖 AI Plan]        │
├─────────────────────────────────────────┤
│ [Workout] [Nutrition] [Body] [Progress] │  Tab bar
├─────────────────────────────────────────┤

WORKOUT TAB:
│ Today's Workout: Push Day              │
│ ┌─────────────────────────────────┐   │
│ │ Bench Press   3×10  80kg  ✓     │   │
│ │ Shoulder Press 3×12  40kg  ...  │   │
│ └─────────────────────────────────┘   │
│ [+ Log Exercise]  [Complete Workout]  │

NUTRITION TAB:
│ Today: 1420 / 2200 kcal              │
│ P: 89g  C: 156g  F: 44g              │
│ [Breakfast][Lunch][Dinner][Snack]    │
│ [+ Add Food]                         │
│ 💧 Water: 1.2L / 2.5L  [+250ml]    │

BODY TAB:
│ Weight: 72.5 kg (+1.2 from start)   │
│ [Progress Chart - line graph]        │
│ [Upload Today's Photo] (optional)   │
│ [Measurements log]                  │
```

---

## Skills Page

```
┌──────────────────────────────────────────┐
│ 🧠 Skills                [+ Add Skill]  │
├──────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│ │ Python  │  │ Guitar  │  │ Arabic  │  │
│ │ ████░░  │  │ ██░░░░  │  │ ███░░░  │  │
│ │ 42 hrs  │  │ 12 hrs  │  │ 28 hrs  │  │
│ │ 🔥 7   │  │ 🔥 2   │  │ 🔥 14  │  │
│ └─────────┘  └─────────┘  └─────────┘  │

SKILL DETAIL PAGE:
│ Python                  Level 3          │
│ 42 hrs total            🔥 7 day streak  │
│                                          │
│ ROADMAP:                                 │
│ ✅ Week 1: Basics                        │
│ ✅ Week 2: Functions & OOP               │
│ 🔲 Week 3: Libraries (current)          │
│   📺 YouTube resource linked             │
│ 🔲 Week 4: Projects                     │
│                                          │
│ [Log Session Today]  [🤖 Update Roadmap]│
│                                          │
│ Activity Heatmap (GitHub-style)          │
└──────────────────────────────────────────┘
```

---

## Time Management Page

```
TABS: [Tasks] [Habits] [Schedule] [Pomodoro]

TASKS TAB:
│ ┌──────────────────────────────────────┐ │
│ │ Today      Tomorrow     Upcoming    │ │
│ │ ─────────────────────────────────── │ │
│ │ ● [CRITICAL] Submit assignment  9am │ │
│ │ ● [HIGH]     Gym workout        7pm │ │
│ │ ✓ [MED]      Read chapter 3        │ │
│ └──────────────────────────────────── │
│ [+ Task]              [🤖 AI Schedule] │

HABITS TAB:
│ Daily Habits           Week: Mon-Sun    │
│ 🌅 Morning routine  ✓ ✓ ✓ ✓ ✓ _ _  │
│ 📚 Read 30 min     ✓ ✓ _ ✓ ✓ _ _  │
│ 💧 8 glasses water ✓ _ ✓ ✓ ✓ _ _  │
│                                        │

SCHEDULE TAB (Day View):
│ 06:00  ─────────────────               │
│ 07:00  [Morning Routine — 30min]       │
│ 08:00  [Breakfast]                     │
│ 09:00  [Study: Python — 2hrs] ████    │
│ 11:00  ─────────────────               │

POMODORO TAB:
│         ⏱  23:45                       │
│         [WORK SESSION]                  │
│         Task: Study Python              │
│    [▶ Start]  [⏸ Pause]  [⏹ Reset]   │
│    Round 1 of 4                        │
```

---

## Quests Page

```
┌──────────────────────────────────────────┐
│ ⚔️ Quests           [Browse Available]  │
├──────────────────────────────────────────┤
│ ACTIVE QUESTS                           │
│ ┌──────────────────────────────────┐   │
│ │ 💪 7-Day Workout Challenge  Day 4│   │
│ │ ████████░░░░░░  4/7 complete    │   │
│ │ Reward: 🪙100 + 500 XP          │   │
│ │ [View Details]    3 days left   │   │
│ └──────────────────────────────────┘   │
│                                        │
│ AVAILABLE QUESTS                       │
│ [Daily][Weekly][Skills][Fitness][Challenges]│
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 📚 Read for 7 Days              │   │
│ │ Reward: 🪙 50 + Badge           │   │
│ │ [Accept Quest]                  │   │
│ └──────────────────────────────────┘   │

CHALLENGE SECTION:
│ 👥 Friend Challenges                   │
│ Ahmed challenged you: "Most workouts   │
│ this week"  Ends in 4 days             │
│ You: 3  vs  Ahmed: 5                   │
│ [Accept] [Decline]                     │
└────────────────────────────────────────┘
```

---

## Leaderboard Page

```
┌──────────────────────────────────────────┐
│ 🏆 Leaderboard                          │
│ [Global] [Friends]    [Weekly][All Time] │
├──────────────────────────────────────────┤
│ 🥇  RifatX        ████████  12,450 pts │
│ 🥈  NahidPro      ███████   11,200 pts │
│ 🥉  AiMaster99    ██████    10,800 pts │
│ 4.  StudyGod      █████      9,400 pts │
│ 5.  FitBeast      █████      9,100 pts │
│ ─────────────────────────────────────── │
│                  ...                    │
│ ─────────────────────────────────────── │
│ 24. YOU ↑ ⭐    ████       6,200 pts  │  Highlighted
└──────────────────────────────────────────┘
```

---

## Onboarding Flow

```
Step 1: Welcome + Name + Age + Gender + Timezone
  ↓
Step 2: Goal Selection (multi-select cards)
  [🏋️ Fitness] [🧠 Skills] [⏰ Time] [👗 Style]
  ↓
Step 3: AI Interview (conversational UI for each goal)
  AI: "What's your main fitness goal?"
  User: [Free text or quick-select options]
  ↓ (continues dynamically, 5-10 min total)
Step 4: Character Customization
  [Choose RPG Avatar] or [Upload Photo]
  Name your AI assistant
  Pick personality: Friendly / Strict / Motivational
  ↓
Step 5: AI Plan Generation (loading screen with progress)
  "Building your roadmap..."
  "Creating Day 1 schedule..."
  "Setting up your quests..."
  ↓
Step 6: Plan Preview → [Start Your Journey 🚀]
```

---

## Settings Page

```
SECTIONS:
├── Profile (name, username, bio, avatar, timezone)
├── AI Assistant (persona name, personality, proactive on/off)
├── Appearance (dark/light, language)
├── Notifications (toggle each type, time preferences, DND)
├── Privacy (public/private profile)
├── Integrations (Google Calendar)
├── Data & Export (export JSON, delete account)
└── Subscription (current plan, upgrade/manage)
```

---

## Public Profile Page

```
┌────────────────────────────────────┐
│ [Avatar]  RifatX                   │
│           Level 12  🔥 45 streak   │
│           "Building a better me"   │
├────────────────────────────────────┤
│ 🏆 12,450 pts  │ 📅 Joined Jan 25  │
├────────────────────────────────────┤
│ BADGES:                            │
│ [🏅][🏅][⭐][🔥][💪][🧠][...]   │
├────────────────────────────────────┤
│ STATS:  Fitness 82 │ Skills 71     │
│         Time 68    │ Style 55      │
├────────────────────────────────────┤
│ [Add Friend]   [Challenge]         │
└────────────────────────────────────┘
```

---

## Notification Panel (Dropdown from bell icon)

```
┌──────────────────────────────┐
│ Notifications   [Mark all ✓]│
├──────────────────────────────┤
│ 🔥 Streak at risk! Log a    │
│    habit before midnight     │
│    5 min ago                 │
├──────────────────────────────┤
│ ⚔️  Ahmed challenged you!   │
│    2 hours ago               │
├──────────────────────────────┤
│ 🎉 Level Up! You're now     │
│    Level 8                   │
│    Today                     │
└──────────────────────────────┘
```
