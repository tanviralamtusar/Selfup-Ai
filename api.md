# SelfUp — API Reference

**Base URL:** `https://selfup.botbhai.net/api`  
**Auth:** Bearer token in `Authorization` header (Supabase JWT)  
**Format:** All requests/responses in JSON  
**Success wrapper:** `{ success: true, data: ... }`  
**Error wrapper:** `{ success: false, error: "message" }`

---

## Health Check
```
GET /health
Response: { status: "ok", version: "1.0.0" }
```

---

## Auth (`/auth`)

### Register
```
POST /auth/register
Body: { email, password, display_name }
Response: { user, session }
```

### Login
```
POST /auth/login
Body: { email, password }
Response: { user, session }
```

### Google OAuth
```
GET /auth/google              → redirects to Google
GET /auth/google/callback     → handles callback, returns session
```

### Logout
```
POST /auth/logout
Headers: Authorization required
Response: { success: true }
```

### Get Current User
```
GET /auth/me
Headers: Authorization required
Response: { user, profile }
```

### Forgot Password
```
POST /auth/forgot-password
Body: { email }
Response: { success: true }
```

---

## Onboarding (`/onboarding`)

### Start (AI Interview)
```
POST /onboarding/start
Body: {
  goals: ['fitness', 'skills', 'time', 'style'],
  basic: { age, gender, timezone },
  fitness?: { current_weight, target_weight, activity_level, diet_pref },
  skills?: [{ name, current_level, hours_per_week }],
  time?: { sleep_time, wake_time, biggest_time_waste },
  style?: { body_type, color_prefs, style_vibe }
}
Response: {
  ai_questions: string[]  // AI follow-up questions for chat
}
```

### Complete (Generate Initial Plan)
```
POST /onboarding/complete
Body: {
  avatar_type: 'rpg' | 'photo',
  avatar_key?: string,         // RPG avatar key
  photo?: FormData,            // if photo type
  ai_persona_name: string,
  ai_persona_style: 'friendly' | 'strict' | 'motivational' | 'neutral',
  interview_answers: { question: string, answer: string }[]
}
Response: {
  initial_plan: {
    day1_schedule: Task[],
    roadmaps: SkillRoadmap[],
    quests: Quest[],
    workout_plan?: WorkoutPlan,
    welcome_message: string
  }
}
```

---

## AI (`/ai`)

### Send Chat Message
```
POST /ai/chat
Cost: 1 AiCoin
Body: {
  conversation_id?: string,   // null = start new conversation
  message: string
}
Response: {
  conversation_id: string,
  message: { id, role: 'assistant', content, created_at },
  actions_executed: string[],  // list of actions AI triggered
  coins_remaining: number
}
OR if rate limited:
Status 202: { queued: true, queue_id: string, estimated_wait_sec: number }
```

### List Conversations
```
GET /ai/conversations?page=1&limit=20
Response: { conversations: [...], total: number }
```

### Get Conversation Messages
```
GET /ai/conversations/:id/messages?page=1&limit=50
Response: { messages: [...], total: number }
```

### Delete Conversation
```
DELETE /ai/conversations/:id
Response: { success: true }
```

### AI Action: Schedule Day
```
POST /ai/actions/schedule
Cost: 5 AiCoins
Body: { date?: string }   // default: today
Response: { tasks_created: number, schedule: Task[] }
```

### AI Action: Analysis Report
```
POST /ai/actions/analyze
Cost: 10 AiCoins
Body: { period: 'week' | 'month', category?: 'fitness'|'skills'|'time'|'style'|'all' }
Response: { report: string, insights: string[], recommendations: string[] }
```

### AI Action: Generate Skill Roadmap
```
POST /ai/actions/roadmap
Cost: 15 AiCoins
Body: { skill_id: string }
Response: { roadmap: SkillRoadmap }
```

