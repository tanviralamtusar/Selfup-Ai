# Graph Report - .  (2026-04-30)

## Corpus Check
- 159 files · ~103,779 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 405 nodes · 427 edges · 31 communities detected
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Endpoints & Authentication|API Endpoints & Authentication]]
- [[_COMMUNITY_Nutrition & Schedule Views|Nutrition & Schedule Views]]
- [[_COMMUNITY_AI Memory & Action Handling|AI Memory & Action Handling]]
- [[_COMMUNITY_Gamification Logic & Constants|Gamification Logic & Constants]]
- [[_COMMUNITY_AI Task Queue & Worker|AI Task Queue & Worker]]
- [[_COMMUNITY_Fitness Metrics & Onboarding|Fitness Metrics & Onboarding]]
- [[_COMMUNITY_Style & Moodboard Management|Style & Moodboard Management]]
- [[_COMMUNITY_Quest & Badge Pages|Quest & Badge Pages]]
- [[_COMMUNITY_Time Management Dashboard|Time Management Dashboard]]
- [[_COMMUNITY_Dungeon Service|Dungeon Service]]
- [[_COMMUNITY_Skill Roadmap Pages|Skill Roadmap Pages]]
- [[_COMMUNITY_Attribute Tracking Service|Attribute Tracking Service]]
- [[_COMMUNITY_Quest Management Service|Quest Management Service]]
- [[_COMMUNITY_Core Gamification Concepts|Core Gamification Concepts]]
- [[_COMMUNITY_AI Chat Interface|AI Chat Interface]]
- [[_COMMUNITY_User Onboarding Flow|User Onboarding Flow]]
- [[_COMMUNITY_Badge Management Service|Badge Management Service]]
- [[_COMMUNITY_Core App Dependencies|Core App Dependencies]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]

## God Nodes (most connected - your core abstractions)
1. `verifyAuth()` - 59 edges
2. `fetchData()` - 12 edges
3. `supabaseServer()` - 12 edges
4. `GamificationService` - 10 edges
5. `POST()` - 9 edges
6. `DungeonService` - 7 edges
7. `AttributeService` - 6 edges
8. `generateResponse()` - 6 edges
9. `QuestService` - 6 edges
10. `addAiTask()` - 6 edges

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

### Community 0 - "API Endpoints & Authentication"
Cohesion: 0.04
Nodes (40): POST(), POST(), PATCH(), POST(), GET(), GET(), POST(), POST() (+32 more)

### Community 1 - "Nutrition & Schedule Views"
Cohesion: 0.1
Nodes (12): fetchData(), handleLogFood(), handleAutoSchedule(), handleRevertSchedule(), handleTimelineDrop(), handleUnscheduleTask(), handleAddHabit(), handleAddTodo() (+4 more)

### Community 2 - "AI Memory & Action Handling"
Cohesion: 0.12
Nodes (15): POST(), DELETE(), GET(), POST(), executeActions(), handleCreateTask(), handleMemoryUpdate(), handleSkillRoadmap() (+7 more)

### Community 3 - "Gamification Logic & Constants"
Cohesion: 0.16
Nodes (8): calculateHpDamageReduction(), calculateMaxHp(), getHpState(), getRank(), getRankLetter(), getXpModifier(), xpToNextLevel(), GamificationService

### Community 4 - "AI Task Queue & Worker"
Cohesion: 0.18
Nodes (8): addAiTask(), executeAiTask(), GET(), POST(), GET(), POST(), GET(), POST()

### Community 5 - "Fitness Metrics & Onboarding"
Cohesion: 0.21
Nodes (8): GET(), POST(), supabaseServer(), GET(), POST(), POST(), GET(), POST()

### Community 6 - "Style & Moodboard Management"
Cohesion: 0.28
Nodes (4): fetchMoodboard(), fetchOutfits(), handleAddMoodboard(), handleAddOutfit()

### Community 8 - "Quest & Badge Pages"
Cohesion: 0.39
Nodes (5): async(), fetchQuests(), handleAbandon(), handleAccept(), handleComplete()

### Community 9 - "Time Management Dashboard"
Cohesion: 0.32
Nodes (3): fetchAll(), handleAddTask(), handleStatusChange()

### Community 10 - "Dungeon Service"
Cohesion: 0.29
Nodes (1): DungeonService

### Community 11 - "Skill Roadmap Pages"
Cohesion: 0.52
Nodes (6): fetchRoadmap(), fetchSessions(), fetchSkills(), handleAddSkill(), handleLogSession(), handleToggleMilestone()

