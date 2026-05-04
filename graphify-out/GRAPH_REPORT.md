# Graph Report - Selfup Ai  (2026-05-05)

## Corpus Check
- 168 files · ~167,085 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 521 nodes · 591 edges · 32 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 144 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 12|Community 12]]
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
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 71 edges
2. `PATCH()` - 12 edges
3. `supabaseServer()` - 12 edges
4. `TaskInjectionService` - 11 edges
5. `executeAiTask()` - 11 edges
6. `GamificationService` - 10 edges
7. `TaskEconomyService` - 10 edges
8. `POST()` - 9 edges
9. `DELETE()` - 9 edges
10. `fetchData()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `generateResponse()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\gemma.ts
- `POST()` --calls--> `parseActions()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-actions.ts
- `POST()` --calls--> `extractAndSaveMemory()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-memory.ts

## Hyperedges (group relationships)
- **Core Product Modules** — task_management, habit_tracking, fitness_module, skill_roadmaps [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (46): POST(), POST(), GET(), GET(), PATCH(), PATCH(), GET(), GET() (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (21): GET(), POST(), POST(), analyzePerformance(), applyAdjustment(), ignoreAdjustment(), suggestAdjustment(), injectDietHabits() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (8): fetchData(), handleLogFood(), handleAutoSchedule(), handleRevertSchedule(), handleTimelineDrop(), handleUnscheduleTask(), handleAddHabit(), handleAddTodo()

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (12): GET(), getDb(), POST(), GET(), getDb(), POST(), calculateHpPenalty(), calculateTaskXp() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (14): DELETE(), GET(), POST(), executeActions(), handleCreateTask(), handleFitnessInterviewStart(), handleFitnessPlanGenerate(), handleMemoryUpdate() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (8): calculateHpDamageReduction(), calculateMaxHp(), getHpState(), getRank(), getRankLetter(), getXpModifier(), xpToNextLevel(), GamificationService

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (11): GET(), POST(), supabaseServer(), DELETE(), GET(), POST(), PUT(), GET() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.38
Nodes (5): cleanupPlanTasks(), DELETE(), GET(), getDb(), PATCH()

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (6): completeSession(), getOrCreateSession(), logSetComplete(), POST(), GET(), POST()

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (1): TaskEconomyService

### Community 10 - "Community 10"
Cohesion: 0.28
Nodes (4): fetchMoodboard(), fetchOutfits(), handleAddMoodboard(), handleAddOutfit()

### Community 12 - "Community 12"
Cohesion: 0.39
Nodes (5): async(), fetchQuests(), handleAbandon(), handleAccept(), handleComplete()

### Community 13 - "Community 13"
Cohesion: 0.32
Nodes (3): fetchAll(), handleAddTask(), handleCompleteTask()

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (1): DungeonService

### Community 15 - "Community 15"
Cohesion: 0.52
Nodes (6): fetchRoadmap(), fetchSessions(), fetchSkills(), handleAddSkill(), handleLogSession(), handleToggleMilestone()

### Community 16 - "Community 16"
Cohesion: 0.43
Nodes (5): GET(), batchCheckAvailability(), checkAvailability(), findNextFreeSlots(), timeOverlaps()

### Community 17 - "Community 17"
Cohesion: 0.43
Nodes (1): AttributeService

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (1): QuestService

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
Cohesion: 0.4
Nodes (2): setLoggingHabit(), fetchActivities()

### Community 25 - "Community 25"
Cohesion: 0.6
Nodes (2): getDb(), POST()

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (2): fetchAll(), handleAddFriend()

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): getDb(), POST()

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (2): fetchMetrics(), handleSubmit()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (3): Backend API (Express/Supabase), SelfUp Focus Extension, Focus Mode

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): AI Companion (Aria), AI Memory System, Skill Roadmaps

### Community 104 - "Community 104"
Cohesion: 1.0
Nodes (1): SelfUp Architecture

### Community 105 - "Community 105"
Cohesion: 1.0
Nodes (1): Frontend Web (Next.js)

### Community 106 - "Community 106"
Cohesion: 1.0
Nodes (1): PostgreSQL Database Schema

## Knowledge Gaps
- **13 isolated node(s):** `SelfUp Architecture`, `AI Memory System`, `Task Management`, `Habit Tracking`, `Fitness Module` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 9`** (10 nodes): `TaskEconomyService`, `.applyAttributeMultiplier()`, `.applyHpDamage()`, `.applyXpPenalty()`, `.awardXp()`, `.constructor()`, `.getHpPenalty()`, `.getXpPenalty()`, `.getXpReward()`, `.recoverHp()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (8 nodes): `DungeonService`, `.checkDungeonProgress()`, `.constructor()`, `.expireUserDungeons()`, `.formatDungeon()`, `.getActiveDungeons()`, `.spawnDailyDungeon()`, `dungeon.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (7 nodes): `AttributeService`, `.checkAttributeGain()`, `.constructor()`, `.countQualifyingActions()`, `.getActionTypeForAttribute()`, `.getAttributeProgress()`, `attribute.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (7 nodes): `QuestService`, `.checkAndUpdateProgress()`, `.computeExpiration()`, `.constructor()`, `.expireStaleQuests()`, `.getTargetValue()`, `quest.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (6 nodes): `fetchAiQuestions()`, `handleBack()`, `handleComplete()`, `handleNext()`, `toggleGoal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `BadgeService`, `.awardBadge()`, `.checkBadgeUnlocks()`, `.constructor()`, `.getUserBadges()`, `badge.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `setLoggingHabit()`, `cn()`, `fetchActivities()`, `page.tsx`, `ActivityFeed.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (5 nodes): `getDb()`, `POST()`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (3 nodes): `fetchAll()`, `handleAddFriend()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `getDb()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `fetchMetrics()`, `handleSubmit()`, `BodyView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `SelfUp Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (1 nodes): `Frontend Web (Next.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `PostgreSQL Database Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 35`, `Community 6`, `Community 7`, `Community 8`, `Community 16`, `Community 25`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `calculateTaskXp()` connect `Community 3` to `Community 7`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 4` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `verifyAuth()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`verifyAuth()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `PATCH()` (e.g. with `verifyAuth()` and `calculateTaskXp()`) actually correct?**
  _`PATCH()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `supabaseServer()` (e.g. with `GET()` and `DELETE()`) actually correct?**
  _`supabaseServer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `executeAiTask()` (e.g. with `addAiTask()` and `generateResponse()`) actually correct?**
  _`executeAiTask()` has 10 INFERRED edges - model-reasoned connections that need verification._