### Queue Status
```
GET /ai/queue/:queue_id
Response: { status: 'pending'|'processing'|'done'|'failed', result?: any }
```

### Coin Balance
```
GET /ai/coins/balance
Response: { balance: number, daily_cap: number, daily_earned_today: number }
```

### Coin Transactions
```
GET /ai/coins/transactions?page=1&limit=20
Response: { transactions: [...], total: number }
```

---

## Tasks (`/tasks`)

### List Tasks
```
GET /tasks?status=pending&date=2025-01-14&page=1&limit=50
Response: { tasks: Task[], total: number }
```

### Create Task
```
POST /tasks
Body: {
  title: string,
  description?: string,
  priority: 'low'|'medium'|'high'|'critical',
  due_date?: string,    // YYYY-MM-DD
  due_time?: string,    // HH:MM
  is_recurring?: boolean,
  recurrence_rule?: string
}
Response: { task: Task }
```

### Update Task
```
PATCH /tasks/:id
Body: { ...partial task fields }
Response: { task: Task }
```

### Complete Task
```
PATCH /tasks/:id/complete
Response: { task: Task, xp_earned: number, coins_earned: number, level_up?: boolean }
```

### Delete Task
```
DELETE /tasks/:id
Response: { success: true }
```

---

## Habits (`/habits`)

### List Habits
```
GET /habits
Response: { habits: Habit[] }
```

### Create Habit
```
POST /habits
Body: { title, frequency, target_days?, reminder_time?, color?, icon? }
Response: { habit: Habit }
```

### Log Habit Today
```
POST /habits/:id/log
Body: { status: 'done'|'skipped', notes?: string }
Response: { log: HabitLog, streak: number, xp_earned: number }
```

### Get Habit History (Heatmap)
```
GET /habits/:id/history?from=2025-01-01&to=2025-01-31
Response: { logs: { date: string, status: string }[] }
```

---

## Fitness (`/fitness`)

### Get Today's Workout Plan
```
GET /fitness/plans/today
Response: { plan: WorkoutPlan, day: WorkoutDay, exercises: Exercise[] }
```

### Log Workout Session
```
POST /fitness/logs
Body: {
  plan_id?: string,
  day_id?: string,
  duration_min: number,
  exercises: [{ exercise_id, sets_done: [{set, reps, weight}] }],
  notes?: string
}
Response: { log: WorkoutLog, xp_earned: number, streak: number }
```

### Log Food
```
POST /fitness/food-logs
Body: { meal_type, food_name, calories, protein_g?, carbs_g?, fat_g?, quantity?, unit? }
Response: { log: FoodLog, daily_totals: MacroSummary }
```

### Get Daily Nutrition
```
GET /fitness/food-logs/daily?date=2025-01-14
Response: { logs: FoodLog[], totals: MacroSummary, target: MacroTarget }
```

### Log Water
```
POST /fitness/water-logs
Body: { amount_ml: number }
Response: { total_today_ml: number }
```

### Log Body Metrics
```
POST /fitness/metrics
Body: { weight_kg?, height_cm?, chest_cm?, waist_cm?, hip_cm?, body_fat_pct?, notes? }
Response: { metric: BodyMetric }
```

### Upload Body Photo
```
POST /fitness/metrics/photo
Body: FormData (field: photo, also: metric_id or date)
Response: { photo_url: string }
```

### Get Body Progress
```
GET /fitness/metrics?from=2025-01-01
Response: { metrics: BodyMetric[], chart_data: { date, weight }[] }
```

---

## Skills (`/skills`)

### List Skills
```
GET /skills
Response: { skills: Skill[] }
```

### Create Skill
```
POST /skills
Body: { name, description?, category?, tracking_mode?, color?, icon? }
Response: { skill: Skill }
```

### Get Skill with Roadmap
```
GET /skills/:id
Response: { skill: Skill, roadmap: SkillRoadmap, recent_sessions: SkillSession[] }
```

