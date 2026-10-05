---
trigger: always_on
---

## Git Rules

### Branch Strategy
```
main          → the only long-lived branch: production (Coolify deploys the website;
                pushes touching mobile/ publish a new Android release)
feature/*     → short-lived, branched from main, merged back by PR
fix/*         → short-lived bug fixes, same flow
```

There is no `develop`/staging branch. The old module branches (`fitness-v2`, `skills-v2`, …) have been merged into `main` and deleted from GitHub. Remember that a push to `main` ships: the website redeploys, and any `mobile/` change becomes an app update on users' phones.

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
git checkout main
git pull origin main
git checkout -b feature/skill-roadmap
# ... make changes ...
git add .
git commit -m "feat: add AI skill roadmap generation"
git push origin feature/skill-roadmap
# Create PR → run lint + build, test the flow → merge to main