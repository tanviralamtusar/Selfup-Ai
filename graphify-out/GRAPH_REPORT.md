# Graph Report - Selfup Ai  (2026-05-08)

## Corpus Check
- 179 files · ~180,150 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 562 nodes · 662 edges · 33 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 74 edges
2. `POST()` - 16 edges
3. `executeAiTask()` - 14 edges
4. `PATCH()` - 12 edges
5. `supabaseServer()` - 12 edges
6. `TaskInjectionService` - 11 edges
7. `GamificationService` - 10 edges
8. `addAiTask()` - 10 edges
9. `TaskEconomyService` - 10 edges
10. `DELETE()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `getUserModelConfig()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\model-config.ts
- `POST()` --calls--> `needsRetrieval()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-memory.ts
- `POST()` --calls--> `parseActions()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-actions.ts

## Hyperedges (group relationships)
- **Core Product Modules** — task_management, habit_tracking, fitness_module, skill_roadmaps [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (47): POST(), POST(), GET(), GET(), PATCH(), PATCH(), GET(), GET() (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (8): fetchData(), handleLogFood(), handleAutoSchedule(), handleRevertSchedule(), handleTimelineDrop(), handleUnscheduleTask(), handleAddHabit(), handleAddTodo()

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (19): GET(), POST(), analyzePerformance(), applyAdjustment(), ignoreAdjustment(), suggestAdjustment(), injectDietHabits(), injectWorkoutDailies() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (9): calculateHpDamageReduction(), calculateMaxHp(), getHpState(), getRank(), getRankLetter(), getXpModifier(), xpToNextLevel(), AttributeService (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (20): POST(), buildLiveStateBlock(), DELETE(), fetchConversationHistory(), GET(), POST(), clearUserMemory(), embedAndStoreMessage() (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (19): POST(), executeActions(), executeConfirmedAction(), getServiceClient(), handleCreateDaily(), handleCreateHabit(), handleCreateTodo(), handleFitnessInterviewStart() (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (8): GET(), getDb(), POST(), calculateTaskXp(), TaskInjectionService, GET(), getDb(), POST()

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (12): GET(), POST(), supabaseServer(), DELETE(), GET(), POST(), PUT(), GET() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (5): GET(), getDb(), POST(), calculateHpPenalty(), TaskEconomyService

### Community 9 - "Community 9"
Cohesion: 0.38
Nodes (5): cleanupPlanTasks(), DELETE(), GET(), getDb(), PATCH()

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (6): completeSession(), getOrCreateSession(), logSetComplete(), POST(), GET(), POST()

### Community 11 - "Community 11"
Cohesion: 0.28
Nodes (4): fetchMoodboard(), fetchOutfits(), handleAddMoodboard(), handleAddOutfit()

### Community 13 - "Community 13"
Cohesion: 0.39
Nodes (5): async(), fetchQuests(), handleAbandon(), handleAccept(), handleComplete()

### Community 14 - "Community 14"
Cohesion: 0.32
Nodes (3): fetchAll(), handleAddTask(), handleCompleteTask()

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (1): DungeonService

### Community 16 - "Community 16"
Cohesion: 0.52
Nodes (6): fetchRoadmap(), fetchSessions(), fetchSkills(), handleAddSkill(), handleLogSession(), handleToggleMilestone()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (1): QuestService

### Community 18 - "Community 18"
Cohesion: 0.43
Nodes (5): GET(), batchCheckAvailability(), checkAvailability(), findNextFreeSlots(), timeOverlaps()

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (7): AI Coin Economy, Fitness Module, Gamification System, Habit Tracking, Streak System, Task Management, XP & Leveling

### Community 20 - "Community 20"
Cohesion: 0.47
Nodes (4): fetchConversations(), handleDeleteChat(), handleSendMessage(), startNewChat()

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (2): fetchAiQuestions(), handleNext()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (1): BadgeService

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (2): getDb(), POST()

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (2): setLoggingHabit(), fetchActivities()

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (2): fetchDashboardData(), handleGeneratePlan()

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (2): FitnessSessionPage(), createServerClient()

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): fetchAll(), handleAddFriend()

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (2): fetchMetrics(), handleSubmit()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): Backend API (Express/Supabase), SelfUp Focus Extension, Focus Mode

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (3): AI Companion (Aria), AI Memory System, Skill Roadmaps

### Community 108 - "Community 108"
Cohesion: 1.0
Nodes (1): SelfUp Architecture

### Community 109 - "Community 109"
Cohesion: 1.0
Nodes (1): Frontend Web (Next.js)

### Community 110 - "Community 110"
Cohesion: 1.0
Nodes (1): PostgreSQL Database Schema

## Knowledge Gaps
- **13 isolated node(s):** `SelfUp Architecture`, `AI Memory System`, `Task Management`, `Habit Tracking`, `Fitness Module` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 15`** (8 nodes): `DungeonService`, `.checkDungeonProgress()`, `.constructor()`, `.expireUserDungeons()`, `.formatDungeon()`, `.getActiveDungeons()`, `.spawnDailyDungeon()`, `dungeon.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (7 nodes): `QuestService`, `.checkAndUpdateProgress()`, `.computeExpiration()`, `.constructor()`, `.expireStaleQuests()`, `.getTargetValue()`, `quest.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (6 nodes): `fetchAiQuestions()`, `handleBack()`, `handleComplete()`, `handleNext()`, `toggleGoal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `BadgeService`, `.awardBadge()`, `.checkBadgeUnlocks()`, `.constructor()`, `.getUserBadges()`, `badge.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `getDb()`, `POST()`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (5 nodes): `setLoggingHabit()`, `cn()`, `fetchActivities()`, `page.tsx`, `ActivityFeed.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (4 nodes): `fetchDashboardData()`, `handleGeneratePlan()`, `handleOpenAiModal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `FitnessSessionPage()`, `createServerClient()`, `page.tsx`, `supabase-server-user.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `fetchAll()`, `handleAddFriend()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (3 nodes): `fetchMetrics()`, `handleSubmit()`, `BodyView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `SelfUp Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (1 nodes): `Frontend Web (Next.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (1 nodes): `PostgreSQL Database Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `Community 0` to `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 18`, `Community 24`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 4` to `Community 0`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `calculateTaskXp()` connect `Community 6` to `Community 8`, `Community 9`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 73 inferred relationships involving `verifyAuth()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`verifyAuth()` has 73 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `POST()` (e.g. with `verifyAuth()` and `fetchUserMemory()`) actually correct?**
  _`POST()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `executeAiTask()` (e.g. with `addAiTask()` and `getUserModelConfig()`) actually correct?**
  _`executeAiTask()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `PATCH()` (e.g. with `verifyAuth()` and `calculateTaskXp()`) actually correct?**
  _`PATCH()` has 4 INFERRED edges - model-reasoned connections that need verification._