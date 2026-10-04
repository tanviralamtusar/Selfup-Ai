import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { timeAgo } from '@/lib/dates'
import { requestSync } from '@/sync/engine'
import { usePendingOps, useSyncFailures } from '@/sync/hooks'
import { clearFailures } from '@/sync/outbox'
import { useSyncStatus } from '@/sync/status'
import { Body, Button, Muted, Sheet } from '@/ui/primitives'
import { colors, radius, space } from '@/ui/theme'

/** Compact online/offline + queue indicator; tap for details. */
export function SyncBadge() {
  const { online, syncing, lastSyncAt, lastError, heldOps, needsSignIn } = useSyncStatus()
  const pending = usePendingOps()
  const failures = useSyncFailures()
  const [open, setOpen] = useState(false)

  const tone = !online ? colors.warning : failures.length || needsSignIn ? colors.danger : colors.success
  const label = !online
    ? pending.count ? `Offline · ${pending.count} queued` : 'Offline'
    : syncing ? 'Syncing…'
    : pending.count ? `${pending.count} to sync`
    : failures.length ? `${failures.length} failed`
    : 'Synced'

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Sync status: ${label}. Show details`}
        style={styles.badge}
        hitSlop={8}>
        {syncing ? <ActivityIndicator size="small" color={tone} /> : <View style={[styles.dot, { backgroundColor: tone }]} />}
        <Text style={styles.text}>{label}</Text>
      </Pressable>

      <Sheet visible={open} title="Sync" onClose={() => setOpen(false)}>
        <Body>{online ? 'Online' : 'Offline. Everything you do is saved on this phone and syncs automatically when you reconnect.'}</Body>
        <Muted>Last synced {timeAgo(lastSyncAt)}</Muted>
        {pending.count > 0 && (
          <Muted>
            {pending.count} change{pending.count === 1 ? '' : 's'} waiting{pending.xp ? ` (+${pending.xp} XP pending)` : ''}.
          </Muted>
        )}
        {heldOps > 0 && <Muted>{heldOps} completion{heldOps === 1 ? '' : 's'} will send after today’s check-in.</Muted>}
        {needsSignIn && <Body style={{ color: colors.danger }}>Your session expired. Sign out and back in to resume syncing. Queued changes are kept.</Body>}
        {lastError && !needsSignIn && <Muted>Last problem: {lastError}</Muted>}
        <Button label="Sync now" onPress={() => requestSync()} disabled={!online} />

        {failures.length > 0 && (
          <View style={{ gap: space.sm }}>
            <Body style={{ fontWeight: '600' }}>Couldn’t sync</Body>
            {failures.map((f) => (
              <View key={f.op_id} style={styles.failure}>
                <Body numberOfLines={1}>{f.label}</Body>
                <Muted>{f.error}</Muted>
              </View>
            ))}
            <Button label="Dismiss" variant="ghost" onPress={clearFailures} />
          </View>
        )}
      </Sheet>
    </>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: colors.text, fontSize: 12, fontWeight: '600' },
  failure: { padding: space.sm, borderRadius: radius.sm, backgroundColor: colors.cardRaised, gap: 2 },
})
