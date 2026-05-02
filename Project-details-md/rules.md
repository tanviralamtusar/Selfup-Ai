# SelfUp — Rules & Conventions

---

## Code Style Rules

### General
- **TypeScript strict mode** always on (`"strict": true` in tsconfig)
- No `any` type — use `unknown` and narrow, or define proper types
- No `console.log` in production code — use Winston logger in backend, remove from frontend
- All functions must have return type annotations
- Prefer `const` over `let`, never use `var`
- Arrow functions for callbacks, regular functions for named functions
- File names: `camelCase.ts` for utilities, `PascalCase.tsx` for components

### Naming Conventions
```typescript
// Components: PascalCase
function ProfileCard() {}

// Hooks: camelCase starting with "use"
function useAiCoins() {}

// Services: camelCase ending with "Service" or ".service.ts"
// coinsService, gemma.service.ts

// Constants: SCREAMING_SNAKE_CASE
const MAX_AI_COINS_FREE = 50

// Types/Interfaces: PascalCase
interface UserProfile {}
type QuestStatus = 'active' | 'completed' | 'failed'

// Database table types: match table name exactly
// user_profiles → UserProfile
// ai_messages → AiMessage
```

### Imports Order
```typescript
// 1. React
import React, { useState, useEffect } from 'react'

// 2. External libraries
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

// 3. Internal absolute imports (use @ alias)
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

// 4. Relative imports
import { ProfileCard } from './ProfileCard'

// 5. Types
import type { UserProfile } from '@/types/database'
```

---

## Frontend Rules

### Component Rules
1. **Single responsibility** — one component does one thing
2. **No business logic in components** — all logic goes in custom hooks
3. **Never fetch data directly in components** — use TanStack Query hooks
4. **Memoize expensive components** — use `React.memo` when props rarely change
5. **Never mutate Zustand state directly** — always use store actions
6. **Loading states** — every data-dependent component must handle loading + error
7. **Mobile-first** — write mobile CSS first, add desktop with `lg:` prefix

### Component Template
```tsx
// components/fitness/WorkoutCard.tsx
import type { WorkoutLog } from '@/types/database'

interface WorkoutCardProps {
  workout: WorkoutLog
  onComplete?: (id: string) => void
}

export function WorkoutCard({ workout, onComplete }: WorkoutCardProps) {
  // hooks at top
  // derived values
  // handlers
  // render
}
```

### API Call Rules
```typescript
// NEVER call Supabase directly from components
// NEVER use fetch() directly in components
// ALWAYS use service functions + TanStack Query

// services/tasks.service.ts
export async function completTask(taskId: string): Promise<void> {
  const res = await api.patch(`/tasks/${taskId}/complete`)
  if (!res.ok) throw new Error('Failed to complete task')
}

// hooks/useTasks.ts
export function useCompleteTask() {
  return useMutation({
    mutationFn: completTask,
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  })
}
```

### State Rules
```typescript
// Global state (Zustand): only for truly global things
// - auth user, theme, mode (chat/dashboard), timer

// Server state (TanStack Query): ALL database data
// - tasks, habits, fitness data, AI chat, etc.

// Local state (useState): UI-only state
// - modal open/close, input values, hover states
```

### Form Rules
- Use React Hook Form + Zod for ALL forms
- Validate on both client (Zod) and server (Zod)
- Show field-level errors immediately on blur
- Disable submit button while loading
- Show success/error toast after submission

---

## Backend Rules

### API Response Format
```typescript
// ALWAYS return this format
// Success
res.json({ success: true, data: result })

// Error
res.status(400).json({ success: false, error: 'Descriptive message' })

// Paginated
res.json({ success: true, data: items, total: count, page: 1, limit: 20 })
```

### Controller Rules
```typescript
// Controllers: ONLY handle HTTP request/response
// NO business logic in controllers
// All logic in services

// CORRECT:
async function createTask(req: Request, res: Response) {
  const task = await tasksService.create(req.user.id, req.body)
  res.json({ success: true, data: task })
}

// WRONG:
async function createTask(req: Request, res: Response) {
  const { data, error } = await supabase.from('tasks').insert(...)  // NO
  if (task.xp_reward) { user.xp += task.xp_reward; await ... }    // NO
}
```

