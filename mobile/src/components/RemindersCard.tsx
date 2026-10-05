import * as Application from 'expo-application'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Notifications from 'expo-notifications'
import { useCallback, useEffect, useState } from 'react'
import { AppState, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native'

import { countScheduled, ensurePermission, rebuildReminders, remindersEnabled, sendTestNotification, setRemindersEnabled } from '@/lib/notifications'
import { Button, Card, H2, Muted } from '@/ui/primitives'
import { colors, space } from '@/ui/theme'

async function readState() {
  return {
    enabled: await remindersEnabled(),
    granted: (await Notifications.getPermissionsAsync()).granted,
    scheduled: await countScheduled(),
  }
}

/** Settings → Reminders: on/off, permission state, exact timing, test. */
export function RemindersCard() {
  const [enabled, setEnabled] = useState(true)
  const [granted, setGranted] = useState<boolean | null>(null)
  const [scheduled, setScheduled] = useState(0)
  const [note, setNote] = useState<string | null>(null)

  const refresh = useCallback(() => {
    readState().then((st) => {
      setEnabled(st.enabled)
      setGranted(st.granted)
      setScheduled(st.scheduled)
    })
  }, [])

  useEffect(() => {
    refresh()
    // Coming back from Android settings may have changed the permission.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') rebuildReminders(true).finally(refresh)
    })
    return () => sub.remove()
  }, [refresh])

  const toggle = async (on: boolean) => {
    setEnabled(on)
    await setRemindersEnabled(on)
    await rebuildReminders(true)
    refresh()
  }

  const allow = async () => {
    const ok = await ensurePermission(true)
    if (!ok) Linking.openSettings()
    await rebuildReminders(true)
    refresh()
  }

  const exactTiming = () =>
    IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', {
      data: `package:${Application.applicationId}`,
    }).catch(() => Linking.openSettings())

  const test = async () => {
    if (!(await ensurePermission(true))) {
      setNote('Notifications are blocked for SelfUp.')
      return
    }
    await sendTestNotification()
    setNote('Sent — it should appear in a few seconds.')
  }

  return (
    <Card>
      <H2
        right={
          <Switch
            value={enabled}
            onValueChange={toggle}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
            accessibilityLabel="Reminders"
          />
        }>
        Reminders
      </H2>
      <Muted>
        Alerts at the time you set on dailies and to-dos (from the phone or the website), 9:00 AM for to-dos with only a due date, and when a focus
        session ends. Works offline.
      </Muted>

      <View style={styles.item}>
        <Text style={styles.label}>Notifications</Text>
        <Text style={[styles.value, { color: granted ? colors.success : colors.danger }]}>{granted === null ? '…' : granted ? 'Allowed' : 'Blocked'}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>Scheduled</Text>
        <Text style={styles.value}>{enabled ? `${scheduled} upcoming` : 'Off'}</Text>
      </View>

      {granted === false && <Button label="Allow notifications" onPress={allow} />}
      {Platform.OS === 'android' && Number(Platform.Version) >= 31 && (
        <>
          <Button label="Allow exact timing" variant="ghost" onPress={exactTiming} />
          <Muted>Turn on “Alarms & reminders” so reminders ring on the minute; otherwise Android may deliver them a few minutes late.</Muted>
        </>
      )}
      <Button label="Send a test notification" variant="ghost" onPress={test} />
      {note && <Muted>{note}</Muted>}
    </Card>
  )
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  label: { color: colors.textMuted, fontSize: 14 },
  value: { color: colors.text, fontSize: 14 },
})
