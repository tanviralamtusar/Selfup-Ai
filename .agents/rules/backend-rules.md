---
trigger: always_on
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
