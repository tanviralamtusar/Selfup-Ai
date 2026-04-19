# SelfUp — Setup & Deployment Instructions

---

## Local Development Setup

### Prerequisites
- Node.js 20+ (`node --version`)
- npm 10+
- Redis (`redis-server`)
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/selfup.git
cd selfup
```

### Step 2: Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### Step 3: Supabase Setup
1. Go to https://supabase.com → New Project
2. Copy your project URL and anon key
3. Go to SQL Editor → paste entire contents of `database_structure.md` SQL blocks
4. Run all SQL (tables, triggers, RLS policies)
5. Go to Storage → create buckets: `avatars`, `body-photos`, `style-photos`, `moodboard`
6. Set bucket policies (avatars: public read; others: private)

### Step 4: Google AI Studio Setup
1. Go to https://aistudio.google.com
2. Create API key
3. Note: Free tier = 60 requests/minute, 1500 requests/day

### Step 5: Google OAuth + Calendar
1. Go to https://console.cloud.google.com
2. Create new project "SelfUp"
3. Enable APIs: Google+ API, Google Calendar API, YouTube Data API v3
4. OAuth 2.0 Credentials → Web Application
5. Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID + Secret

### Step 6: Resend Email Setup
1. Go to https://resend.com → Create account
2. Add domain `botbhai.net` (or use `@resend.dev` for dev)
3. Get API key

### Step 7: Web Push VAPID Keys
```bash
npx web-push generate-vapid-keys
# Copy output to .env
```

### Step 8: Environment Files

**`backend/.env`**
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

GEMMA_API_KEY=your_google_ai_studio_key

REDIS_URL=redis://localhost:6379

RESEND_API_KEY=re_your_key_here
RESEND_FROM=noreply@botbhai.net

VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=admin@botbhai.net

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

YOUTUBE_API_KEY=your_youtube_api_key

SUPABASE_JWT_SECRET=your_supabase_jwt_secret
APP_URL=http://localhost:5173
```

**`frontend/.env`**
```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=SelfUp
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Step 9: Start Development Servers
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev

# App runs at http://localhost:5173
# API runs at http://localhost:3000
```

---

## Production Deployment (Coolify VPS)

### VPS Specs
- 16GB RAM, 4 Core CPU
- Ubuntu 24.04
- Coolify installed

### Step 1: Install Redis on VPS
```bash
ssh root@your-vps-ip
apt update && apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
redis-cli ping  # should return PONG
```

### Step 2: Configure Domain
In your DNS provider (wherever botbhai.net is registered):
```
Type: A
Name: selfup
Value: your-vps-ip
TTL: 300
```

### Step 3: Deploy Backend on Coolify
1. Open Coolify dashboard → New Service → Application
2. Connect GitHub repository
3. Set build settings:
   - Root directory: `backend`
   - Build command: `npm run build`
   - Start command: `node dist/index.js`
   - Port: `3000`
4. Add all environment variables from `backend/.env` (production values)
5. Set `REDIS_URL=redis://localhost:6379` (same VPS)
6. Domain: leave empty (will be on internal port)
7. Deploy

### Step 4: Deploy Frontend on Coolify
1. New Service → Static Site
2. Same GitHub repo
3. Build settings:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables from `frontend/.env` (production values):
   - `VITE_API_BASE_URL=https://selfup.botbhai.net/api`
5. Domain: `selfup.botbhai.net`
6. Enable SSL (Let's Encrypt) ✅
7. Deploy

### Step 5: Configure Nginx Reverse Proxy
Coolify handles this automatically. But set up the `/api` routing:

In Coolify → your frontend service → Advanced → Add Custom Nginx config:
```nginx
location /api {
  proxy_pass http://backend-service:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Or configure them as two separate services and use Coolify's built-in proxy.

### Step 6: Update OAuth Redirect URIs
Go back to Google Cloud Console → OAuth Credentials → Add production URI:
```
https://selfup.botbhai.net/api/auth/google/callback
```

### Step 7: Update Supabase
Go to Supabase → Authentication → URL Configuration:
```
Site URL: https://selfup.botbhai.net
Redirect URLs: https://selfup.botbhai.net/**
```

### Step 8: Verify Deployment
```bash
# Test backend
curl https://selfup.botbhai.net/api/health

# Should return: {"status": "ok", "version": "1.0.0"}
```

---

## Service Worker Setup (Web Push)

Create `frontend/public/sw.js`:
```javascript
self.addEventListener('push', function(event) {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: data.url
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data))
})
```

Register in frontend:
```typescript
// src/lib/notifications.ts
export async function registerPushNotifications() {
  const registration = await navigator.serviceWorker.register('/sw.js')
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
  })
  // Send subscription to backend
  await api.post('/api/notifications/subscribe', subscription)
}
```

---

## Database Backups
Supabase free tier: daily backups (7-day retention)  
Pro tier: point-in-time recovery  
Manual backup:
```bash
pg_dump "postgresql://postgres:[password]@db.yourproject.supabase.co:5432/postgres" > backup.sql
```

---

## Monitoring
- Coolify dashboard: CPU, RAM, request logs
- Backend: Winston logs saved to `/var/log/selfup/`
- Error tracking: Add Sentry in V2

---

## Common Issues

**Redis not connecting:**
```bash
systemctl status redis-server
# If stopped: systemctl start redis-server
```

**Gemma rate limit hit constantly:**
- Check AI queue is processing: GET `/api/ai/queue/status`
- Reduce concurrent AI actions in `config/env.ts`
- Consider switching to Gemini 1.5 Flash (higher free limits)

**Supabase RLS blocking queries:**
- Remember to use service role key in backend (bypasses RLS)
- Frontend should ONLY use anon key (RLS applies)

**Push notifications not working:**
- Check VAPID keys match in frontend + backend `.env`
- Chrome requires HTTPS for push notifications (works in production)
- Firefox may require additional permissions config
