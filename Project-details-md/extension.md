# SelfUp — Browser Extension Spec

**Extension name:** SelfUp Focus  
**Type:** Chrome + Firefox extension  
**Manifest:** V3  
**Purpose:** Block distracting websites during focus sessions synced with SelfUp app

---

## Folder Structure
```
extension/
├── manifest.json
├── background.js          # Service worker (MV3)
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/
│   └── blocker.js         # Injected on blocked sites
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── blocked.html           # Page shown when site is blocked
```

---

## manifest.json
```json
{
  "manifest_version": 3,
  "name": "SelfUp Focus",
  "version": "1.0.0",
  "description": "Block distracting sites during your SelfUp focus sessions",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "permissions": [
    "storage",
    "declarativeNetRequest",
    "notifications",
    "alarms"
  ],
  "host_permissions": [
    "https://selfup.botbhai.net/api/*",
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": "icons/icon-48.png"
  }
}
```

---

## Core Features

### Authentication
- User logs in with their SelfUp account (email/password)
- Extension stores auth token in `chrome.storage.local`
- Token auto-refreshes via SelfUp API

### Block List Sync
- Extension fetches user's blocked sites list from SelfUp API
- Syncs every 5 minutes (using alarms API)
- Also syncs when focus session starts/ends

### Focus Mode
- Activated manually via popup OR automatically when SelfUp detects scheduled focus time
- During focus mode: all blocked sites redirect to `blocked.html`
- `blocked.html` shows:
  - What you should be doing right now (fetched from SelfUp schedule)
  - Countdown timer
  - Motivational message from AI persona
  - "Override" button (requires typing "override" — adds friction)

### Schedule Sync
- Extension polls `GET /api/extension/schedule` every 5 min
- If current time matches a focus block → auto-enable blocking
- Notification when focus session starts/ends

---

## API Endpoints for Extension

### Login
```
POST /api/extension/auth
Body: { email, password }
Response: { token, user: { display_name, ai_persona_name } }
```

### Get Block List + Schedule
```
GET /api/extension/config
Headers: Authorization
Response: {
  blocked_sites: string[],   // ["youtube.com", "twitter.com", "facebook.com"]
  focus_sessions: [{
    start_time: "09:00",
    end_time: "11:00",
    task_title: "Python Study",
    days: [1,2,3,4,5]       // Mon-Fri
  }],
  is_focus_active: boolean,
  current_task: string | null,
  persona_name: string
}
```

### Report Override (for analytics)
```
POST /api/extension/override
Body: { site: string, session_id: string }
Response: { success: true }
```

---

## Popup UI
```
┌──────────────────────────┐
│ 🌀 SelfUp Focus          │
├──────────────────────────┤
│ ● Focus Mode: ACTIVE     │  (green dot)
│ 📚 Python Study          │
│ ⏱ 42 min remaining      │
├──────────────────────────┤
│ Blocked sites: 6         │
│ [Manage in SelfUp →]     │
├──────────────────────────┤
│ [Pause Focus (5 min)]    │
│ [End Session]            │
└──────────────────────────┘

When inactive:
┌──────────────────────────┐
│ 🌀 SelfUp Focus          │
├──────────────────────────┤
│ ○ Focus Mode: OFF        │
│ Next session: 2:00 PM    │
│ Task: Skill Study        │
├──────────────────────────┤
│ [Start Focus Now]        │
│ [Open SelfUp App →]      │
└──────────────────────────┘
```

---

## Blocked Page (blocked.html)
```
┌──────────────────────────────────────┐
│                                      │
│    🔒  Site Blocked                  │
│    youtube.com                       │
│                                      │
│    You're supposed to be:            │
│    📚 Python Study (until 11:00 AM)  │
│                                      │
│    ████████░░░░  42 min left         │
│                                      │
│    "Stay focused. Future you will    │
│     thank you." — Aria               │
│                                      │
│    [Go Back]  [Override ⚠️]          │
│                                      │
└──────────────────────────────────────┘
```

---

## Development

### Build
```bash
cd extension
# No build step needed for V1 — plain JS
# Load as unpacked extension in Chrome:
# chrome://extensions → Developer mode → Load unpacked → select extension/
```

### Publishing (Future)
- Chrome Web Store: needs $5 developer account
- Firefox Add-ons: free
- Edge Add-ons: free (Chromium compatible)
