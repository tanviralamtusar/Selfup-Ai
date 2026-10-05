# SelfUp — Android app

Expo (SDK 57) / React Native app for SelfUp. It is **offline-first**: everything you do is saved on the phone immediately and synced with the website when there's a connection. Changes made on the website show up on the phone, and vice versa, in about a second.

## Features

| Tab | What's there |
| --- | --- |
| **Dashboard** | XP / HP / level header and sync badge. Dailies, Habits and To-dos in a swipeable slider (swipe or tap the tabs). Tap the circle to complete, long-press to delete, **+ Add** with reminder time and due-date pickers. |
| **Money** | Net worth, month income/spend, accounts, spending by category, transactions, budgets, savings goals (add money), recurring items (post now). All computed from the local copy, so it works offline. |
| **Time** | Focus timer (15/25/50 min, optionally linked to a to-do) that survives the app closing, today's sessions, and to-dos due today. |
| **Analysis** | Level, rank, streaks, attributes (spend stat points when online), this week's activity, recent activity feed (cached for offline). |
| **Settings** | Version and build, **Check for updates**, reminders, account and sign-out, sync status with the last error, **Test connection**, device info, what's stored locally, **Reset local data**. |

Also included:

- **New-day check-in:** the same "Welcome back" flow as the website.
- **Reminders:** local notifications for dailies, to-dos and focus sessions (see [Reminders](#reminders)).
- **In-app updates:** the app updates itself from GitHub Releases (see [App updates](#app-updates)).

## Install on a phone

1. Open the [Releases page](https://github.com/tanviralamtusar/Selfup-Ai/releases), take the latest `selfup-<version>-<build>.apk`, and open it on the phone. Allow "install unknown apps" for your browser when Android asks.
2. Sign in with your SelfUp account. New accounts sign up and finish onboarding on the website first.
3. Optional: in **Settings → Reminders**, tap **Allow exact timing** so reminders ring on the minute.

From then on, new builds are offered inside the app.

## Develop

```bash
cd mobile
npm install
cp .env.example .env      # Supabase URL + anon key + the website URL
npx expo start            # scan the QR code with Expo Go
```

For local development against `npm run dev`, set `EXPO_PUBLIC_API_URL` to your computer's LAN address (e.g. `http://192.168.1.20:3000`), not `localhost`. The self-updater is disabled in Expo Go and dev builds. Test reminders and updates with a release APK.

The database side needs `web/scripts/migrations/add_mobile_sync.sql` (idempotency table + realtime publication). It was applied to production on 2026-10-05.

Checks to run before pushing:

```bash
npm run typecheck
npx expo lint
npx expo export --platform android   # full Metro/Hermes bundle; catches unresolved imports
```

## Build & release

### GitHub Actions (default, no Expo account needed)

`.github/workflows/android-apk.yml` runs on every push to `main` that touches `mobile/` (or the workflow), and on demand (Actions → *Android APK* → *Run workflow*). It:

1. cleans the three `EXPO_PUBLIC_*` values (strips whitespace, line breaks, quotes and a trailing slash) and warns in the run if it had to fix one;
2. typechecks and lints;
3. sets `versionCode` to the workflow run number, so every build is newer than the last;
4. runs `expo prebuild` + `gradlew assembleRelease` for real phones (`armeabi-v7a`, `arm64-v8a`);
5. signs the APK with your keystore if the secrets exist, otherwise with Expo's shared debug key;
6. uploads it as an artifact and publishes it as the **latest GitHub Release**, tagged `mobile-v<version>-b<build>` (e.g. `mobile-v1.0.0-b7`), with the `mobile/` commits since the previous release as notes.

One-time setup, in the repo's **Settings → Secrets and variables → Actions**:

| Name | Kind | Value |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Variable | same as the website's `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Variable | same as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (never the service-role key) |
| `EXPO_PUBLIC_API_URL` | Variable | `https://selfup.botbhai.net`: HTTPS, no trailing slash, **no line break at the end** |
| `ANDROID_KEYSTORE_BASE64` | Secret | optional, your signing key, base64-encoded |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Secret | optional, for that key |

**Signing.** Android only installs an update over an app signed with the same key, so switching keys later means uninstalling first, which clears the phone's unsynced changes. Create your own key before sharing the app with anyone:

```bash
keytool -genkeypair -v -keystore selfup-release.jks -alias selfup -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 selfup-release.jks   # paste the output into ANDROID_KEYSTORE_BASE64
```

Keep `selfup-release.jks` and its passwords backed up outside the repo. If you lose them, you can never publish an update to the same app.

**IDs and versions.** The Android package (and iOS bundle id) is `app.selfup.net` (`app.json`). It's permanent once the app is uploaded to the Play Store. Bump `expo.version` in `app.json` for a new user-visible version name; the build number goes up on its own.

### EAS (alternative, Expo's cloud build)

```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview      # installable .apk (see eas.json)
eas build -p android --profile production   # .aab for the Play Store
```

### App updates

`src/lib/updater.ts` and `src/components/UpdatePrompt.tsx` handle in-app updates:

1. On launch, and when the app returns to the foreground (at most every 30 minutes), the app reads the latest release from the GitHub API.
2. If the tag's build number is higher than the installed `versionCode`, it shows **Update available** with the release notes.
3. **Update now** downloads the APK (retrying up to 3 times if the connection drops) and opens Android's installer. **Later** hides that build until a newer one is published. **Settings → Check for updates** checks immediately, even for a build you skipped.

Android doesn't allow silent installs outside the Play Store, so each update needs one confirm tap, plus a one-time "Allow from this source". App data, including unsynced changes, survives updates. The update check is unauthenticated, so **the repo must stay public**; otherwise it needs a server-side proxy. The release tag format is what the updater parses, so don't change it.

## Reminders

Local notifications (`src/lib/notifications.ts`, `expo-notifications`) are scheduled on the phone from the synced data. They fire offline and also cover times set on the website:

| Source | When it rings |
| --- | --- |
| Daily with `scheduled_time` | That time on each of the next 7 days it's due; today's is skipped once ticked |
| To-do with `scheduled_start`, or `due_date` + `scheduled_time` | Once, at that time |
| To-do with only a `due_date` | 9:00 AM on the due date |
| Running focus session | When the timer ends |

The schedule is rebuilt whenever those records change and when the app comes to the foreground, so completing, editing or deleting an item updates or cancels its reminder. Tapping a reminder opens the tab it belongs to. Times are the phone's local time (`scheduled_time` is a Postgres `TIME`).

**Settings → Reminders** has:

- the on/off switch;
- permission status, with **Allow notifications** if they're blocked;
- the number of scheduled reminders;
- a test notification;
- **Allow exact timing**, which grants Android 12+'s "Alarms & reminders" permission. Android 15 has it off by default, and without it reminders can arrive a few minutes late.

Habits have no time field, so they don't get reminders. Reminders are set when an item is created; existing items get one by setting a time on the website.

## How sync works

```text
tap ─► commitLocal(): SQLite row + outbox op in ONE transaction ─► UI updates instantly
                                   │
          online? (NetInfo, app foreground, new op, 5-min tick, backoff retry)
                                   ▼
flush(): replay outbox in order ─► website /api/... with Idempotency-Key = op_id
                                   │   (XP/HP/streak rules stay on the server)
pull():  profile, then each table independently from Supabase (RLS)
         ─► replace local cache, except rows with queued ops
realtime: postgres_changes on the synced tables ─► apply other devices' changes live
```

| Piece | File |
| --- | --- |
| Local store (records / outbox / kv / failures), write lock | `src/db/` |
| User actions (optimistic write + queued op) | `src/domain/actions.ts` |
| Offline-computed views (today's dailies, balances, budgets) | `src/domain/selectors.ts` |
| Sync engine (flush, pull, realtime, retries, check-in) | `src/sync/engine.ts` |
| Outbox | `src/sync/outbox.ts` |
| API client (errors keep the platform's real message) | `src/sync/api.ts` |
| Build-time config (cleaned of whitespace/quotes) | `src/lib/env.ts` |
| Reminders / updater | `src/lib/notifications.ts`, `src/lib/updater.ts` |

**Safe replay.**

- Ids are generated on the phone and accepted by the server, so something created offline can be completed or deleted before it ever reaches the server.
- Every queued request carries its op id as an `Idempotency-Key`. The server (`web/src/lib/idempotency.ts`) stores the first response and returns it for repeats, so a retry after a dropped connection can't double-log a transaction or double-award XP.

**One writer at a time.** All SQLite writes go through one connection behind a promise-chain lock (`withWriteLock` / `writeTransaction` in `src/db/database.ts`). Helpers called inside a transaction must be passed the executor instead of taking the lock again, or they deadlock.

**Days and XP.**

- Completions are scored per server day (UTC, like the website) and carry the day they happened.
- The server keeps a day open until the new-day check-in runs, and a completion for the open day is sent immediately.
- Completions for a later day wait for the in-app check-in ("Welcome back"); **Later** snoozes it for 10 minutes.
- A completion for a day that was already closed can't be scored, and is listed under *Couldn't sync*.

**Conflicts.** A queued local change wins over incoming data for that row until it's sent; after that, the server's version is the truth. If the server rejects an op (e.g. the item was deleted on the website), the op is dropped, the local row is corrected, and the failure shows under Settings → Sync.

**When the website is unreachable,** the profile is read straight from Supabase so XP/HP still show. Changes stay queued, and the error appears under Settings → Sync and on the header.

**What needs a connection:** signing in the first time, spending stat points, the check-in itself, refreshing the Analysis activity feed (the last copy stays visible), and downloading updates.

**Accounts.** Signing out keeps queued changes, which sync when the same account signs back in. Signing in as a different account wipes the phone's local data first. Reminders are cleared on sign-out.

## Troubleshooting

Start with **Settings → Connection → Test connection** and **Settings → Sync → Last problem**. Both show the phone's real error message.

| Symptom / error | Cause | Fix |
| --- | --- | --- |
| `Invalid URL host: "selfup.botbhai.net⏎"` | The `EXPO_PUBLIC_API_URL` variable had a trailing line break (this broke builds 3–5) | Builds 6+ clean it automatically; also re-type the variable without the line break |
| Profile stuck on "Loading", "1 to sync" never clears | The website API is unreachable; see the error above | Fix the connection; queued items send by themselves |
| `Unable to resolve host` | The phone's DNS (Private DNS, ad-blocker, carrier) | Change the DNS setting or allow-list the domain |
| SSL / "Trust anchor" errors | Certificate chain not trusted by the phone | Check the certificate setup in Coolify |
| HTTP 401 | Session expired | Sign out and back in (queued changes are kept) |
| Update download: "connection abort" | The network dropped during the ~60 MB download | It retries automatically; keep the app open on Wi-Fi |
| Reminders late or missing | Notifications or "Alarms & reminders" not allowed | Settings → Reminders → **Allow notifications** / **Allow exact timing** |
