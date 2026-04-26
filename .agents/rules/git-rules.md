---
trigger: always_on
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