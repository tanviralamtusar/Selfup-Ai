import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { confirmCheckin } from '@/sync/engine'
import { useSyncStatus, type Checkin } from '@/sync/status'
import { Body, Button, Muted } from '@/ui/primitives'
import { colors, radius, space } from '@/ui/theme'

/**
 * Habitica-style new-day check-in (same flow as the website's DayStartModal).
 * Shown when the server has a day to roll over; the user confirms which of
 * that day's dailies they actually did before misses are scored.
 */
const SNOOZE_MS = 10 * 60 * 1000

export function CheckInModal() {
  const checkin = useSyncStatus((s) => s.checkin)
  const result = useSyncStatus((s) => s.checkinResult)
  const set = useSyncStatus((s) => s.set)

  if (result && !checkin) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => set({ checkinResult: null })}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{result.perfectDay ? 'Perfect day!' : 'New day started'}</Text>
            <Body>
              {result.completedCount} done · {result.missedCount} missed
            </Body>
            {result.xpEarned > 0 && <Muted>+{result.xpEarned} XP for dailies you checked off</Muted>}
            {(result.xpLost > 0 || result.hpLost > 0) && (
              <Muted style={{ color: colors.danger }}>
                −{result.xpLost} XP, −{result.hpLost} HP for missed dailies
              </Muted>
            )}
            <Button label="Let’s go" onPress={() => set({ checkinResult: null })} />
          </View>
        </View>
      </Modal>
    )
  }

  if (!checkin) return null
  // Keyed so the pre-checked set resets for each new check-in.
  return <CheckInForm key={`${checkin.lastCronDate}:${checkin.today}`} checkin={checkin} onLater={() => set({ checkin: null, checkinSnoozedUntil: Date.now() + SNOOZE_MS })} />
}

function CheckInForm({ checkin, onLater }: { checkin: Checkin; onLater: () => void }) {
  // Dailies ticked during that day were already scored and start checked.
  const [done, setDone] = useState<Set<string>>(() => new Set(checkin.dailies.filter((d) => d.is_completed).map((d) => d.id)))
  const [busy, setBusy] = useState(false)

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const submit = async () => {
    setBusy(true)
    await confirmCheckin([...done])
    setBusy(false)
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Muted>
            Before today starts: which of these did you do on {checkin.lastCronDate}? Unchecked dailies count as missed.
            {checkin.daysMissed > 1 ? ` (You were away ${checkin.daysMissed} days; only the last open day is scored.)` : ''}
          </Muted>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: space.sm }}>
            {checkin.dailies.map((d) => {
              const checked = done.has(d.id)
              return (
                <Pressable
                  key={d.id}
                  onPress={() => toggle(d.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  style={[styles.item, checked && { borderColor: colors.success }]}>
                  <View style={[styles.box, checked && { backgroundColor: colors.success, borderColor: colors.success }]}>
                    {checked && <Text style={{ color: '#000', fontWeight: '700' }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body numberOfLines={2}>{d.title}</Body>
                    <Muted>
                      +{d.xp_reward} XP · −{d.xp_penalty} if missed
                    </Muted>
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>
          <Button label="Start my day" onPress={submit} loading={busy} />
          {/* Never trap the user (e.g. they went offline mid-check-in); it comes back on the next sync. */}
          <Button label="Later" variant="ghost" onPress={onLater} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardRaised },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
})
