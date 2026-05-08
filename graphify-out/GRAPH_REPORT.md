# Graph Report - Selfup Ai  (2026-05-09)

## Corpus Check
- 194 files · ~195,179 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 602 nodes · 724 edges · 33 communities detected
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
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 114|Community 114]]

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
- `GET()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `getUserModelConfig()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\model-config.ts
- `POST()` --calls--> `needsRetrieval()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-memory.ts
- `POST()` --calls--> `generateResponse()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\gemma.ts

## Hyperedges (group relationships)
- **Core Product Modules** — task_management, habit_tracking, fitness_module, skill_roadmaps [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (50): POST(), POST(), GET(), GET(), PATCH(), PATCH(), GET(), GET() (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (27): GET(), POST(), POST(), analyzePerformance(), applyAdjustment(), ignoreAdjustment(), suggestAdjustment(), injectDietHabits() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (8): fetchData(), handleLogFood(), handleAutoSchedule(), handleRevertSchedule(), handleTimelineDrop(), handleUnscheduleTask(), handleAddHabit(), handleAddTodo()

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (9): calculateHpDamageReduction(), calculateMaxHp(), getHpState(), getRank(), getRankLetter(), getXpModifier(), xpToNextLevel(), AttributeService (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (12): GET(), getDb(), POST(), GET(), getDb(), POST(), calculateHpPenalty(), calculateTaskXp() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (20): GET(), POST(), POST(), executeActions(), executeConfirmedAction(), getServiceClient(), handleCreateDaily(), handleCreateHabit() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (19): buildLiveStateBlock(), DELETE(), fetchConversationHistory(), GET(), POST(), parseActions(), clearUserMemory(), embedAndStoreMessage() (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (10): fetchConversations(), handleDeleteChat(), handleSendMessage(), startNewChat(), setLoggingHabit(), setProfile(), fetchActivities(), fetchAiQuestions() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): GET(), POST(), supabaseServer(), DELETE(), GET(), POST(), PUT(), GET() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.26
Nodes (9): GET(), batchCheckAvailability(), checkAvailability(), findNextFreeSlots(), timeOverlaps(), batchCheckAvailability(), checkAvailability(), findNextFreeSlots() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.38
Nodes (5): cleanupPlanTasks(), DELETE(), GET(), getDb(), PATCH()

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (6): completeSession(), getOrCreateSession(), logSetComplete(), POST(), GET(), POST()

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (1): TaskEconomyService

### Community 13 - "Community 13"
Cohesion: 0.28
Nodes (4): fetchMoodboard(), fetchOutfits(), handleAddMoodboard(), handleAddOutfit()

### Community 15 - "Community 15"
Cohesion: 0.39
Nodes (5): async(), fetchQuests(), handleAbandon(), handleAccept(), handleComplete()

### Community 16 - "Community 16"
Cohesion: 0.32
Nodes (3): fetchAll(), handleAddTask(), handleCompleteTask()

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (1): DungeonService

### Community 18 - "Community 18"
Cohesion: 0.52
Nodes (6): fetchRoadmap(), fetchSessions(), fetchSkills(), handleAddSkill(), handleLogSession(), handleToggleMilestone()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (1): QuestService

### Community 20 - "Community 20"
Cohesion: 0.48
Nodes (5): GET(), POST(), batchResolveSkillResources(), cacheSkillResource(), resolveSkillResource()

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (7): AI Coin Economy, Fitness Module, Gamification System, Habit Tracking, Streak System, Task Management, XP & Leveling

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (1): BadgeService

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (2): getDb(), POST()

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (2): fetchDashboardData(), handleGeneratePlan()

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (2): FitnessSessionPage(), createServerClient()

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (2): fetchAll(), handleAddFriend()

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): getDb(), POST()

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (2): fetchMetrics(), handleSubmit()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): AI Companion (Aria), AI Memory System, Skill Roadmaps

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (3): Backend API (Express/Supabase), SelfUp Focus Extension, Focus Mode

### Community 112 - "Community 112"
Cohesion: 1.0
Nodes (1): SelfUp Architecture

### Community 113 - "Community 113"
Cohesion: 1.0
Nodes (1): Frontend Web (Next.js)

### Community 114 - "Community 114"
Cohesion: 1.0
Nodes (1): PostgreSQL Database Schema

## Knowledge Gaps
- **13 isolated node(s):** `SelfUp Architecture`, `AI Memory System`, `Task Management`, `Habit Tracking`, `Fitness Module` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (10 nodes): `TaskEconomyService`, `.applyAttributeMultiplier()`, `.applyHpDamage()`, `.applyXpPenalty()`, `.awardXp()`, `.constructor()`, `.getHpPenalty()`, `.getXpPenalty()`, `.getXpReward()`, `.recoverHp()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (8 nodes): `DungeonService`, `.checkDungeonProgress()`, `.constructor()`, `.expireUserDungeons()`, `.formatDungeon()`, `.getActiveDungeons()`, `.spawnDailyDungeon()`, `dungeon.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (7 nodes): `QuestService`, `.checkAndUpdateProgress()`, `.computeExpiration()`, `.constructor()`, `.expireStaleQuests()`, `.getTargetValue()`, `quest.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `BadgeService`, `.awardBadge()`, `.checkBadgeUnlocks()`, `.constructor()`, `.getUserBadges()`, `badge.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `getDb()`, `POST()`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (4 nodes): `fetchDashboardData()`, `handleGeneratePlan()`, `handleOpenAiModal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (4 nodes): `FitnessSessionPage()`, `createServerClient()`, `page.tsx`, `supabase-server-user.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (3 nodes): `fetchAll()`, `handleAddFriend()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `getDb()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (3 nodes): `fetchMetrics()`, `handleSubmit()`, `BodyView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `SelfUp Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `Frontend Web (Next.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `PostgreSQL Database Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `Community 0` to `Community 1`, `Community 35`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 20`, `Community 24`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 6` to `Community 0`, `Community 1`, `Community 5`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `executeAiTask()` connect `Community 1` to `Community 9`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `verifyAuth()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`verifyAuth()` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `executeAiTask()` (e.g. with `addAiTask()` and `getUserModelConfig()`) actually correct?**
  _`executeAiTask()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `POST()` (e.g. with `verifyAuth()` and `fetchUserMemory()`) actually correct?**
  _`POST()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `PATCH()` (e.g. with `verifyAuth()` and `calculateTaskXp()`) actually correct?**
  _`PATCH()` has 4 INFERRED edges - model-reasoned connections that need verification._