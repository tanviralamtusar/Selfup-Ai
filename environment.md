# SelfUp — Environment Variables Reference

---

## Backend (.env)

```env
# ─── SERVER ───────────────────────────────────────
PORT=3000
NODE_ENV=development          # development | production

# ─── SUPABASE ─────────────────────────────────────
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=    # From Supabase: Settings → API → service_role
# WARNING: Never expose this to frontend. Backend only.

SUPABASE_JWT_SECRET=          # From Supabase: Settings → API → JWT Secret

# ─── GOOGLE AI STUDIO ─────────────────────────────
GEMMA_API_KEY=                # From https://aistudio.google.com/apikey
GEMMA_MODEL=gemma-3-27b-it    # or gemma-3-12b-it for fallback

# ─── REDIS ────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── EMAIL (RESEND) ───────────────────────────────
RESEND_API_KEY=re_             # From https://resend.com/api-keys
RESEND_FROM=noreply@botbhai.net

# ─── WEB PUSH ─────────────────────────────────────
VAPID_PUBLIC_KEY=              # Generate: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_EMAIL=admin@botbhai.net

# ─── GOOGLE OAUTH + CALENDAR ─────────────────────
GOOGLE_CLIENT_ID=              # From Google Cloud Console
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://selfup.botbhai.net/api/auth/google/callback

# ─── YOUTUBE ─────────────────────────────────────
YOUTUBE_API_KEY=               # From Google Cloud Console → APIs → YouTube Data API v3

# ─── APP ──────────────────────────────────────────
APP_URL=https://selfup.botbhai.net   # http://localhost:5173 for dev
```

---

## Frontend (.env)

```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=       # From Supabase: Settings → API → anon/public
# Safe to expose — RLS protects data

VITE_API_BASE_URL=https://selfup.botbhai.net/api   # http://localhost:3000/api for dev
VITE_APP_NAME=SelfUp
VITE_APP_URL=https://selfup.botbhai.net

VITE_VAPID_PUBLIC_KEY=         # Must match backend VAPID_PUBLIC_KEY
```

---

## Where to Find Each Key

| Variable | Where to Get |
|----------|-------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `GEMMA_API_KEY` | https://aistudio.google.com → Get API Key |
| `REDIS_URL` | Local: `redis://localhost:6379` |
| `RESEND_API_KEY` | https://resend.com → API Keys |
| `VAPID_PUBLIC_KEY` | Run: `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Same as above |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `YOUTUBE_API_KEY` | Google Cloud Console → APIs → YouTube Data API v3 |

---

## .gitignore (add these)
```gitignore
# Environment files
.env
.env.local
.env.production

# Dependencies
node_modules/

# Build outputs
dist/
build/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db
```

---

## Coolify Environment Variables Setup
1. Open Coolify dashboard → your backend service
2. Environment Variables tab
3. Add each variable from `backend/.env` one by one
4. Mark `SUPABASE_SERVICE_ROLE_KEY`, `GEMMA_API_KEY`, `VAPID_PRIVATE_KEY`, `GOOGLE_CLIENT_SECRET` as **Secret** (hidden after save)
5. Repeat for frontend service with `frontend/.env` variables
6. Redeploy both services after saving
