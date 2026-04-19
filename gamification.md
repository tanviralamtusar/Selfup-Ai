# SelfUp — Gamification System

---

## XP & Level System

### Level Formula
```typescript
// XP required to reach next level (exponential curve)
function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

// Level thresholds
// Level 1 → 2:   100 XP
// Level 2 → 3:   283 XP
// Level 5 → 6:   559 XP
// Level 10 → 11: 1000 XP
// Level 20 → 21: 1789 XP
// Level 50:      ~35,355 XP total
```

### XP Earn Table
| Action | XP |
|--------|-----|
| Complete low-priority task | 5 |
| Complete medium-priority task | 10 |
| Complete high-priority task | 20 |
| Complete critical task | 35 |
| Complete habit (per habit) | 5 |
| Log workout session | 25 |
| Log skill session (per 30 min) | 15 |
| Log skill session + milestone completed | 50 |
| Upload body photo | 5 |
| Log outfit | 5 |
| Complete daily quest | 50–100 |
| Complete weekly quest | 150–300 |
| Complete challenge (win) | 200 |
| Complete challenge (participate) | 50 |
| 7-day streak | 100 |
| 14-day streak | 200 |
| 30-day streak | 500 |
| 100-day streak | 2000 |
| Level up bonus | 0 (cosmetic only) |

### Level Titles
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

## Streak System

### Types of Streaks
1. **Overall streak** — any activity logged today
2. **Fitness streak** — at least 1 workout logged
3. **Skills streak** — at least 1 skill session logged
4. **Habits streak** — all active habits completed
5. **Time streak** — at least 3 tasks completed

### Streak Logic
```typescript
// Run daily at 1am (streakCheck.job.ts)
// For each user:
//   If yesterday had activity → increment streak
//   If yesterday had NO activity → reset streak to 0
//   If streak_freeze_count > 0 AND no activity → use freeze, don't reset
//   Send notification if streak > 5 and at risk (no activity yet today)
```

