# SelfUp — Android app

Expo (SDK 57) / React Native app covering **Dashboard** (habits, dailies, to-dos), **Money**, **Time** (focus timer) and **Analysis**. It is offline-first: everything you do is saved on the phone immediately and synced with the website when there's a connection, and changes made on the website show up on the phone (and vice versa) in about a second.

## Run it

```bash
cd mobile
npm install
cp .env.example .env      # fill in Supabase URL/anon key + the website URL
npx expo start            # scan the QR code with Expo Go on your phone
```

All native modules used (expo-sqlite, NetInfo, AsyncStorage, expo-crypto) work in Expo Go. For local development against `npm run dev`, set `EXPO_PUBLIC_API_URL` to your computer's LAN address (e.g. `http://192.168.1.20:3000`), not `localhost`.

Before the first sync, run `web/scripts/migrations/add_mobile_sync.sql` in the Supabase SQL editor (idempotency table + realtime publication).

## Build an APK

### On GitHub (no Expo account needed)

`.github/workflows/android-apk.yml` runs Expo's prebuild and a Gradle release build on GitHub's runners, then uploads the APK as a workflow artifact. It runs on pushes to `main` that touch `mobile/`, on demand (Actions → *Android APK* → *Run workflow*), and on `mobile-v*` tags (for example `mobile-v1.0.0`), which also attach the APK to a GitHub Release. Each build sets `versionCode` to the run number, so a newer APK installs over an older one.

One-time setup, in the repo's **Settings → Secrets and variables → Actions**:

| Name | Kind | Value |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Variable | same as the website's `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Variable | same as `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_API_URL` | Variable | `https://<your website domain>` (must be HTTPS) |
| `ANDROID_KEYSTORE_BASE64` | Secret | optional, your signing key, base64-encoded |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Secret | optional, for that key |

Without the keystore secrets the APK is signed with Expo's shared debug key. That's fine for installing on your own phones, but not for the Play Store. Android only installs an update over an existing app when both are signed with the same key, so switching keys later means uninstalling first (which clears the phone's unsynced queue). Set up your own key before handing the app to anyone:

```bash
keytool -genkeypair -v -keystore selfup-release.jks -alias selfup -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 selfup-release.jks   # paste the output into ANDROID_KEYSTORE_BASE64
```

Keep `selfup-release.jks` and its passwords backed up outside the repo. If you lose them, you can never publish an update to the same app.

### With EAS (Expo's cloud build)

```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview      # installable .apk (see eas.json)
eas build -p android --profile production   # .aab for the Play Store
```

`EXPO_PUBLIC_*` values are baked in at build time, so set them in `.env` (or as EAS environment variables) first. Release builds block plain `http://` traffic, so point `EXPO_PUBLIC_API_URL` at the HTTPS production site. The Android package id (and iOS bundle id) is `app.selfup.net` (`app.json`). It is permanent once the app is uploaded to the Play Store.

## Checks

```bash
npm run typecheck
npx expo lint
npx expo export --platform android   # full JS bundle, catches unresolved imports
```

## How sync works

```text
tap ─► commitLocal(): SQLite row + outbox op in ONE transaction ─► UI updates instantly
                                   │
          online? (NetInfo, app foreground, new op, 5-min tick, backoff retry)
                                   ▼
flush(): replay outbox in order ─► website /api/... with Idempotency-Key = op_id
                                   │   (XP/HP/streak rules stay on the server)
pull():  read own rows from Supabase (RLS) ─► replace local cache, except rows with queued ops
realtime: postgres_changes on the synced tables ─► apply other devices' changes live
```

| Piece | File |
| --- | --- |
| Local store (records / outbox / kv / failures) | `src/db/` |
| User actions (optimistic write + queued op) | `src/domain/actions.ts` |
| Offline-computed views (today's dailies, balances, budgets) | `src/domain/selectors.ts` |
| Sync engine (flush, pull, realtime, retries, check-in) | `src/sync/engine.ts` |
| Outbox | `src/sync/outbox.ts` |

**Safe replay.**
- Ids are generated on the phone and accepted by the server, so you can complete or delete something created offline before it ever reaches the server.
- Every queued request carries its op id as an `Idempotency-Key`. The server (`web/src/lib/idempotency.ts`) stores the first response and returns it for repeats, so a retry after a dropped connection can't double-log a transaction or double-award XP.

**Days and XP.**
- Completions are scored per server day (UTC, like the website) and carry the day they happened.
- The server keeps a day open until the new-day check-in runs. A completion for the open day is sent immediately.
- Completions for a later day wait until you confirm the check-in in the app ("Welcome back").
- A completion for a day that was already closed (for example, you were offline for several days and the check-in already ran on the website) can't be scored. It's listed under *Couldn't sync*.

**Conflicts.**
- A queued local change wins over incoming data for that row until it's sent. After that, the server's version is the truth.
- If the server rejects an op (e.g. the item was deleted on the website), the op is dropped, the local row is corrected, and the failure shows in the sync sheet (tap the status badge).

**What needs a connection.**
- Signing in (the first time).
- Spending stat points.
- The check-in itself.
- Refreshing the Analysis activity feed (the last copy stays visible offline).

**Accounts.** Signing out keeps queued changes, which sync when the same account signs back in. Signing in as a different account wipes the phone's local data first.
