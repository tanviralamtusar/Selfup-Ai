This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## SelfUp specifics (read first)

This is the offline-first Android client for the SelfUp website in `../web`. `README.md` covers features, the sync design, releases and troubleshooting, and `../AGENTS.md` covers the whole repo.

- **Writes:** never write to Supabase directly. Every change goes through an action in `src/domain/actions.ts` → `commitLocal()` (local row + outbox op), and the sync engine replays it through the website's `/api` with an `Idempotency-Key`. New API mutations the app uses must be wrapped in `idempotent()` on the server and accept a client `id`.
- **SQLite:** all writes go through the write lock in `src/db/database.ts`. Inside `writeTransaction`, pass the executor to record helpers, or it deadlocks.
- **Days:** everything follows the phone's time zone. `syncTimeZone()` in `src/sync/engine.ts` keeps `user_profiles.timezone` equal to it, and the server computes "today" in that zone. Use `localDay()` / `dayOf()` from `src/lib/dates.ts`, never `toISOString().slice(0, 10)`, for day logic. Reminder times (`scheduled_time`) are phone-local too.
- **Releases:** any push to `main` touching `mobile/` publishes an APK as the latest GitHub Release, and installed apps update from it. Keep the `mobile-v<version>-b<build>` tag format and the `app.selfup.net` package id.
- **Version bump (required):** every change to `mobile/` bumps `expo.version` in `app.json` in the same commit, with `version` in `package.json` set to the same value. Use semver: patch (`1.0.0` → `1.0.1`) for fixes, minor (`1.0.1` → `1.1.0`) for new features or screens, major for breaking changes such as a sync contract the old app can't handle. The build number (`versionCode`) is set by CI from the run number, so never edit it by hand. Installed apps decide whether to update from that build number. The version is the label shown in Settings and in the release tag.
- **Debugging sync on a device:** start from Settings → Connection → *Test connection* and Settings → Sync → *Last problem*. They show the platform's real error.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
