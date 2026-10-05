import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Modal, ScrollView, StyleSheet, Text, View } from 'react-native'

import { getKv, setKv } from '@/db/kv'
import { canSelfUpdate, checkForUpdate, currentVersionLabel, downloadAndInstall, type AvailableUpdate } from '@/lib/updater'
import { usePendingOps } from '@/sync/hooks'
import { requestSync } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { Body, Button, Muted, ProgressBar } from '@/ui/primitives'
import { colors, radius, space } from '@/ui/theme'

const CHECK_EVERY_MS = 30 * 60 * 1000

/**
 * Checks GitHub Releases on launch and when the app returns to the
 * foreground (at most every 30 min) and offers the new APK. "Later" hides
 * that build until a newer one is published.
 */
export function UpdatePrompt() {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastCheck = useRef(0)
  const online = useSyncStatus((s) => s.online)
  const pending = usePendingOps()

  /** Resolves to an update worth offering, or null. Throttled; never sets state itself. */
  const findUpdate = useCallback(async (): Promise<AvailableUpdate | null> => {
    if (!canSelfUpdate() || Date.now() - lastCheck.current < CHECK_EVERY_MS) return null
    lastCheck.current = Date.now()
    const found = await checkForUpdate()
    if (!found) return null
    const skipped = await getKv<number>('update:skipped_build')
    return skipped === found.build ? null : found
  }, [])

  useEffect(() => {
    const offer = () => {
      findUpdate().then((found) => {
        if (found) setUpdate(found)
      })
    }
    if (online) offer()
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') offer()
    })
    return () => sub.remove()
  }, [findUpdate, online])

  if (!update) return null

  const install = async () => {
    setError(null)
    // Push queued changes first when possible; they survive the update either way.
    if (pending.count > 0) requestSync()
    try {
      setProgress(0)
      await downloadAndInstall(update, setProgress)
      setProgress(null)
    } catch (e: any) {
      setProgress(null)
      setError(e?.message ?? 'Download failed')
    }
  }

  const later = async () => {
    await setKv('update:skipped_build', update.build)
    setUpdate(null)
  }

  const mb = update.sizeBytes ? ` · ${(update.sizeBytes / 1024 / 1024).toFixed(0)} MB` : ''

  return (
    <Modal visible transparent animationType="fade" onRequestClose={later}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Update available</Text>
          <Body>
            SelfUp {update.versionName} (build {update.build}){mb}
          </Body>
          <Muted>You have {currentVersionLabel()}.</Muted>
          {update.notes ? (
            <ScrollView style={{ maxHeight: 160 }}>
              <Muted>{update.notes}</Muted>
            </ScrollView>
          ) : null}
          {progress !== null && (
            <View style={{ gap: space.xs }}>
              <ProgressBar value={progress} max={1} />
              <Muted>Downloading… {Math.round(progress * 100)}%</Muted>
            </View>
          )}
          {error && <Body style={{ color: colors.danger }}>{error}</Body>}
          <Muted>Android will ask you to confirm the install. Your data stays on the phone.</Muted>
          <Button label={progress !== null ? 'Downloading…' : 'Update now'} onPress={install} loading={progress !== null} disabled={!online} />
          {!online && <Muted>Connect to the internet to download.</Muted>}
          <Button label="Later" variant="ghost" onPress={later} disabled={progress !== null} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
})
