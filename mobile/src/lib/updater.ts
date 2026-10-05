import * as Application from 'expo-application'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { File, Paths } from 'expo-file-system'
import { getContentUriAsync } from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'
import { Platform } from 'react-native'

/**
 * Self-update from GitHub Releases.
 *
 * The "Android APK" workflow publishes every build as a release tagged
 * `mobile-v<version>-b<build>`, where <build> is the Android versionCode. The
 * app compares that number with its own versionCode, downloads the newer APK
 * and hands it to Android's package installer. Android requires the user to
 * confirm each install (and once allow "install unknown apps" for SelfUp);
 * app data, including unsynced changes, survives the update.
 */

const REPO = process.env.EXPO_PUBLIC_UPDATE_REPO || 'tanviralamtusar/Selfup-Ai'
const TAG_RE = /^mobile-v(.+)-b(\d+)$/

export interface AvailableUpdate {
  versionName: string
  build: number
  apkUrl: string
  sizeBytes: number
  notes: string
  publishedAt: string
}

/** Only release builds can update themselves (not Expo Go / dev builds / iOS). */
export function canSelfUpdate(): boolean {
  return Platform.OS === 'android' && !__DEV__ && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
}

export function currentBuild(): number {
  return Number(Application.nativeBuildVersion) || 0
}

export function currentVersionLabel(): string {
  return `${Application.nativeApplicationVersion ?? '?'} (build ${Application.nativeBuildVersion ?? '?'})`
}

/** The latest release if it's newer than this install, else null. Never throws. */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  if (!canSelfUpdate()) return null
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const release = await res.json()
    const m = TAG_RE.exec(release.tag_name ?? '')
    if (!m) return null
    const build = Number(m[2])
    if (!(build > currentBuild())) return null
    const apk = (release.assets ?? []).find((a: any) => typeof a.name === 'string' && a.name.endsWith('.apk'))
    if (!apk) return null
    return {
      versionName: m[1],
      build,
      apkUrl: apk.browser_download_url,
      sizeBytes: apk.size ?? 0,
      notes: (release.body ?? '').trim(),
      publishedAt: release.published_at ?? '',
    }
  } catch {
    return null
  }
}

/** Download the APK (reporting 0–1 progress) and open Android's installer. */
export async function downloadAndInstall(update: AvailableUpdate, onProgress?: (fraction: number) => void): Promise<void> {
  const dest = new File(Paths.cache, `selfup-update-${update.build}.apk`)

  // Large downloads get cut off ("Software caused connection abort") when the
  // network hands over or the phone sleeps; retry a few times before giving up.
  const ATTEMPTS = 3
  let file: File | null = null
  let lastError: unknown = null
  for (let attempt = 1; attempt <= ATTEMPTS && !file; attempt++) {
    if (dest.exists) dest.delete()
    onProgress?.(0)
    try {
      const task = File.createDownloadTask(update.apkUrl, dest, {
        onProgress: ({ bytesWritten, totalBytes }) => {
          const total = totalBytes > 0 ? totalBytes : update.sizeBytes
          if (total > 0) onProgress?.(Math.min(1, bytesWritten / total))
        },
      })
      file = await task.downloadAsync()
      if (!file) throw new Error('Download was cancelled')
    } catch (e) {
      file = null
      lastError = e
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
  if (!file) {
    const why = lastError instanceof Error ? lastError.message : String(lastError)
    throw new Error(`Download kept failing (${why}). Keep the app open on a stable connection and tap Update now again.`)
  }

  // The installer needs a content:// URI it is allowed to read.
  const contentUri = await getContentUriAsync(file.uri)
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
  })
}
