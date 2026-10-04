---
trigger: always_on
---

## Backend Rules

### API Response Format
API handlers are Next.js route handlers in `web/src/app/api/**/route.ts`.
```typescript
// ALWAYS return this format
// Success
return NextResponse.json({ success: true, data: result })

// Error
return NextResponse.json({ success: false, error: 'Descriptive message' }, { status: 400 })

// Paginated
return NextResponse.json({ success: true, data: items, total: count, page: 1, limit: 20 })
```
Older routes return a bare `{ error }` on failure; move them to this shape when you touch them.

### Route Handler Rules
```typescript
// Route handlers: ONLY authenticate, validate, call a service, respond
// NO business logic in route handlers
// All logic in services (web/src/lib/<domain>.service.ts or web/src/lib/<module>/)

// CORRECT:
export async function POST(req: NextRequest) {
  const { user, error } = await verifyAuth(req)
  if (!user) return NextResponse.json({ success: false, error }, { status: 401 })
  const body = createTaskSchema.parse(await req.json())
  const task = await TaskService.create(user.id, body)
  return NextResponse.json({ success: true, data: task })
}

// WRONG:
export async function POST(req: NextRequest) {
  const { data } = await supabase.from('tasks').insert(...)                 // NO
  await supabase.from('user_profiles').update({ xp: profile.xp + 10 })  // NO: XP goes through GamificationService
}
```

### Service Rules
- Services use a Supabase client scoped to the user's token, so RLS applies. Use the service-role admin client only for genuinely cross-user work (scheduler, leaderboards).
- Services may call other services
- Services throw errors (don't return error objects)
- All DB calls must be typed

### Validation Rules
```typescript
// Validate ALL incoming request data with Zod
// Put schemas in web/src/lib/validations/

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: z.string().date().optional()
})

// Parse at the top of the handler; return 400 on failure
const parsed = createTaskSchema.safeParse(await req.json())
if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
```

### Database Rules
- **Never** use service role key in frontend — backend only
- **Always** use parameterized queries (Supabase handles this)
- **Always** check user ownership before update/delete
- **Never** return sensitive fields (`payment_ref`, `refresh_token`)
- **Always** paginate list endpoints (default: 20 items)
- **Schema changes** go in an idempotent SQL file in `web/scripts/migrations/` with RLS policies, and are applied via the Supabase SQL editor (see AGENTS.md → Database Changes)

### Gamification Rules
- **All** XP, coin, HP and level changes go through `GamificationService` (`web/src/lib/gamification.service.ts`)
- XP awards must be idempotent: they are keyed on `xp_transactions (user_id, source_type, source_id)`