### Service Rules
- Services interact with database directly via Supabase admin client
- Services may call other services
- Services throw errors (don't return error objects)
- All DB calls must be typed

### Validation Rules
```typescript
// Validate ALL incoming request data with Zod
// Put schemas in backend/src/lib/validations/

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: z.string().date().optional()
})

// Use validate middleware on routes
router.post('/', validate(createTaskSchema), createTask)
```

### Database Rules
- **Never** use service role key in frontend — backend only
- **Always** use parameterized queries (Supabase handles this)
- **Always** check user ownership before update/delete
- **Never** return sensitive fields (`payment_ref`, `refresh_token`)
- **Always** paginate list endpoints (default: 20 items)

---

## Security Rules

### Authentication
- All `/api/*` routes (except `/api/auth/*`) require valid JWT
- JWT verified via Supabase admin client — never custom JWT parsing
- Token expiry: 1 hour (Supabase default), refresh token: 7 days

### Data Access
```typescript
// ALWAYS verify user owns the resource
async function deleteTask(userId: string, taskId: string) {
  const task = await getTask(taskId)
  if (task.user_id !== userId) throw new Error('Forbidden')  // 403
  await db.from('tasks').delete().eq('id', taskId)
}
```

### Input Sanitization
- Sanitize all text fields that will be displayed as HTML
- Strip HTML tags from user-inputted text content
- Validate file uploads: type (image only), size (max 5MB)

### Rate Limits
```typescript
// Per-user per-hour limits
AI chat:          20 requests/hour
Auth endpoints:   10 requests/15min
File uploads:     10 requests/hour
General API:      300 requests/hour
```

### Environment Security
- `.env` files NEVER committed to git (add to `.gitignore`)
- Secrets only in Coolify environment variables
- Service role key NEVER exposed to frontend
- CORS strictly limited to `selfup.botbhai.net`

### AI Prompt Security
- Never inject raw user input directly into system prompt
- Sanitize user messages before sending to AI
- AI responses should never be executed as code
- Filter AI responses for sensitive content before displaying

---

## Git Rules

### Branch Strategy
```
main          → production (auto-deploys via Coolify)
develop       → staging
feature/*     → new features (branch from develop)
fix/*         → bug fixes
```

### Commit Messages
```
feat: add workout logging to fitness module
fix: resolve AI queue not processing on Redis restart
refactor: extract coin service from gamification service
chore: update Gemma SDK to latest version
docs: add missing endpoint to backend.md
```

### Workflow
```bash
git checkout develop
git pull origin develop
git checkout -b feature/skill-roadmap
# ... make changes ...
git add .
git commit -m "feat: add AI skill roadmap generation"
git push origin feature/skill-roadmap
# Create PR → merge to develop → test → merge to main
```

---

## AI IDE Rules

When using AI IDE assistance:
1. Always provide the relevant `.md` file as context before asking for code
2. Ask for one feature at a time — don't ask for entire modules at once
3. Always review generated code before accepting — check for type errors
4. After generating a component, ask AI to write the corresponding hook
5. After generating a backend route, ask AI to add Zod validation
6. When generating DB queries, verify RLS will allow the query

### Useful context to always provide to AI IDE:
- `database_structure.md` (for DB queries)
- `backend.md` (for API routes)
- `frontend.md` (for component/hook structure)
- `ai_system.md` (for AI feature work)

---

## Performance Rules

### Frontend
- Lazy load all page-level components
- Don't load charts until component is in viewport
- Virtualize lists with > 50 items
- Cache user profile in Zustand, don't refetch on every page
- Debounce search inputs (300ms)
- Optimistic UI for task completion, habit logging (instant feedback)

### Backend
- Paginate ALL list endpoints
- Use database indexes for all frequent query patterns
- Don't make AI API calls synchronously in loops
- Cache leaderboard results in Redis (1 hour TTL)
- Cache user coin balance in Redis (invalidate on transaction)

### Images
- Profile photos: max 400x400px (resize on upload)
- Body transformation photos: max 1200x1600px
- Store in Supabase Storage, serve via CDN URL
- Use WebP format where possible

---

## Error Handling Rules

### Frontend
```typescript
// Use error boundaries for page-level errors
// Use toast notifications for user-facing errors
// Never show raw error messages to users

try {
  await completeTask(id)
  toast.success('Task completed! +10 XP 🎉')
} catch (error) {
  toast.error('Something went wrong. Please try again.')
  console.error('[TaskComplete]', error)
}
```

### Backend
```typescript
// Use the global error handler
// Log all errors with context

try {
  // ...
} catch (error) {
  logger.error('Task creation failed', { userId, error, body: req.body })
  throw error  // let global handler format the response
}
```

---

## Accessibility Rules
- All interactive elements must have `aria-label` if no visible text
- Color alone must not convey information (add icon/text)
- Minimum contrast ratio: 4.5:1 for normal text
- Focus rings must be visible (don't use `outline: none` without replacement)
- All images must have `alt` text
- Form fields must have labels (even if visually hidden)
- Keyboard navigation must work for all primary actions