### Community 12 - "Attribute Tracking Service"
Cohesion: 0.43
Nodes (1): AttributeService

### Community 13 - "Quest Management Service"
Cohesion: 0.33
Nodes (1): QuestService

### Community 14 - "Core Gamification Concepts"
Cohesion: 0.29
Nodes (7): AI Coin Economy, Fitness Module, Gamification System, Habit Tracking, Streak System, Task Management, XP & Leveling

### Community 15 - "AI Chat Interface"
Cohesion: 0.47
Nodes (4): fetchConversations(), handleDeleteChat(), handleSendMessage(), startNewChat()

### Community 16 - "User Onboarding Flow"
Cohesion: 0.4
Nodes (2): fetchAiQuestions(), handleNext()

### Community 18 - "Badge Management Service"
Cohesion: 0.4
Nodes (1): BadgeService

### Community 19 - "Core App Dependencies"
Cohesion: 0.33
Nodes (6): Auth Store, Badge Service, Gamification Service, Quest Service, StreakCard Component, Supabase Client

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (2): DELETE(), PATCH()

### Community 24 - "Community 24"
Cohesion: 0.83
Nodes (3): GET(), getDb(), POST()

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (2): fetchAll(), handleAddFriend()

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (1): GET()

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (1): GET()

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (2): fetchMetrics(), handleSubmit()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (3): AI Companion (Aria), AI Memory System, Skill Roadmaps

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (3): Backend API (Express/Supabase), SelfUp Focus Extension, Focus Mode

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (1): SelfUp Architecture

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (1): Frontend Web (Next.js)

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (1): PostgreSQL Database Schema

### Community 91 - "Community 91"
Cohesion: 1.0
Nodes (1): UI Store

### Community 92 - "Community 92"
Cohesion: 1.0
Nodes (1): AI Memory Utils

## Knowledge Gaps
- **19 isolated node(s):** `SelfUp Architecture`, `AI Memory System`, `Task Management`, `Habit Tracking`, `Fitness Module` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Dungeon Service`** (8 nodes): `DungeonService`, `.checkDungeonProgress()`, `.constructor()`, `.expireUserDungeons()`, `.formatDungeon()`, `.getActiveDungeons()`, `.spawnDailyDungeon()`, `dungeon.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Attribute Tracking Service`** (7 nodes): `AttributeService`, `.checkAttributeGain()`, `.constructor()`, `.countQualifyingActions()`, `.getActionTypeForAttribute()`, `.getAttributeProgress()`, `attribute.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Quest Management Service`** (7 nodes): `QuestService`, `.checkAndUpdateProgress()`, `.computeExpiration()`, `.constructor()`, `.expireStaleQuests()`, `.getTargetValue()`, `quest.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Onboarding Flow`** (6 nodes): `fetchAiQuestions()`, `handleBack()`, `handleComplete()`, `handleNext()`, `toggleGoal()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Badge Management Service`** (6 nodes): `BadgeService`, `.awardBadge()`, `.checkBadgeUnlocks()`, `.constructor()`, `.getUserBadges()`, `badge.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (5 nodes): `DELETE()`, `PATCH()`, `route.ts`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (3 nodes): `fetchAll()`, `handleAddFriend()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (3 nodes): `GET()`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (3 nodes): `GET()`, `route.ts`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (3 nodes): `fetchMetrics()`, `handleSubmit()`, `BodyView.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `SelfUp Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `Frontend Web (Next.js)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `PostgreSQL Database Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `UI Store`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (1 nodes): `AI Memory Utils`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `verifyAuth()` connect `API Endpoints & Authentication` to `AI Memory & Action Handling`, `AI Task Queue & Worker`, `Fitness Metrics & Onboarding`, `Community 20`, `Community 24`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `POST()` connect `AI Memory & Action Handling` to `API Endpoints & Authentication`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `supabaseServer()` connect `Fitness Metrics & Onboarding` to `API Endpoints & Authentication`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 58 inferred relationships involving `verifyAuth()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`verifyAuth()` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `fetchData()` (e.g. with `handleTimelineDrop()` and `handleAutoSchedule()`) actually correct?**
  _`fetchData()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `supabaseServer()` (e.g. with `GET()` and `DELETE()`) actually correct?**
  _`supabaseServer()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `POST()` (e.g. with `verifyAuth()` and `fetchUserMemory()`) actually correct?**
  _`POST()` has 7 INFERRED edges - model-reasoned connections that need verification._