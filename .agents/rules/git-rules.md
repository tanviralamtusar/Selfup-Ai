---
trigger: always_on
---

## Git Rules

### Branch Strategy
```
main          → production (auto-deploys via Coolify)
<module>-v2   → long-running module branches (e.g. fitness-v2, skills-v2)
feature/*     → new features (branch from main or the module branch)
fix/*         → bug fixes
```

No `develop`/staging branch exists at the moment; PRs merge into `main`.

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