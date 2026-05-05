# Graph Report - Selfup Ai  (2026-05-05)

## Corpus Check
- 175 files · ~178,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 554 nodes · 653 edges · 33 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 75 edges
2. `POST()` - 16 edges
3. `executeAiTask()` - 14 edges
4. `PATCH()` - 12 edges
5. `supabaseServer()` - 12 edges
6. `TaskInjectionService` - 11 edges
7. `GamificationService` - 10 edges
8. `TaskEconomyService` - 10 edges
9. `DELETE()` - 9 edges
10. `executeActions()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `executeAiTask()` --calls--> `injectWorkoutDailies()`  [INFERRED]
  web\src\lib\worker.ts → web\src\lib\fitness\dailyInjector.ts
- `executeAiTask()` --calls--> `injectDietHabits()`  [INFERRED]
  web\src\lib\worker.ts → web\src\lib\fitness\dailyInjector.ts
- `executeAiTask()` --calls--> `analyzePerformance()`  [INFERRED]
  web\src\lib\worker.ts → web\src\lib\fitness\adaptationEngine.ts
- `GET()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts

## Hyperedges (group relationships)
- **Core Product Modules** — task_management, habit_tracking, fitness_module, skill_roadmaps [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (57): POST(), POST(), GET(), GET(), PATCH(), GET(), POST(), PATCH() (+49 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (29): POST(), buildLiveStateBlock(), DELETE(), fetchConversationHistory(), GET(), POST(), suggestAdjustment(), buildPlanPrompt() (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (8): fetchData(), handleLogFood(), handleAutoSchedule(), handleRevertSchedule(), handleTimelineDrop(), handleUnscheduleTask(), handleAddHabit(), handleAddTodo()

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (9): calculateHpDamageReduction(), calculateMaxHp(), getHpState(), getRank(), getRankLetter(), getXpModifier(), xpToNextLevel(), AttributeService (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (8): GET(), getDb(), POST(), calculateTaskXp(), TaskInjectionService, GET(), getDb(), POST()

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (16): POST(), executeActions(), executeConfirmedAction(), getServiceClient(), handleCreateDaily(), handleCreateHabit(), handleCreateTodo(), handleFitnessInterviewStart() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (5): GET(), getDb(), POST(), calculateHpPenalty(), TaskEconomyService

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (7): cleanupPlanTasks(), injectDietHabits(), injectWorkoutDailies(), DELETE(), GET(), getDb(), PATCH()

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (6): completeSession(), getOrCreateSession(), logSetComplete(), POST(), GET(), POST()

### Community 9 - "Community 9"
Cohesion: 0.28
Nodes (4): fetchMoodboard(), fetchOutfits(), handleAddMoodboard(), handleAddOutfit()

### Community 11 - "Community 11"
Cohesion: 0.39
Nodes (5): async(), fetchQuests(), handleAbandon(), handleAccept(), handleComplete()

### Community 12 - "Community 12"
Cohesion: 0.32
Nodes (3): fetchAll(), handleAddTask(), handleCompleteTask()

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (1): DungeonService

### Community 14 - "Community 14"
Cohesion: 0.52
Nodes (6): fetchRoadmap(), fetchSessions(), fetchSkills(), handleAddSkill(), handleLogSession(), handleToggleMilestone()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (1): QuestService

### Community 16 - "Community 16"
Cohesion: 0.38
Nodes (5): GET(), POST(), analyzePerformance(), applyAdjustment(), ignoreAdjustment()

### Community 17 - "Community 17"
Cohesion: 0.43
Nodes (5): GET(), batchCheckAvailability(), checkAvailability(), findNextFreeSlots(), timeOverlaps()

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (7): AI Coin Economy, Fitness Module, Gamification System, Habit Tracking, Streak System, Task Management, XP & Leveling

### Community 19 - "Community 19"
Cohesion: 0.47
Nodes (4): fetchConversations(), handleDeleteChat(), handleSendMessage(), startNewChat()

### Community 20 - "Community 20"
Cohesion: 0.4
Nodes (2): fetchAiQuestions(), handleNext()

### Community 22 - "Community 22"
Cohesion: 0.4
Nodes (1): BadgeService

### Community 23 - "Community 23"
Cohesion: 0.6
Nodes (2): getDb(), POST()

### Community 24 - "Community 24"
Cohesion: 0.4
Nodes (2): setLoggingHabit(), fetchActivities()

### Community 28 - "Community 28"
Cohesion: 0.83
Nodes (3): GET(), getDb(), POST()

### Community 32 - "Community 32"
Cohesion: 0.83
Nodes (3): batchGetExerciseVideos(), cacheExerciseVideo(), getExerciseVideo()

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): fetchAll(), handleAddFriend()

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (2): getDb(), POST()

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (2): fetchMetrics(), handleSubmit()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (3): Backend API (Express/Supabase), SelfUp Focus Extension, Focus Mode

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): AI Companion (Aria), AI Memory System, Skill Roadmaps

### Community 107 - "Community 107"
Cohesion: 1.0
Nodes (1): SelfUp Architecture

### Community 108 - "Community 108"
Cohesion: 1.0
Nodes (1): Frontend Web (Next.js)

### Community 109 - "Community 109"
Cohesion: 1.0
Nodes (1): PostgreSQL Database Schema

## Knowledge Gaps
- **13 isolated node(s):** `SelfUp Architecture`, `AI Memory System`, `Task Management`, `Habit Tracking`, `Fitness Module` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (8 nodes): `DungeonService`, `.checkDungeonProgress()`, `.constructor()`, `.expireUserDungeons()`, `.formatDungeon()`, `.getActiveDungeons()`, `.spawnDailyDungeon()`, `dungeon.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (7 nodes): `QuestService`, `.checkAndUpdateProgress()`, `.computeExpiration()`, `.constructor()`, `.expireStaleQuests()`, `.getTargetValue()`, `quest.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (6 nodes): `fetchAiQuestions()`, `handleBack()`, `handleComplete()`, `handleNext()`, `toggleGoal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (6 nodes): `BadgeService`, `.awardBadge()`, `.checkBadgeUnlocks()`, `.constructor()`, `.getUserBadges()`, `badge.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (5 nodes): `getDb()`, `POST()`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `setLoggingHabit()`, `cn()`, `fetchActivities()`, `page.tsx`, `ActivityFeed.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `fetchAll()`, `handleAddFriend()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (3 nodes): `getDb()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (3 nodes): `fetchMetrics()`, `handleSubmit()`, `BodyView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `SelfUp Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `Frontend Web (Next.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (1 nodes): `PostgreSQL Database Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `Community 0` to `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 36`, `Community 16`, `Community 17`, `Community 23`, `Community 28`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 1` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `calculateTaskXp()` connect `Community 4` to `Community 6`, `Community 7`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 74 inferred relationships involving `verifyAuth()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`verifyAuth()` has 74 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `POST()` (e.g. with `verifyAuth()` and `fetchUserMemory()`) actually correct?**
  _`POST()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `executeAiTask()` (e.g. with `addAiTask()` and `getUserModelConfig()`) actually correct?**
  _`executeAiTask()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `PATCH()` (e.g. with `verifyAuth()` and `calculateTaskXp()`) actually correct?**
  _`PATCH()` has 4 INFERRED edges - model-reasoned connections that need verification._