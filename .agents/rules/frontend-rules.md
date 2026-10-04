---
trigger: always_on
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
8. **Navigation** — sidebar/bottom nav lives in `components/layout/AppShell.tsx`; route paths are constants in `constants/routes.ts`

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

// Client API functions: web/src/lib/<module>/client.ts (e.g. lib/money/client.ts)
// Send the Supabase access token as `Authorization: Bearer <token>`
export async function completeTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/todos/${taskId}/complete`, { method: 'POST', headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to complete task')
}

// Hooks: web/src/lib/hooks/useX.ts (e.g. useTodos.ts)
export function useCompleteTask() {
  return useMutation({
    mutationFn: completTask,
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  })
}
```

Some older pages still call `fetch()` inline. Move that logic into a client function and a hook when you touch them, rather than copying the pattern.

### State Rules
```typescript
// Global state (Zustand): only for truly global things
// - auth user + profile (store/authStore.ts), UI state (store/uiStore.ts)

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
