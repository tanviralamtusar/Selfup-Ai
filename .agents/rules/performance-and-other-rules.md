---
trigger: always_on
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
