# SelfUp — Gamification System Redesign
> **Version:** 2.0 — RPG Edition  
> **Philosophy:** Solo Leveling × Habitica × The Greatest Estate Developer  
> **Core Emotions:** Urgency · Curiosity · Belonging  
> **Target:** Bangladesh, age 10–30

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Vital Resources — XP, HP, AiCoins](#2-vital-resources)
3. [Attribute System — STR / INT / AGI / VIT / CHA](#3-attribute-system)
4. [Rank & Level Progression](#4-rank--level-progression)
5. [Onboarding — System Awakening](#5-onboarding--system-awakening)
6. [Quest System](#6-quest-system)
7. [Dungeon System](#7-dungeon-system)
8. [Urgency Mechanics](#8-urgency-mechanics)
9. [Curiosity Mechanics](#9-curiosity-mechanics)
10. [Guild System](#10-guild-system)
11. [Co-op Quest Types](#11-co-op-quest-types)
12. [Penalty & Recovery Rework](#12-penalty--recovery-rework)
13. [Badge System](#13-badge-system)
14. [Leaderboard System](#14-leaderboard-system)
15. [AiCoin Economy](#15-aicoin-economy)
16. [Streak System](#16-streak-system)
17. [Notification Strategy](#17-notification-strategy)
18. [Implementation Priority](#18-implementation-priority)

---

## 1. System Overview

SelfUp is not a productivity app. It is a **life RPG**. Every real-world action the user takes is translated into in-world System events. The tone, language, and UI must consistently reinforce this. The user is not "completing tasks" — they are **clearing quests**. They are not "missing habits" — their **Vessel is taking damage**. This framing is what separates SelfUp from every other habit tracker.

### Design Pillars

| Pillar | Emotion | Mechanism |
|--------|---------|-----------|
| **Urgency** | Fear of loss | Dungeons expire, streaks decay, HP drops, levels regress |
| **Curiosity** | Need to discover | Locked skills, secret badges, SSS mystery, System Caches |
| **Belonging** | Social obligation | Guilds, co-op quests, guild feed, Accountability Pacts |
| **Pride** | Identity investment | Rank badges, public profile, title progression, stat cards |

### What Was Removed
- **MP (Mana Points)** — removed entirely. It created a confusing third resource with no clear real-world analog. AI access is now governed cleanly by AiCoins.
- **System Lockdown** — replaced with a graduated penalty cascade that keeps the user engaged even at low HP.

### What Was Added
- **CHA (Charisma)** attribute — governs social/guild power
- **Dungeon System** — time-limited high-reward challenges (urgency centerpiece)
- **Guild System** — guilds, raids, co-op quests, guild leveling
- **System Caches** — earned loot drops (never purchasable)
- **Level Regression** — losing 1 level at HP 0, framed as a narrative event with comeback path

---

## 2. Vital Resources

The system runs on exactly **three resources**. Each has a distinct purpose and a distinct real-world analog.

### 2.1 XP — Experience Points
> *"The measure of your growth. The fuel of your Ascension."*

XP is the primary progression currency. It accumulates from every meaningful action and drives level-ups and rank advancement. XP is **never lost** directly — it is preserved even when the player loses a level (level regression reduces current-level progress, not total lifetime XP).

**XP Earn Table (Complete)**

| Action | Base XP | STR Bonus | INT Bonus | AGI Bonus | Notes |
|--------|---------|-----------|-----------|-----------|-------|
| Complete low-priority task | 5 | — | — | — | |
| Complete medium-priority task | 10 | — | — | — | |
| Complete high-priority task | 20 | — | — | — | |
| Complete critical task | 35 | — | — | — | |
| Complete habit (per habit) | 5 | — | — | — | Multiplied by STR if physical |
| Log workout session | 25 | +2% per STR pt | — | — | |
| Log 30-min skill session | 15 | — | +2% per INT pt | — | |
| Log skill session + milestone | 50 | — | +2% per INT pt | — | |
| Complete daily quest | 50–100 | — | — | — | |
| Complete weekly quest | 150–300 | — | — | — | |
| Complete monthly quest | 500–1000 | — | — | — | |
| Clear D-rank Dungeon | 200 | — | — | — | Solo |
| Clear C-rank Dungeon | 350 | — | — | — | Solo or Duo |
| Clear A-rank Dungeon | 600 | — | — | — | Guild co-op |
| Clear S-rank Raid | 1200 | — | — | — | Guild raid |
| 7-day streak milestone | 100 | — | — | — | |
| 14-day streak milestone | 200 | — | — | — | |
| 30-day streak milestone | 500 | — | — | — | |
| 100-day streak milestone | 2000 | — | — | — | |
| Guild co-op quest (shared) | +20% bonus | — | — | — | On top of base XP |
| Weekly Boss defeated | 400 | — | — | — | Guild event |
| Perfect Day (100% habits) | 50 | — | — | — | |
| Upload body photo | 5 | — | — | — | |
| Log outfit | 5 | — | — | — | |

**XP Formula (Level Threshold)**
```typescript
function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

// Thresholds
// Level 1 → 2:   100 XP
// Level 2 → 3:   283 XP
// Level 5 → 6:   559 XP
// Level 10 → 11: 1000 XP
// Level 20 → 21: 1789 XP
// Level 50:      ~35,355 XP total accumulated
```

---

### 2.2 HP — Health Points
> *"The integrity of your Vessel. Your consistency, made visible."*

HP represents the player's physical and habitual consistency. It is a **real-time signal** of whether the player is taking care of themselves. HP does not represent actual health — it represents commitment. A player with 100 HP has been showing up every day. A player with 20 HP is slipping.

**Base HP:** 100  
**Max HP Scaling:** +15 per VIT point (e.g., VIT 5 = max 175 HP)

**HP Damage Table**

| Event | HP Lost | Notes |
|-------|---------|-------|
| Missed daily habit (per habit) | –5 HP | Capped at –20 HP/day from habits |
| Broken 7-day streak | –15 HP | |
| Broken 30-day streak | –30 HP | |
| Inactivity >48 hours | –30 HP | |
| Inactivity >72 hours | –50 HP | |
| HP reaches 0 | **–1 Level** | Soft regression (see §12) |

> HP damage is reduced by VIT. Every 3 VIT points reduces incoming HP damage by 10%.

**HP Recovery Table**

| Action | HP Recovered | Notes |
|--------|-------------|-------|
| Perfect Day (100% habits completed) | +20 HP | |
| Complete a Recovery Task | +15 HP | AI-assigned repair task |
| Complete a Recovery Quest | +35 HP | Full chain of 3 tasks |
| Restore a broken 7-day streak | +25 HP | |
| Guild member sends HP gift | +10 HP | Max 1 per day from any member |
| Log water intake (full target) | +5 HP | If VIT tracking is active |
| Log sleep (7+ hours) | +5 HP | If VIT tracking is active |

---

### 2.3 AiCoins
> *"System-sanctioned power units. Used to access the intelligence of the System itself."*

AiCoins are the **only** in-app currency. They are earned through gameplay and spent on AI features. They can also be purchased with real money — this is the **primary monetisation mechanism**. AiCoins must feel valuable because they are both earned (feels rewarding) and buyable (drives revenue).

The design principle: free users should be able to earn enough AiCoins to engage meaningfully, but power users and people who want *more* AI access should feel the pull to purchase.

Full economy detail is in [§15 AiCoin Economy](#15-aicoin-economy).

---

## 3. Attribute System

Attributes are the **soul of the RPG layer**. They are not assigned at the start of the game — they are earned by doing. Every attribute is leveled by the real-world actions that logically correspond to it. This creates a meaningful feedback loop: if you train, your STR goes up; if you learn, your INT goes up.

### 3.1 The Five Attributes

#### STR — Strength
*Domain: Physical development*

| | |
|---|---|
| **Leveled by** | Logging workout sessions, completing physical daily habits, clearing fitness-type dungeons |
| **Primary bonus** | +5% XP gain from physical/fitness actions per STR point |
| **Secondary unlock** | Unlocks harder combat/fitness quest tiers; STR 10 unlocks S-rank workout dungeons |
| **Max STR** | 50 |

---

#### INT — Intelligence
*Domain: Mental development and learning*

| | |
|---|---|
| **Leveled by** | Logging skill sessions, reading habits, completing learning milestones, clearing scholar-type dungeons |
| **Primary bonus** | +10 max AiCoin daily pool per INT point (increases how many AI interactions you can do per day) |
| **Secondary unlock** | Unlocks deeper AI roadmap generation (more detailed skill plans), INT 15 unlocks "Cognitive Probe" AI skill |
| **Max INT** | 50 |

---

#### AGI — Agility
*Domain: Discipline, speed, consistency*

| | |
|---|---|
| **Leveled by** | Completing tasks on time or early, maintaining streaks, completing Pomodoro sessions, clearing time-management dungeons |
| **Primary bonus** | +1 AiCoin passive regen per day per AGI point |
| **Secondary unlock** | Reduces quest cooldown duration; AGI 10 allows streak freeze to auto-activate; AGI 20 unlocks "Quest Shift" (re-roll a bad daily quest for free once/day) |
| **Max AGI** | 50 |

---

#### VIT — Vitality
*Domain: Physical health and recovery*

| | |
|---|---|
| **Leveled by** | Logging sleep duration, hitting daily water intake targets, completing recovery tasks, logging nutrition consistently for 7+ days |
| **Primary bonus** | +15 max HP per VIT point; every 3 VIT points reduces HP damage by 10% |
| **Secondary unlock** | VIT 5 unlocks sleep/water tracking features; VIT 10 gives immunity to "Inactivity >48h" HP penalty once per week |
| **Max VIT** | 50 |

---

#### CHA — Charisma
*Domain: Social influence and style*

| | |
|---|---|
| **Leveled by** | Completing friend challenges, participating in guild raids, winning challenges, completing style-module logs, sending HP gifts |
| **Primary bonus** | +5% bonus XP contributed to Guild XP pool per CHA point |
| **Secondary unlock** | CHA 5 allows creating guilds; CHA 10 unlocks Officer role eligibility; CHA 20 allows Guild Master status; higher CHA unlocks rarer avatar frames |
| **Max CHA** | 50 |

---

### 3.2 How Attributes Are Gained

Attributes do **not** level up manually. The system tracks qualifying actions and awards attribute points automatically.

```typescript
// Example thresholds
// STR: +1 per 10 workout sessions logged
// INT: +1 per 20 skill-session hours logged  
// AGI: +1 per 7-day streak maintained (each)
// VIT: +1 per 14 days of water + sleep logging combined
// CHA: +1 per 5 guild activities or challenge completions
```

This design means a player who only does fitness will become a high-STR, low-INT character — their profile genuinely reflects who they are in real life.

---

### 3.3 Level-Up Stat Allocation — The System Window

This is the **highest-dopamine moment in the game**. Every time the player levels up, before anything else, the screen shifts to a **dramatic System Window**:

```
╔══════════════════════════════════════╗
║         ⚠ SYSTEM NOTIFICATION ⚠      ║
║                                      ║
║   Level Up: 12 → 13                  ║
║                                      ║
║   Stat Point Available: +1           ║
║   Allocate to:                       ║
║                                      ║
║   [ STR ]  [ INT ]  [ AGI ]          ║
║   [ VIT ]  [ CHA ]                   ║
║                                      ║
║   Choose wisely, Player.             ║
╚══════════════════════════════════════╝
```

The player picks one attribute. It increments by 1. The corresponding bonus is shown immediately. This is the direct Solo Leveling reference and the core reason players will want to keep leveling.

> **Design note:** The player gets 1 allocation point per level-up. Bonus points can be earned from rare Dungeon rewards. Never sell stat points — it breaks game balance.

---

## 4. Rank & Level Progression

### 4.1 Rank Table

| Rank | Level Range | Title | Unlock |
|------|-------------|-------|--------|
| **E** | 1–9 | Awakened | App access, basic quests, D-rank Dungeons |
| **D** | 10–19 | Pathfinder | Guild creation, C-rank Dungeons, friend challenges |
| **C** | 20–29 | Vanguard | A-rank Dungeons, guild raids, Accountability Pacts |
| **B** | 30–39 | Elite | Weekly Boss access, advanced AI skills |
| **A** | 40–49 | Master | S-rank Raids, Guild Master eligibility, leaderboard prestige |
| **S** | 50 | Ascendant | Final known rank. Legendary badge. Permanent profile frame. |
| **SSS** | ?? | System Architect | Unknown. Not documented. Discovered in-game only. |

### 4.2 Rank-Up Event
Every rank transition is a **full-screen cinematic event**:
1. Screen dims.
2. Text appears: *"The System has acknowledged your growth."*
3. Rank badge animates in with glow effect.
4. New unlock list is shown.
5. Push notification is sent to all guild members: *"[Username] has ascended to Rank C — Vanguard."*

This moment must feel earned and dramatic. It should be screenshot-worthy.

### 4.3 Level Titles
```
Level 1–5:    "Beginner"
Level 6–10:   "Apprentice"
Level 11–15:  "Seeker"
Level 16–20:  "Achiever"
Level 21–25:  "Striver"
Level 26–30:  "Warrior"
Level 31–35:  "Champion"
Level 36–40:  "Master"
Level 41–45:  "Legend"
Level 46–50:  "Ascendant"
```

---

## 5. Onboarding — System Awakening

> **Goal:** Get users to complete their first loop and log their email — in that order.  
> **Core problem being solved:** Users never starting (biggest retention risk).  
> **Design principle:** Reward before you ask. Show the game before you explain it.

### 5.1 The 7-Step System Awakening Flow

#### Step 1 — The Black Screen Moment
*Estimated time: 10 seconds*

The app opens to a **pure black screen** with a single line of text fading in:

> *"An unknown System has detected latent potential in this individual."*

Below it, a pulsing prompt: `[ TAP TO ACKNOWLEDGE ]`

This does nothing except set the tone. It is not skippable on first launch. This is the single most important UX decision in the product — it signals "this is different" before a single form is shown.

**Why it works:** The Greatest Estate Developer and Solo Leveling both open this way. The user is the protagonist. They are chosen. This feeling must land before anything else.

---

#### Step 2 — Name Your Player
*Estimated time: 20 seconds*

A single input field appears:

> *"The System requires designation. Enter your Player name."*

Field: **Username** (alphanumeric, 3–16 chars)

No email. No password. Not yet. The goal is to get them past the first hurdle with zero friction. They type a name. They press Continue. They are now "in the game."

---

#### Step 3 — Class Selection
*Estimated time: 30 seconds*

Instead of "select your goals," present **4 RPG Classes** as illustrated cards:

| Class | Real Goal | Visual | Description Shown |
|-------|-----------|--------|-------------------|
| **Warrior** | Fitness | Athletic character | "Body of iron. Strength is your path." |
| **Scholar** | Skills & learning | Studious character | "Knowledge is power. Mastery is your weapon." |
| **Tactician** | Time management | Strategic character | "Every second is a resource. Waste none." |
| **Vanguard** | All-rounder | All-class character | "No weakness. No single path. Total ascension." |

Multi-select is allowed. Selecting Vanguard auto-selects all. The data captured is identical to the current goal-selection screen — but the framing makes it feel like a meaningful identity choice.

---

#### Step 4 — Rank Assessment (3 Questions Per Class)
*Estimated time: 60–90 seconds*

The AI asks **exactly 3 questions** per selected class. No more. These are casual, fast-answer questions (multiple choice preferred).

**Warrior example:**
1. *"How often do you currently train?"* — Daily / A few times a week / Rarely / Never
2. *"What is your primary fitness goal?"* — Build muscle / Lose weight / General fitness / Athletic performance
3. *"How do you feel after a full day of no physical activity?"* — Fine / Slightly guilty / Terrible / I always move

**Scholar example:**
1. *"What skill are you most trying to develop right now?"* — Free text (short)
2. *"How many hours per week can you dedicate to learning?"* — <1h / 1–3h / 3–7h / 7h+
3. *"What stops you from learning consistently?"* — No time / No structure / Low motivation / Distractions

Answers feed into: starting attribute scores, initial quest difficulty, first AI roadmap context, and recommended avatar class.

After all questions, the screen goes dark and shows:

> *"System Assessment Complete."*  
> *"Processing latent potential..."*  
> *[loading bar]*  
> *"Rank Assigned: E — Awakened."*

---

#### Step 5 — First Reward Drop
*Estimated time: 15 seconds*

Before asking for email, show the player what they have already earned:

```
╔══════════════════════════════════════╗
║   ⚡ SYSTEM REWARD ISSUED            ║
║                                      ║
║   [Avatar Card]                      ║
║   Rank E Badge: UNLOCKED             ║
║   Starting AiCoins: 50               ║
║   Day 1 Quest: ASSIGNED              ║
╚══════════════════════════════════════╝
```

Then, and only then:

> *"Save your progress. The System requires a secure anchor."*

Email + password fields. Because the player already has something to lose, email conversion will be significantly higher than asking at the start.

---

#### Step 6 — The First Quest
*Estimated time: 2 minutes to complete*

The first quest must be **trivially easy and immediately completable:**

> **Quest: First Protocol**  
> *Complete 1 habit today.*  
> Reward: 50 XP, 10 AiCoins, "First Steps" badge

When completed, the screen plays the rank-up animation and shows:

> *"System acknowledges your first action. The journey begins."*

This creates the **core loop memory** on Day 1. The player has now: opened the app, identified as a class, received a rank, created an account, completed a quest, and earned a badge — all within 5–7 minutes.

---

#### Step 7 — Week 1 Roadmap
*Estimated time: 30 seconds to view*

The AI generates a visual 7-day quest chain. This is not a to-do list. It is a **quest map** showing:
- Day 1: First Protocol (just completed ✓)
- Day 2: *"Log 3 habits. [LOCKED until tomorrow]"*
- Day 3: *"First Dungeon available. [SEALED]"*
- Day 7: *"Week Warrior badge. [???]"*

The locked/sealed items are visible but inaccessible. The curiosity gap is set. The player now knows there is more coming and they must return to get it.

---

## 6. Quest System

### 6.1 Quest Types

| Type | Duration | Resets | Difficulty | Source |
|------|----------|--------|------------|--------|
| **Daily Quest** | 24h | Midnight | Easy–Medium | Pre-built + AI |
| **Weekly Quest** | 7 days | Monday | Medium–Hard | Pre-built + AI |
| **Monthly Quest** | 30 days | 1st of month | Hard | Pre-built |
| **Dungeon Quest** | 24–168h | Spawns daily/weekly | Hard–Extreme | System generated |
| **Guild Quest** | Custom | Guild Master sets | Variable | Guild |
| **Story Quest** | Multi-week | Never | Escalating | Pre-built |
| **AI Quest** | Custom | Never | Personalised | AI-generated |
| **Challenge Quest** | Custom | Never | Competitive | Player vs Player |

### 6.2 Quest Design Rules

1. **Every quest must have a countdown timer.** No static due dates. A live ticking clock creates urgency.
2. **Rewards are shown upfront.** The player sees exactly what they will earn before starting. This increases completion motivation.
3. **Quest failure is visible.** Failed quests show a grey "FAILED" state with HP damage listed. This is uncomfortable enough to avoid without being punishing enough to quit over.
4. **AI quests are personal.** The AI should use the player's own data: *"You haven't logged a workout in 3 days. Quest: Break the Slump — log 1 workout in the next 12 hours."*

### 6.3 Quest Templates (V1 — 35 quests)

**Daily Quests**
- "Task Crusher" — Complete 5 tasks (XP: 50, AiCoins: 10)
- "Hydration Protocol" — Hit water goal (XP: 30, AiCoins: 5)
- "Morning Mover" — Log workout before noon (XP: 60, AiCoins: 15)
- "Scholar's Hour" — Log 1 skill session (XP: 40, AiCoins: 8)
- "Vessel Maintenance" — Log sleep + water (XP: 35, AiCoins: 7)
- "Streak Guard" — Complete all active habits (XP: 50, AiCoins: 12)

**Weekly Quests**
- "7-Day Workout Challenge" — 5 workouts (XP: 200, AiCoins: 50)
- "Skill Sprint" — 10+ skill hours (XP: 300, AiCoins: 75)
- "Perfect Week" — All habits Mon–Sun (XP: 400, AiCoins: 100, Badge)
- "Task Master" — 25 tasks (XP: 250, AiCoins: 60)
- "Hydration Week" — Water goal every day (XP: 150, AiCoins: 40)
- "Guild Loyalist" — Contribute to guild quest 3 times (XP: 180, AiCoins: 45)

**Monthly Quests**
- "30-Day Fitness Challenge" (XP: 1000, AiCoins: 300, Badge: Rare)
- "Skill Master" — 40+ skill hours (XP: 1200, AiCoins: 350, Badge: Rare)
- "Consistency King" — 25-day activity streak (XP: 2000, AiCoins: 500, Badge: Epic)

---

## 7. Dungeon System

Dungeons are the **urgency centerpiece** of SelfUp. They are time-limited, high-reward quest events that appear on a schedule. Missing a dungeon is a genuine loss — this is intentional.

### 7.1 Dungeon Philosophy

The dungeon concept is borrowed from Solo Leveling's gate system. Every day, a dungeon "gate" opens. The player has a window to enter and clear it. If they don't, it closes. This creates a daily reason to open the app even when the player has no scheduled tasks.

### 7.2 Dungeon Tiers

| Tier | Level Req | Duration | Players | HP Required | Reward |
|------|-----------|----------|---------|-------------|--------|
| **D-rank** | Level 1+ | 24 hours | Solo | None | 200 XP + 20 AiCoins |
| **C-rank** | Level 10+ | 48 hours | Solo or Duo | 50+ HP | 350 XP + 40 AiCoins |
| **A-rank** | Level 25+ | 72 hours | Guild (3+ members) | 60+ HP | 600 XP + 80 AiCoins + Rare Badge |
| **S-rank Raid** | Level 40+ | 7 days | Guild (5+ members) | 70+ HP | 1200 XP + 200 AiCoins + Legendary Badge |

### 7.3 Dungeon Mechanics

**D-rank Dungeon (example):**
```
╔══════════════════════════════════════╗
║  ⚠ DUNGEON GATE DETECTED            ║
║  Tier: D-rank                        ║
║  Time Remaining: 18:42:09            ║
║                                      ║
║  Objectives:                         ║
║  ✗ Complete 5 tasks today            ║
║  ✗ Log 1 workout                     ║
║  ✗ Complete all habits               ║
║                                      ║
║  Reward: 200 XP + 20 AiCoins         ║
║  [ENTER DUNGEON]                     ║
╚══════════════════════════════════════╝
```

**A-rank Dungeon (co-op):**
- A dungeon "gate" is shared with guild members.
- Each member completes their own objectives (e.g., "Log 3 workouts this week").
- Progress is visible on a shared panel: *"Rahul: 2/3 ✓ | Nadia: 3/3 ✓ | Yusuf: 1/3"*
- Gate closes if fewer than 3 members clear their objectives.
- All clearing members receive the reward. Non-clearers receive nothing.

**S-rank Raid Boss:**
- The Boss has a **shared HP pool** (e.g., 5000 Boss HP).
- Every logged action by a guild member deals "damage" (e.g., completing a task = 50 damage, workout = 150 damage).
- Guild must collectively deal enough damage in 7 days.
- Live Boss HP bar visible on guild page. Creates daily check-in motivation.
- If Boss is defeated: all members get Legendary Badge + 1200 XP + 200 AiCoins.
- If Boss is not defeated: everyone gets participation reward (50 XP) and the gate closes for 2 weeks.

### 7.4 Dungeon Spawn Schedule

| Dungeon | Spawn Time | Frequency |
|---------|------------|-----------|
| D-rank | Daily at 6:00 AM | Every day |
| C-rank | Monday and Thursday | 2x per week |
| A-rank | Monday | 1x per week |
| S-rank Raid | First day of each month | 1x per month |

---

## 8. Urgency Mechanics

### 8.1 Daily Dungeon Expiry
The D-rank dungeon gate that opens every morning **disappears at midnight**. There is no extension. There is no make-up. It is gone. The player sees a red countdown timer all day. This is the single most effective daily open trigger.

### 8.2 Streak Decay Warning
**Trigger:** At 8:00 PM local time, if the player has logged zero activity that day.  
**Notification:** Push + in-app banner  
**Message:** *"System Warning: Streak integrity compromised. 4 hours remain before decay begins."*  
**Visual:** Red banner at top of app with a countdown clock. Cannot be dismissed — only cleared by logging any activity.

This is deliberately uncomfortable. The goal is a micro-panic that results in opening the app and doing *something*, even just logging water intake. The streak is saved; the habit of opening the app is reinforced.

### 8.3 Weekly Boss
Every **Sunday at 12:00 PM**, a Weekly Boss event spawns. It is a hard, 12-hour quest chain with a unique structure that changes each week. Only players who fully clear it earn the **Weekly Champion badge** — a non-permanent badge that shows on the profile for that week only. This drives weekly rhythm and creates FOMO.

### 8.4 Quest Countdown Timers
Every active quest shows a **live countdown timer** rather than a due date. The difference between "Due: Friday" and "47:22:09 remaining" is psychologically significant. The latter creates urgency; the former does not.

### 8.5 HP Decay Visualization
When HP drops below 60, the player's avatar card begins to show **visual damage** — a cracked overlay, a dimmed appearance, or a red tint. This is visible on the dashboard. The player sees their character being hurt. It is designed to feel bad and motivate recovery action.

---

## 9. Curiosity Mechanics

### 9.1 Sealed System Skills
The dashboard shows a "System Skills" panel. Some skills are active; others are **visibly locked** with a redacted description:

```
[ Auto-Sync ]          ACTIVE     — AI blocks your schedule automatically
[ Cognitive Probe ]    LOCKED     — "Unlocks at INT 10. Effect: ???"
[ Temporal Shift ]     LOCKED     — "Unlocks at AGI 15. Effect: ???"
[ Vessel Override ]    LOCKED     — "Unlocks at Rank A. Effect: ???"
[ ██████████ ]         SEALED     — "Condition unknown."
```

The last entry has no name and no hint. It is discovered through gameplay, not documentation.

### 9.2 Secret Badges
The badge catalog shows all normal badges with full descriptions. However, 10 of the 50 badges are displayed as:

```
[ ??? ]  — "This badge cannot be identified. It must be found."
```

These secret badges are unlocked by hidden conditions — unusual action combinations, specific timing, or community-discovered triggers. The existence of a mystery badge community (Discord, Reddit, etc.) is a free viral marketing channel.

### 9.3 The SSS Rank
Shown from Level 1 in the Rank table:

```
Rank S    — Level 50 — "Ascendant"
Rank SSS  — Level ?? — "System Architect"
```

No requirement is ever officially published. The path to SSS Rank is the endgame mystery of SelfUp. Players will speculate, share theories, and attempt extreme combinations. The first person to reach it should be a community event.

### 9.4 System Caches (Loot Boxes — Earned Only)
Completing certain milestones drops a **System Cache** — a collectible container with a random reward. Caches are **never purchasable**. They can only be earned. This preserves the integrity of the reward while creating excitement.

**Drop Triggers:**
- Every 7-day streak milestone
- Every dungeon clear
- Every rank-up
- Random drop (5% chance) on any quest completion
- Guild raid victory

**Possible Contents:**
- AiCoins (10–200, random)
- Rare cosmetic avatar frame
- Unique badge
- Bonus XP multiplier (24h duration)
- Stat point (extremely rare)

**Opening Animation:**
The cache opens with a System-style cinematic: *"System Cache analysed. Content extracted."* — followed by the reward reveal. This moment must be visually satisfying.

---

## 10. Guild System

Guilds solve the **belonging problem** and the **never-starting problem** simultaneously. A player who joins a guild has social accountability. Their guild members see if they stop logging. The guild feed creates obligation without pressure.

### 10.1 Guild Structure

| Property | Value |
|----------|-------|
| **Max members** | 20 per guild |
| **Roles** | Guild Master (1), Officer (up to 3), Member |
| **Guild Level** | 1–20 (levels up from collective guild XP) |
| **Creation requirement** | CHA 5+ |
| **Officer requirement** | CHA 10+ |
| **Guild Master requirement** | CHA 20+ |
| **Join methods** | Search by name, invite link, QR code |

### 10.2 Guild XP & Leveling

Every member action contributes to the Guild XP pool. Guild XP is separate from personal XP. The more active the guild, the faster it levels up.

**Guild Level Rewards:**

| Guild Level | Name | Perk |
|-------------|------|------|
| 1–5 | Rookie Enclave | Basic guild page |
| 6–10 | Warrior Hall | Unlock Guild Sprint quests |
| 11–15 | Elite Fortress | +10% XP bonus on all co-op quests |
| 16–19 | Legendary Order | Unlock S-rank Raid access |
| 20 | System Sanctum | Permanent guild leaderboard badge; +15% co-op XP |

### 10.3 Guild Feed
The guild feed is a live activity log visible to all members:

```
[12:34]  Rahul cleared a D-rank Dungeon. +200 XP
[11:20]  Nadia completed a 7-day streak. +100 XP
[09:15]  Yusuf completed "Morning Mover" quest.
[08:00]  ⚠ Weekly Boss has appeared. 12 hours remain.
```

This feed creates **social presence** — players feel that the guild is alive and active. Seeing others complete tasks triggers reciprocal motivation.

### 10.4 Guild Master Powers
- Post "Guild Orders" — optional bonus challenges for members
- Kick inactive members (inactive >7 days)
- Promote/demote Officers
- Set guild visibility (public / invite only)
- Set minimum CHA requirement for join requests
- Schedule Guild Sprint events
- Activate Guild Buff (costs 25 AiCoins from guild treasury): +5% XP for all members for 24h

### 10.5 Guild Treasury
Members can donate AiCoins to the guild treasury. The Guild Master uses treasury coins to activate guild buffs. This creates a secondary economy within the guild and gives high earners a way to contribute to the group.

---

## 11. Co-op Quest Types

### 11.1 Duo Challenge
**Players:** 2  
**Mechanic:** Both players receive the same quest. Both must complete it independently before the timer expires. If both complete it — both receive a +20% XP bonus on top of the base quest reward.  
**Failure case:** If one player fails, that player takes –5 HP. The other player still earns base reward.  
**Example:** *"Both players log a workout session today. Timer: 24 hours."*

### 11.2 Guild Sprint
**Players:** All guild members  
**Mechanic:** The Guild Master sets a collective target (e.g., "500 tasks completed this week"). A shared progress bar is visible to all members. Individual contributions are tracked and shown.  
**Reward:** Distributed proportionally by contribution. Top 3 contributors get bonus AiCoins.  
**Example:** *"Guild Sprint: Log 100 hours of skill sessions this month."*

### 11.3 Raid Boss
**Players:** 5+ guild members (S-rank only: full guild)  
**Mechanic:** A Boss has a shared HP pool. Each logged action by a guild member deals damage. Boss HP and individual damage contributions are visible on the guild page.  
**Example damage values:**
- Complete a task: 20 damage
- Log a workout: 80 damage
- Complete a daily quest: 120 damage
- Perfect Day: 200 damage

**Reward:** If Boss is defeated — Legendary Badge + full reward. If not — participation badge only.  
**Duration:** 7 days.

### 11.4 Accountability Pact
**Players:** 2  
**Mechanic:** Two players mutually commit to a habit for 7 days. Both must complete the habit every day. If either player misses a day — both players lose XP (–30 XP per missed day) and –10 HP each.  
**Reward:** If both complete all 7 days — unique "Ironclad" badge (non-tradeable, shown permanently on profile) + 200 XP each + 50 AiCoins each.  
**Design note:** This is the highest-risk, highest-reward co-op mechanic. It creates real emotional investment because failure hurts a friend. Choose your pact partner wisely.

---

## 12. Penalty & Recovery Rework

### 12.1 Philosophy
The original System Lockdown was a **dead end**. Players who hit 0 HP had no reason to return — they were locked out of the features they needed to recover. The new system is a **dramatic narrative loop**: fall down, be shown your recovery path, climb back up, earn a comeback badge. The punishment becomes a story moment, not a quit trigger.

### 12.2 HP State Cascade

| HP Range | State Name | XP Modifier | Visual Indicator | Recovery Path |
|----------|------------|-------------|-----------------|---------------|
| 100–61 | **Healthy** | 100% (full) | Normal avatar | — |
| 60–31 | **Weakened** | –15% XP | Avatar dims slightly; amber warning banner | Complete 1 Recovery Task |
| 30–11 | **Critical** | –30% XP | Avatar cracked; red warning banner; AI sends daily message | Complete Recovery Quest chain (3 tasks) |
| 1–10 | **Collapse** | –50% XP; level regression risk active | Avatar severely damaged; pulsing red border | Perfect Day + Recovery Quest chain |
| 0 | **System Downgrade** | –1 Level triggered; HP resets to 30 | Cinematic event plays | Recovery Quest + Comeback path |

> **Important:** HP reaching 0 does not lock the player out. It triggers a Level Regression event, then HP is set to 30. The player can play immediately but at a disadvantage until they recover.

### 12.3 Level Regression Event
When HP hits 0, the following sequence plays:

**Screen 1:**
```
[Dark background. Red text fades in.]

"System Alert: Critical Vessel Failure."
"Accumulated damage has exceeded threshold."
"System integrity downgrade... initiated."
```

**Screen 2:**
```
[Level badge animates down one step]

Level 13 → Level 12
Rank: E — Awakened [maintained]
```

**Screen 3:**
```
"System offers path to restoration."

[ RECOVERY QUEST ASSIGNED ]
"Reclaim Level 13: Complete the Restoration Protocol"
Progress: 0/3 tasks

[ BEGIN RECOVERY ]
```

The player is immediately given a clear, achievable path back. The regression is a narrative event — not a punishment screen.

### 12.4 Comeback Badge
Any player who reaches HP 0 and then fully recovers their lost level earns the **"System Override"** badge — a rare badge that cannot be earned any other way. It signals resilience. Players who display it have a story. This badge should be respected in the community.

---

## 13. Badge System

### 13.1 Badge Rarity Tiers

| Rarity | Visual | Availability |
|--------|--------|-------------|
| **Common** | Gray border | Earned from basic milestones |
| **Rare** | Blue border + subtle glow | Earned from hard quests/streaks |
| **Epic** | Purple border + glow | Earned from dungeons, rank-ups, monthly quests |
| **Legendary** | Gold border + animated glow | Earned from raids, 100-day streak, SSS |
| **Secret** | Black border with `???` until earned | Discovered through gameplay |

### 13.2 Badge Catalog V1 (50 badges)

**Onboarding (2)**
- `first_steps` — Complete onboarding *(Common)*
- `profile_complete` — Fill out full profile *(Common)*

**Streaks (6)**
- `hot_start` — 3-day streak *(Common)*
- `week_warrior` — 7-day streak *(Common)*
- `two_weeks_strong` — 14-day streak *(Rare)*
- `monthly_master` — 30-day streak *(Rare)*
- `dedication` — 60-day streak *(Epic)*
- `century` — 100-day streak *(Legendary)*

**Fitness (6)**
- `first_workout` — Log first workout *(Common)*
- `gym_rat` — 50 workouts logged *(Rare)*
- `iron_will` — 100 workouts logged *(Epic)*
- `nutrition_nerd` — Log food 30 days *(Rare)*
- `transformation` — Upload 30 body photos *(Rare)*
- `vessel_mastery` — VIT 20 reached *(Epic)*

**Skills (5)**
- `learner` — Start first skill *(Common)*
- `dedicated` — 100 skill hours total *(Rare)*
- `polymath` — 3 active skills simultaneously *(Rare)*
- `milestone_crusher` — Complete 20 skill milestones *(Epic)*
- `scholar_supreme` — INT 20 reached *(Epic)*

**Time (4)**
- `task_master` — Complete 100 tasks *(Rare)*
- `habit_king` — 30 habits completed in a month *(Rare)*
- `pomodoro_pro` — 50 Pomodoro sessions *(Common)*
- `tactician_supreme` — AGI 20 reached *(Epic)*

**Dungeon (4)**
- `first_gate` — Clear first dungeon *(Common)*
- `dungeon_crawler` — Clear 10 dungeons *(Rare)*
- `raid_veteran` — Participate in 5 guild raids *(Epic)*
- `raid_champion` — Win 3 guild raids *(Legendary)*

**Rank & Level (5)**
- `rising_star` — Reach Level 10 *(Common)*
- `elite` — Reach Level 25 *(Rare)*
- `legend` — Reach Level 50 *(Legendary)*
- `rank_s` — Reach Rank S *(Legendary)*
- `system_architect` — Reach Rank SSS *(Legendary — secret until earned)*

**Guild & Social (6)**
- `founder` — Create a guild *(Rare)*
- `loyal_soldier` — Active in a guild for 30 days *(Common)*
- `guild_champion` — Top contributor in a guild for 1 week *(Rare)*
- `raid_king` — Be top damage dealer in a raid *(Epic)*
- `challenger` — Complete 3 PvP challenges *(Common)*
- `winner` — Win 5 PvP challenges *(Rare)*

**Recovery (2)**
- `system_override` — Reach HP 0 and recover lost level *(Epic — secret)*
- `unbreakable` — Recover from Critical HP 3 times *(Rare)*

**Gamification (5)**
- `quest_hero` — Complete 20 quests *(Rare)*
- `coin_rich` — Earn 1000 AiCoins total *(Common)*
- `weekly_champion` — Win the Weekly Boss *(Rare — weekly, non-permanent display)*
- `weekly_champion_x5` — Win Weekly Boss 5 times *(Epic — permanent)*
- `ironclad` — Complete an Accountability Pact *(Epic)*

**Secret (5)** — Conditions not published
- `???` — Secret badge 1
- `???` — Secret badge 2
- `???` — Secret badge 3
- `???` — Secret badge 4
- `???` — Secret badge 5

---

## 14. Leaderboard System

### 14.1 Leaderboard Score Formula

```typescript
function calculateLeaderboardScore(user: UserStats): number {
  return (
    user.total_xp * 1.0 +
    user.overall_streak * 50 +
    user.tasks_completed_this_week * 10 +
    user.workouts_this_week * 25 +
    user.skill_hours_this_week * 20 +
    user.habits_completed_this_week * 8 +
    user.quests_completed_this_week * 100 +
    user.dungeons_cleared_this_week * 150 +
    user.guild_contributions_this_week * 30
  )
}
```

### 14.2 Leaderboard Types

| Board | Scope | Resets | Special |
|-------|-------|--------|---------|
| **Global Weekly** | All users | Monday midnight | Top 3 get "Weekly Elite" profile badge for the week |
| **Global All-Time** | All users | Never | True prestige board |
| **Friends Weekly** | Friend group | Monday midnight | |
| **Friends All-Time** | Friend group | Never | |
| **Guild Weekly** | Guild members | Monday midnight | Top performer shown on guild page |
| **Bangladesh Weekly** | Country-level | Monday midnight | Regional pride; culturally relevant |

### 14.3 Display Rules
- Top 100 visible
- Player's own rank always visible even outside top 100
- Rank change indicator: ↑ (up), ↓ (down), — (same)
- Avatar + username + level + rank badge + score
- Streak indicator shown next to name

---

## 15. AiCoin Economy

### 15.1 Free vs Pro Daily Caps

| Tier | Price | Daily AiCoin Grant | Max Daily Earnable | Daily Pool Cap |
|------|-------|-------------------|-------------------|----------------|
| Free | 0 BDT | +10 | +10 | 20 AiCoins/day |
| Pro | 200 BDT/month | +50 | +150 | 200 AiCoins/day + monthly bonus |

### 15.2 Earn Table

| Action | AiCoins Earned |
|--------|---------------|
| Daily login | +5 |
| Complete low-priority task | +1 |
| Complete high-priority task | +3 |
| Complete daily quest | +10–20 |
| Complete weekly quest | +25–50 |
| 7-day streak milestone | +20 |
| 30-day streak milestone | +100 |
| Guild raid win | +30 (shared among members) |
| Weekly Boss clear | +50 |
| System Cache drop (random) | +10–200 |
| Weekly AI summary reviewed | +5 |
| Invite friend who registers | +30 |

### 15.3 Spend Table

| Feature | Cost |
|---------|------|
| Send 1 AI chat message | 1 AiCoin |
| AI auto-schedule (1 day) | 5 AiCoins |
| AI analysis report | 10 AiCoins |
| AI skill roadmap generation | 15 AiCoins |
| Dungeon re-roll (get new objectives) | 10 AiCoins |
| Quest Shift (re-roll daily quest) | 8 AiCoins |
| Guild Buff activation (Guild Master only) | 25 AiCoins from guild treasury |
| Extra streak freeze (beyond weekly allowance) | 15 AiCoins |

### 15.4 Purchasable AiCoin Packs (Real Money)

| Pack | AiCoins | Price (BDT) | Value |
|------|---------|-------------|-------|
| Starter Pack | 100 | 29 BDT | Good for 1 week of heavy AI use |
| Scout Pack | 300 | 79 BDT | Best for casual Pro users |
| Elite Pack | 700 | 149 BDT | Best per-coin value |
| Ascendant Pack | 2000 | 349 BDT | Power users, guild masters |

> **Design note:** AiCoin packs should feel like buying in-game power, not a subscription. The language should be: *"Add 300 AiCoins to your System reserve"* — not "top up credits."

---

## 16. Streak System

### 16.1 Streak Types

| Streak | Trigger | Breaks On |
|--------|---------|-----------|
| **Overall Streak** | Any activity logged | No activity in a calendar day |
| **Fitness Streak** | At least 1 workout logged | No workout logged in a day |
| **Skills Streak** | At least 1 skill session logged | No skill session in a day |
| **Habits Streak** | All active habits completed | Any active habit missed |
| **Tasks Streak** | At least 3 tasks completed | Fewer than 3 tasks |
| **Guild Streak** | Any guild contribution | No guild contribution (only counts for guild members) |

### 16.2 Streak Freeze
- Free users: **1 streak freeze per week** (auto-refilled Monday)
- Pro users: **3 streak freezes per week**
- Activates automatically when streak would break and user has no activity
- Visual: ice crystal icon on streak badge
- AGI 10 attribute: freeze activates automatically (default is manual)

### 16.3 Streak Milestones

| Days | Name | Reward |
|------|------|--------|
| 3 | "Hot Start" | Badge (Common) |
| 7 | "Week Warrior" | Badge + 100 XP + 20 AiCoins |
| 14 | "Two Weeks Strong" | Badge + 200 XP + 50 AiCoins |
| 30 | "Monthly Master" | Badge + 500 XP + 100 AiCoins + System Cache |
| 60 | "Dedication" | Badge + 1000 XP + 200 AiCoins + System Cache |
| 100 | "Century" | Legendary Badge + 2000 XP + 500 AiCoins + System Cache + profile effect |

---

## 17. Notification Strategy

Notifications are the **off-app urgency layer**. Every notification should feel like a System alert — not a reminder from a productivity app.

### 17.1 Notification Language Style
- ❌ "Don't forget to log your habits today!"
- ✅ "System Alert: Habit protocols unexecuted. Risk of HP decay in 4 hours."

- ❌ "You have a quest due soon."
- ✅ "Dungeon gate closing in 2 hours. Enter now or the reward is forfeit."

- ❌ "Your friend challenged you!"
- ✅ "Player [Rahul] has issued a challenge. Respond within 24 hours or forfeit your rank."

### 17.2 Notification Schedule

| Time | Trigger | Message |
|------|---------|---------|
| 7:00 AM | Daily | Morning System briefing: today's quests, dungeon spawn |
| 12:00 PM | Sunday | Weekly Boss spawned |
| 8:00 PM | If no activity today | Streak Decay Warning |
| 9:00 PM | If dungeon not cleared | "Gate closing in 3 hours." |
| Variable | Streak milestone | Milestone celebration |
| Variable | Guild activity | Member cleared dungeon; raid boss HP update |
| Variable | Challenge received | Immediate — 24h response window |
| Monday 6:00 AM | Weekly | Weekly quest reset; new Weekly Boss preview |

### 17.3 Notification Fatigue Prevention
- User can configure quiet hours (default: 11 PM – 7 AM)
- Maximum 3 non-critical notifications per day
- Streak and dungeon notifications cannot be turned off (they are urgency-critical)
- Guild notifications batched into 1 daily summary if volume is high

---

## 18. Implementation Priority

### Phase 1 (V1 — Days 1–15)
Core gamification that must ship at launch:

- [ ] XP + Level system with formula
- [ ] HP system with damage and recovery
- [ ] AiCoin economy (earn + spend)
- [ ] Attribute system (all 5, auto-gain logic)
- [ ] Level-up Stat Point allocation screen
- [ ] Rank system (E through S display)
- [ ] System Awakening onboarding flow
- [ ] Daily + Weekly quest templates (35 quests)
- [ ] D-rank and C-rank Dungeon system
- [ ] Streak system with freeze
- [ ] Badge catalog (40 standard badges)
- [ ] Global leaderboard (weekly + all-time)
- [ ] Friends system + 1v1 challenges
- [ ] HP penalty cascade (replacing System Lockdown)
- [ ] Level Regression event with recovery path
- [ ] Streak Decay Warning notifications

### Phase 2 (V2 — First Major Update)
Social and depth layer:

- [ ] Guild system (full)
- [ ] A-rank Dungeons (guild co-op)
- [ ] S-rank Raid system
- [ ] Accountability Pact
- [ ] Secret badges (10)
- [ ] System Cache loot boxes
- [ ] Guild leaderboard
- [ ] Bangladesh regional leaderboard
- [ ] Weekly Boss event
- [ ] Guild treasury + buffs

### Phase 3 (V3 — Endgame)
Long-term retention:

- [ ] SSS Rank discovery mechanic
- [ ] Sealed System Skills unlock tree
- [ ] Seasonal events (Eid challenge, New Year reset)
- [ ] AiCoin gifting between friends
- [ ] Guild vs Guild events
- [ ] Custom avatar cosmetics (earnable + purchasable frames)
- [ ] Deep behavioral analytics dashboard

---

> *"The System does not care about excuses. It records only actions."*

---

**Document version:** 2.0  
**Last updated:** April 2026  
**Author:** SelfUp Design System
