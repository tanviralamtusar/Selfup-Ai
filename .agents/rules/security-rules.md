---
trigger: always_on
---

## Security Rules

### Authentication
- All `/api/*` routes (except `/api/auth/*`) require a valid JWT sent as `Authorization: Bearer <token>`
- Verify it with `verifyAuth(req)` from `@/lib/api-auth` (calls `supabase.auth.getUser`), never with custom JWT parsing
- Then query as the user (Supabase client carrying the user's token) so RLS enforces ownership as a second layer
- Page protection is client-side in `app/(protected)/layout.tsx` and there is no Next middleware, so never rely on page guards for data security
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
Target limits. They are **not yet enforced** in code.
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
