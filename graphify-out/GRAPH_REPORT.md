# Graph Report - Selfup Ai  (2026-05-09)

## Corpus Check
- 196 files · ~197,136 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 611 nodes · 732 edges · 34 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 197 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 84 edges
2. `executeAiTask()` - 20 edges
3. `POST()` - 16 edges
4. `PATCH()` - 12 edges
5. `generateResponse()` - 12 edges
6. `addAiTask()` - 12 edges
7. `supabaseServer()` - 12 edges
8. `TaskInjectionService` - 11 edges
9. `GamificationService` - 10 edges
10. `TaskEconomyService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `executeAiTask()` --calls--> `deactivateExistingPlan()`  [INFERRED]
  web\src\lib\worker.ts → web\src\lib\fitness\planGenerator.ts
- `executeAiTask()` --calls--> `analyzePerformance()`  [INFERRED]
  web\src\lib\worker.ts → web\src\lib\fitness\adaptationEngine.ts
- `GET()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `needsRetrieval()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-memory.ts

## Hyperedges (group relationships)
- **Core Product Modules** — task_management, habit_tracking, fitness_module, skill_roadmaps [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (56): POST(), POST(), GET(), GET(), GET(), POST(), PATCH(), GET() (+48 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (30): POST(), buildLiveStateBlock(), DELETE(), fetchConversationHistory(), GET(), POST(), suggestAdjustment(), injectDietHabits() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (13): GET(), getDb(), POST(), GET(), getDb(), POST(), calculateHpPenalty(), calculateTaskXp() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (24): GET(), POST(), POST(), executeActions(), executeConfirmedAction(), getServiceClient(), handleCreateDaily(), handleCreateHabit() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (8): fetchData(), handleLogFood(), handleAutoSchedule(), handleRevertSchedule(), handleTimelineDrop(), handleUnscheduleTask(), handleAddHabit(), handleAddTodo()

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (9): calculateHpDamageReduction(), calculateMaxHp(), getHpState(), getRank(), getRankLetter(), getXpModifier(), xpToNextLevel(), AttributeService (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (10): fetchConversations(), handleDeleteChat(), handleSendMessage(), startNewChat(), setLoggingHabit(), setProfile(), fetchActivities(), fetchAiQuestions() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (9): GET(), batchCheckAvailability(), checkAvailability(), findNextFreeSlots(), timeOverlaps(), batchCheckAvailability(), checkAvailability(), findNextFreeSlots() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.38
Nodes (5): cleanupPlanTasks(), DELETE(), GET(), getDb(), PATCH()

### Community 9 - "Community 9"
Cohesion: 0.27
Nodes (9): buildPlanPrompt(), deactivateExistingPlan(), generateFitnessPlan(), saveDietPlan(), savePlanToDb(), upsertExercise(), batchGetExerciseVideos(), cacheExerciseVideo() (+1 more)

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
Cohesion: 0.46
Nodes (7): fetchRoadmap(), fetchSessions(), fetchSkills(), handleAddSkill(), handleCompleteMilestone(), handleCompleteTopic(), handleLogSession()

### Community 15 - "Community 15"
Cohesion: 0.32
Nodes (3): fetchAll(), handleAddTask(), handleCompleteTask()

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (1): DungeonService

### Community 17 - "Community 17"
Cohesion: 0.38
Nodes (5): GET(), POST(), analyzePerformance(), applyAdjustment(), ignoreAdjustment()

### Community 18 - "Community 18"
Cohesion: 0.48
Nodes (5): GET(), POST(), batchResolveSkillResources(), cacheSkillResource(), resolveSkillResource()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (1): QuestService

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (7): AI Coin Economy, Fitness Module, Gamification System, Habit Tracking, Streak System, Task Management, XP & Leveling

### Community 22 - "Community 22"
Cohesion: 0.4
Nodes (1): BadgeService

### Community 23 - "Community 23"
Cohesion: 0.6
Nodes (2): getDb(), POST()

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (2): fetchDashboardData(), handleGeneratePlan()

### Community 28 - "Community 28"
Cohesion: 0.83
Nodes (3): GET(), getDb(), POST()

### Community 32 - "Community 32"
Cohesion: 0.5
Nodes (2): FitnessSessionPage(), createServerClient()

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): fetchAll(), handleAddFriend()

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (2): getDb(), POST()

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (1): PATCH()

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (2): fetchMetrics(), handleSubmit()

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): AI Companion (Aria), AI Memory System, Skill Roadmaps

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (3): Backend API (Express/Supabase), SelfUp Focus Extension, Focus Mode

### Community 115 - "Community 115"
Cohesion: 1.0
Nodes (1): SelfUp Architecture

### Community 116 - "Community 116"
Cohesion: 1.0
Nodes (1): Frontend Web (Next.js)

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): PostgreSQL Database Schema

## Knowledge Gaps
- **13 isolated node(s):** `SelfUp Architecture`, `AI Memory System`, `Task Management`, `Habit Tracking`, `Fitness Module` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (8 nodes): `DungeonService`, `.checkDungeonProgress()`, `.constructor()`, `.expireUserDungeons()`, `.formatDungeon()`, `.getActiveDungeons()`, `.spawnDailyDungeon()`, `dungeon.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (7 nodes): `QuestService`, `.checkAndUpdateProgress()`, `.computeExpiration()`, `.constructor()`, `.expireStaleQuests()`, `.getTargetValue()`, `quest.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (6 nodes): `BadgeService`, `.awardBadge()`, `.checkBadgeUnlocks()`, `.constructor()`, `.getUserBadges()`, `badge.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (5 nodes): `getDb()`, `POST()`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (4 nodes): `fetchDashboardData()`, `handleGeneratePlan()`, `handleOpenAiModal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (4 nodes): `FitnessSessionPage()`, `createServerClient()`, `page.tsx`, `supabase-server-user.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `fetchAll()`, `handleAddFriend()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (3 nodes): `getDb()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `PATCH()`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (3 nodes): `fetchMetrics()`, `handleSubmit()`, `BodyView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `SelfUp Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `Frontend Web (Next.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `PostgreSQL Database Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 36`, `Community 37`, `Community 7`, `Community 8`, `Community 10`, `Community 17`, `Community 18`, `Community 23`, `Community 28`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 1` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `executeAiTask()` connect `Community 1` to `Community 9`, `Community 3`, `Community 17`, `Community 7`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `verifyAuth()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`verifyAuth()` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `executeAiTask()` (e.g. with `addAiTask()` and `getUserModelConfig()`) actually correct?**
  _`executeAiTask()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `POST()` (e.g. with `verifyAuth()` and `fetchUserMemory()`) actually correct?**
  _`POST()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `PATCH()` (e.g. with `verifyAuth()` and `calculateTaskXp()`) actually correct?**
  _`PATCH()` has 4 INFERRED edges - model-reasoned connections that need verification._