### Log Skill Session
```
POST /skills/:id/session
Body: { duration_min?, points?, notes?, mood? }
Response: { session: SkillSession, xp_earned: number, streak: number }
```

### Complete Milestone
```
PATCH /skills/milestones/:milestone_id/complete
Response: { milestone: SkillMilestone, xp_earned: number }
```

---

## Style (`/style`)

### Get/Update Style Profile
```
GET  /style/profile
PUT  /style/profile
Body: { body_type?, skin_tone?, color_prefs?, style_vibe?, budget_tier?, notes? }
```

### Get AI Recommendations
```
GET /style/recommendations
Response: { recommendations: StyleRecommendation[] }
```

### Generate New Recommendation (AI)
```
POST /style/recommendations/generate
Cost: 5 AiCoins
Response: { recommendation: StyleRecommendation }
```

### Log Outfit
```
POST /style/outfit-logs
Body: { description?, photo?: FormData, rating?, tags?, notes? }
Response: { log: OutfitLog }
```

---

## Gamification (`/gamification`)

### Get Full Profile
```
GET /gamification/profile
Response: {
  level, xp, xp_to_next_level, total_xp,
  ai_coins, streaks: { overall, fitness, skills, habits, time },
  badges: Badge[],
  active_quests_count: number
}
```

### Get Active + Available Quests
```
GET /gamification/quests?type=daily|weekly|all
Response: { active: UserQuest[], available: Quest[] }
```

### Join Quest
```
POST /gamification/quests/:quest_id/join
Response: { user_quest: UserQuest }
```

### Get Leaderboard
```
GET /gamification/leaderboard?type=global|friends&period=weekly|alltime&page=1
Response: {
  entries: [{ rank, user: PublicProfile, score, xp, streak }],
  my_rank: number,
  total: number
}
```

---

## Social (`/social`)

### Search Users
```
GET /users/search?q=rifat&limit=10
Response: { users: PublicProfile[] }
```

### Get Public Profile
```
GET /users/:username
Response: { profile: PublicProfile, badges: Badge[], stats: PublicStats }
```

### List Friends
```
GET /social/friends
Response: { friends: FriendProfile[], pending_received: FriendRequest[], pending_sent: FriendRequest[] }
```

### Send Friend Request
```
POST /social/friends/request
Body: { username: string }
Response: { friendship: Friendship }
```

### Respond to Friend Request
```
PATCH /social/friends/:friendship_id
Body: { action: 'accept' | 'reject' }
Response: { friendship: Friendship }
```

### Create Challenge
```
POST /social/challenges
Body: { challenged_username, quest_id, duration_days, metric_type }
Response: { challenge: Challenge }
```

---

## Notifications (`/notifications`)

### List Notifications
```
GET /notifications?page=1&limit=20&unread_only=false
Response: { notifications: Notification[], unread_count: number }
```

### Mark All Read
```
PATCH /notifications/read-all
Response: { success: true }
```

### Get/Update Settings
```
GET  /notifications/settings
PUT  /notifications/settings
Body: { push_enabled?, email_enabled?, morning_checkin?, ... }
```

### Subscribe to Push
```
POST /notifications/subscribe
Body: { subscription: PushSubscription }  // Web Push subscription object
Response: { success: true }
```

---

## User (`/user`)

### Update Profile
```
PATCH /user/profile
Body: { display_name?, username?, bio?, timezone?, ai_persona_name?, ai_persona_style?, theme? }
Response: { profile: UserProfile }
```

### Upload Avatar
```
POST /user/avatar
Body: FormData (field: avatar)
Response: { avatar_url: string }
```

### Export Data
```
POST /user/export
Response: JSON file download (all user data)
```

### Delete Account
```
DELETE /user/account
Body: { password: string, confirm: "DELETE" }
Response: { success: true }
```

### Get Subscription
```
GET /user/subscription
Response: { plan, status, expires_at, coins_balance }
```
