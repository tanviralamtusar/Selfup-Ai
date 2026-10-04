---
trigger: always_on
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
- `AGENTS.md` (repo map and current-state gotchas, always)
- `Project-details-md/database_structure.md` (for DB queries)
- `Project-details-md/api.md` (current API route inventory)
- `.agents/rules/frontend-rules.md` (for component/hook structure)
- `Project-details-md/ai_system_v3.md` (for AI feature work)
- `Project-details-md/money.md` (for the Money module)
- `Project-details-md/README.md` shows which docs are current and which are historical specs