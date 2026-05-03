# Graph Report - Selfup Ai  (2026-05-03)

## Corpus Check
- 147 files · ~141,307 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 461 nodes · 505 edges · 30 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 63 edges
2. `supabaseServer()` - 12 edges
3. `TaskInjectionService` - 11 edges
4. `GamificationService` - 10 edges
5. `TaskEconomyService` - 10 edges
6. `POST()` - 9 edges
7. `PATCH()` - 9 edges
8. `fetchData()` - 8 edges
9. `DungeonService` - 7 edges
10. `DELETE()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts
- `POST()` --calls--> `parseActions()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-actions.ts
- `POST()` --calls--> `extractAndSaveMemory()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\ai-memory.ts
- `DELETE()` --calls--> `verifyAuth()`  [INFERRED]
  web\src\app\api\ai\chat\route.ts → web\src\lib\api-auth.ts

## Hyperedges (group relationships)
- **Core Product Modules** — task_management, habit_tracking, fitness_module, skill_roadmaps [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (37): POST(), POST(), GET(), GET(), PATCH(), GET(), GET(), POST() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (8): fetchData(), handleLogFood(), handleAutoSchedule(), handleRevertSchedule(), handleTimelineDrop(), handleUnscheduleTask(), handleAddHabit(), handleAddTodo()

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (16): POST(), DELETE(), GET(), POST(), executeActions(), handleCreateTask(), handleMemoryUpdate(), handleSkillRoadmap() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (8): GET(), getDb(), POST(), calculateTaskXp(), TaskInjectionService, GET(), getDb(), POST()

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (8): calculateHpDamageReduction(), calculateMaxHp(), getHpState(), getRank(), getRankLetter(), getXpModifier(), xpToNextLevel(), GamificationService

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (11): GET(), POST(), supabaseServer(), DELETE(), GET(), POST(), PUT(), GET() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (5): GET(), getDb(), POST(), calculateHpPenalty(), TaskEconomyService

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (8): addAiTask(), POST(), GET(), POST(), GET(), POST(), GET(), POST()

### Community 8 - "Community 8"
Cohesion: 0.28
Nodes (4): fetchMoodboard(), fetchOutfits(), handleAddMoodboard(), handleAddOutfit()

### Community 10 - "Community 10"
Cohesion: 0.39
Nodes (5): async(), fetchQuests(), handleAbandon(), handleAccept(), handleComplete()

### Community 11 - "Community 11"
Cohesion: 0.32
Nodes (3): fetchAll(), handleAddTask(), handleCompleteTask()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (3): DELETE(), getDb(), PATCH()

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (1): DungeonService

### Community 14 - "Community 14"
Cohesion: 0.52
Nodes (6): fetchRoadmap(), fetchSessions(), fetchSkills(), handleAddSkill(), handleLogSession(), handleToggleMilestone()

### Community 15 - "Community 15"
Cohesion: 0.43
Nodes (1): AttributeService

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (1): QuestService

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (7): AI Coin Economy, Fitness Module, Gamification System, Habit Tracking, Streak System, Task Management, XP & Leveling

### Community 18 - "Community 18"
Cohesion: 0.47
Nodes (4): fetchConversations(), handleDeleteChat(), handleSendMessage(), startNewChat()

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (2): fetchAiQuestions(), handleNext()

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (1): BadgeService

### Community 22 - "Community 22"
Cohesion: 0.6
Nodes (2): getDb(), POST()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (2): setLoggingHabit(), fetchActivities()

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (2): fetchAll(), handleAddFriend()

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (2): getDb(), POST()

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (2): fetchMetrics(), handleSubmit()

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (3): Backend API (Express/Supabase), SelfUp Focus Extension, Focus Mode

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (3): AI Companion (Aria), AI Memory System, Skill Roadmaps

### Community 94 - "Community 94"
Cohesion: 1.0
Nodes (1): SelfUp Architecture

### Community 95 - "Community 95"
Cohesion: 1.0
Nodes (1): Frontend Web (Next.js)

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (1): PostgreSQL Database Schema

## Knowledge Gaps
- **13 isolated node(s):** `SelfUp Architecture`, `AI Memory System`, `Task Management`, `Habit Tracking`, `Fitness Module` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (8 nodes): `DungeonService`, `.checkDungeonProgress()`, `.constructor()`, `.expireUserDungeons()`, `.formatDungeon()`, `.getActiveDungeons()`, `.spawnDailyDungeon()`, `dungeon.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (7 nodes): `AttributeService`, `.checkAttributeGain()`, `.constructor()`, `.countQualifyingActions()`, `.getActionTypeForAttribute()`, `.getAttributeProgress()`, `attribute.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (7 nodes): `QuestService`, `.checkAndUpdateProgress()`, `.computeExpiration()`, `.constructor()`, `.expireStaleQuests()`, `.getTargetValue()`, `quest.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (6 nodes): `fetchAiQuestions()`, `handleBack()`, `handleComplete()`, `handleNext()`, `toggleGoal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (6 nodes): `BadgeService`, `.awardBadge()`, `.checkBadgeUnlocks()`, `.constructor()`, `.getUserBadges()`, `badge.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (5 nodes): `getDb()`, `POST()`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (5 nodes): `setLoggingHabit()`, `cn()`, `fetchActivities()`, `page.tsx`, `ActivityFeed.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (3 nodes): `fetchAll()`, `handleAddFriend()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (3 nodes): `getDb()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (3 nodes): `fetchMetrics()`, `handleSubmit()`, `BodyView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `SelfUp Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (1 nodes): `Frontend Web (Next.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `PostgreSQL Database Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `Community 0` to `Community 32`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 12`, `Community 22`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `calculateTaskXp()` connect `Community 3` to `Community 12`, `Community 6`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `PATCH()` connect `Community 12` to `Community 0`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 62 inferred relationships involving `verifyAuth()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`verifyAuth()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `supabaseServer()` (e.g. with `GET()` and `DELETE()`) actually correct?**
  _`supabaseServer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SelfUp Architecture`, `AI Memory System`, `Task Management` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._