### Streak Freeze
- Every user gets 1 streak freeze per week (auto-refilled Monday)
- Pro users get 3 freeze per week
- Used automatically when streak would break (user hasn't logged anything)
- Visual indicator: ice crystal icon on streak badge

### Streak Milestones
```
3 days:   "Hot Start" badge
7 days:   "Week Warrior" badge + 100 XP + 20 AiCoins
14 days:  "Two Weeks Strong" badge + 200 XP + 50 AiCoins
30 days:  "Monthly Master" badge + 500 XP + 100 AiCoins
60 days:  "Dedication" badge + 1000 XP + 200 AiCoins
100 days: "Century" badge + 2000 XP + 500 AiCoins
```

---

## Quest System

### Quest Types
| Type | Duration | Resets | Example |
|------|----------|--------|---------|
| Daily | 1 day | Every day | "Complete 3 tasks today" |
| Weekly | 7 days | Every Monday | "Log 5 workouts this week" |
| Monthly | 30 days | Every month | "Learn a skill for 30 days" |
| Challenge | Custom | Never | "Who has the most workouts this week?" |
| Story | Multi-week | Never | "30-Day Transformation" |
| AI-Generated | Custom | Never | Personal quests from AI |

### Quest Requirements Schema
```typescript
interface QuestRequirement {
  type: 
    | 'task_complete'      // Complete N tasks
    | 'habit_streak'       // Maintain habit streak for N days
    | 'workout_count'      // Log N workouts
    | 'skill_hours'        // Log N hours in any skill
    | 'body_photo'         // Upload N body photos
    | 'water_intake'       // Hit water target N days
    | 'calorie_target'     // Hit calorie target N days
    | 'skill_milestone'    // Complete N skill milestones
    | 'level_reach'        // Reach level N
    | 'coin_earn'          // Earn N coins total
    | 'friend_count'       // Add N friends
  value: number
  skill_id?: string        // For skill-specific quests
}
```

### Pre-Built Quest Templates (V1 — 30 quests)
```
DAILY:
- "Task Crusher" — Complete 5 tasks (XP:30, Coins:10)
- "Hydration Hero" — Hit water goal (XP:20, Coins:5)
- "Morning Mover" — Log workout before noon (XP:40, Coins:15)

WEEKLY:
- "7-Day Workout Challenge" — 5 workouts this week (XP:200, Coins:50)
- "Skill Sprint" — 10+ hours of skill work (XP:300, Coins:75)
- "Perfect Week" — Hit all habit targets Mon-Sun (XP:400, Coins:100)
- "Task Master" — Complete 25 tasks (XP:250, Coins:60)
- "Hydration Week" — Hit water goal every day (XP:150, Coins:40)

MONTHLY:
- "30-Day Fitness Challenge" (XP:1000, Coins:300, Badge)
- "Skill Master" — 40+ skill hours (XP:1200, Coins:350, Badge)
- "Consistency King" — 25-day activity streak (XP:2000, Coins:500, Badge)
```

### Quest Progress Tracking
```typescript
// After every relevant action, update quest progress
async function updateQuestProgress(userId: string, action: UserAction) {
  const activeQuests = await getUserActiveQuests(userId)
  for (const quest of activeQuests) {
    const updated = calculateProgress(quest, action)
    if (updated.isCompleted) {
      await completeQuest(userId, quest.id)  // awards XP + coins + badge
    } else {
      await saveProgress(userId, quest.id, updated.progress)
    }
  }
}
```

---

## Badge System

### Badge Catalog (V1 — 40 badges)

**Onboarding**
- `first_steps` — Complete onboarding
- `profile_complete` — Fill out full profile

**Streaks**
- `hot_start` — 3-day streak
- `week_warrior` — 7-day streak
- `monthly_master` — 30-day streak
- `century` — 100-day streak

**Fitness**
- `first_workout` — Log first workout
- `gym_rat` — 50 workouts logged
- `iron_will` — 100 workouts logged
- `nutrition_nerd` — Log food for 30 days
- `transformation` — Upload 30 body photos

**Skills**
- `learner` — Start first skill
- `dedicated` — 100 skill hours total
- `polymath` — 3 active skills
- `milestone_crusher` — Complete 20 milestones

**Time**
- `task_master` — Complete 100 tasks
- `habit_king` — 30 habits completed in a month
- `pomodoro_pro` — 50 pomodoro sessions

**Gamification**
- `rising_star` — Reach Level 10
- `elite` — Reach Level 25
- `legend` — Reach Level 50
- `quest_hero` — Complete 20 quests
- `coin_rich` — Earn 1000 AiCoins total

**Social**
- `social_butterfly` — Add 5 friends
- `challenger` — Complete 3 challenges
- `winner` — Win 5 challenges

**Rarity Colors**
```
Common:    Gray border
Rare:      Blue border + glow
Epic:      Purple border + glow
Legendary: Gold border + animated glow
```

---

## Leaderboard Scoring

### Score Formula
```typescript
function calculateLeaderboardScore(user: UserStats): number {
  return (
    user.total_xp * 1.0 +
    user.overall_streak * 50 +
    user.tasks_completed_this_week * 10 +
    user.workouts_this_week * 25 +
    user.skill_hours_this_week * 20 +
    user.habits_completed_this_week * 8 +
    user.quests_completed_this_week * 100
  )
}
```

### Leaderboard Types
- **Global Weekly** — all users, resets Monday midnight
- **Global All-Time** — total XP based, never resets
- **Friends Weekly** — among friend group only
- **Friends All-Time** — among friend group only

### Display
- Top 100 users shown
- User's own rank always shown (even if not in top 100)
- Rank change indicator (↑ up, ↓ down, — same vs yesterday)
- Avatar + username + level + score

---

## Challenge System

### How Challenges Work
1. User A challenges User B via `/u/:username` profile or friends list
2. Select quest template or create custom metric
3. Set duration (3 / 7 / 14 / 30 days)
4. User B accepts or declines (24hr window)
5. Both users have their progress tracked
6. At end date: winner determined automatically
7. Winner gets bonus XP + coins + "Winner" indicator on profile

### Challenge Metrics
- Most workouts logged
- Most tasks completed
- Longest streak maintained
- Most skill hours
- Most habits completed
- Highest XP earned in period

---

## RPG Avatar System

### Avatar Options (V1 — 16 avatars)
```
Warrior class (bold, athletic):  warrior_m1, warrior_m2, warrior_f1, warrior_f2
Scholar class (studious, calm):  scholar_m1, scholar_m2, scholar_f1, scholar_f2
Athlete class (sporty, dynamic): athlete_m1, athlete_m2, athlete_f1, athlete_f2
Artist class (creative, stylish): artist_m1, artist_m2, artist_f1, artist_f2
```
Each stored as illustrated SVG/PNG card (game-card style).  
User selects during onboarding, can change in settings.  
Photo mode: user uploads real photo, displayed in same card frame.

### Avatar Card Design
```
┌─────────────────┐
│  [Character     │
│   Illustration] │
│                 │
│ ───────────── │
│ {username}      │
│ Level {n} • {title}│
└─────────────────┘
```
