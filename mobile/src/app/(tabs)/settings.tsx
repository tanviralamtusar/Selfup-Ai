import * as Application from 'expo-application'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Linking from 'expo-linking'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform, StyleSheet, Text, View } from 'react-native'

import { RemindersCard } from '@/components/RemindersCard'
import { db, resetDatabase, subscribe } from '@/db/database'
import { setKv, useKv } from '@/db/kv'
import type { Profile } from '@/domain/types'
import { localDay, phoneTimeZone, timeAgo } from '@/lib/dates'
import { API_URL, SUPABASE_URL } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { canSelfUpdate, checkForUpdate, downloadAndInstall, type AvailableUpdate } from '@/lib/updater'
import { apiRequest } from '@/sync/api'
import { getCurrentUserId, requestSync } from '@/sync/engine'
import { usePendingOps, useSyncFailures } from '@/sync/hooks'
import { clearFailures } from '@/sync/outbox'
import { useSyncStatus } from '@/sync/status'
import { Body, Button, Card, H1, H2, Muted, ProgressBar, Screen } from '@/ui/primitives'
import { colors, space } from '@/ui/theme'

const RELEASES_URL = 'https://github.com/tanviralamtusar/Selfup-Ai/releases'

/** A label/value line; values are selectable so they can be copied into a bug report. */
function Item({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tone ? { color: tone } : null]} selectable>
        {value}
      </Text>
    </View>
  )
}

export default function Settings() {
  const profile = useKv<Profile>('profile')
  const sync = useSyncStatus()
  const pending = usePendingOps()
  const failures = useSyncFailures()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null))
  }, [])

  const signOut = () => {
    const go = () => supabase.auth.signOut({ scope: 'local' })
    if (pending.count === 0) return void go()
    Alert.alert(
      'Sign out?',
      `${pending.count} change${pending.count === 1 ? '' : 's'} haven’t synced yet. They stay on this phone and sync when you sign back in with the same account.`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: go }]
    )
  }

  return (
    <Screen onRefresh={() => requestSync()} refreshing={sync.syncing}>
      <H1>Settings</H1>

      <AppCard />

      <RemindersCard />

      <Card>
        <H2>Account</H2>
        <Item label="Name" value={profile ? profile.display_name || profile.username : '—'} />
        <Item label="Email" value={email ?? '—'} />
        <Item label="User ID" value={getCurrentUserId() || '—'} />
        <Button label="Sign out" variant="danger" onPress={signOut} />
      </Card>

      <Card>
        <H2>Sync</H2>
        <Item label="Network" value={sync.online ? 'Online' : 'Offline'} tone={sync.online ? colors.success : colors.warning} />
        <Item label="Last synced" value={sync.syncing ? 'syncing now…' : timeAgo(sync.lastSyncAt)} />
        <Item label="Live updates" value={sync.realtime === 'SUBSCRIBED' ? 'Connected' : sync.realtime} />
        <Item label="Waiting to sync" value={`${pending.count}${pending.xp ? ` (+${pending.xp} XP)` : ''}`} />
        {sync.heldOps > 0 && (
          <Item label="Held" value={`${sync.heldOps} · ${sync.heldReason === 'server' ? 'server unreachable' : 'waiting for check-in'}`} />
        )}
        <Item label="Failed" value={String(failures.length)} tone={failures.length ? colors.danger : undefined} />
        {sync.lastError ? <Item label="Last problem" value={sync.lastError} tone={colors.danger} /> : null}
        <Button label="Sync now" onPress={() => requestSync()} disabled={!sync.online} />
        {failures.length > 0 && <Button label="Clear failed items" variant="ghost" onPress={clearFailures} />}
      </Card>

      <ConnectionCard />
      <DeviceCard />
      <StorageCard pendingCount={pending.count} />

      <Card>
        <H2>About</H2>
        <Body>SelfUp — your life, levelled up. Works offline and syncs with the website.</Body>
        {API_URL ? <Button label="Open the website" variant="ghost" onPress={() => Linking.openURL(API_URL)} /> : null}
        <Button label="All releases" variant="ghost" onPress={() => Linking.openURL(RELEASES_URL)} />
      </Card>
    </Screen>
  )
}

function AppCard() {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [update, setUpdate] = useState<AvailableUpdate | null>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const check = async () => {
    setChecking(true)
    setResult(null)
    const found = await checkForUpdate()
    setChecking(false)
    setUpdate(found)
    setResult(found ? null : 'You’re on the latest version.')
  }

  const install = async () => {
    if (!update) return
    try {
      setProgress(0)
      await downloadAndInstall(update, setProgress)
    } catch (e: any) {
      setResult(e?.message ?? 'Download failed')
    } finally {
      setProgress(null)
    }
  }

  return (
    <Card>
      <H2>App</H2>
      <Item label="Version" value={Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '—'} />
      <Item label="Build" value={Application.nativeBuildVersion ?? '—'} />
      <Item label="App ID" value={Application.applicationId ?? '—'} />
      {canSelfUpdate() ? (
        <>
          {update ? (
            <>
              <Body>
                Build {update.build} ({update.versionName}) is available.
              </Body>
              {progress !== null && <ProgressBar value={progress} max={1} />}
              <Button label={progress !== null ? `Downloading… ${Math.round(progress * 100)}%` : 'Download & install'} onPress={install} loading={progress !== null} />
            </>
          ) : (
            <Button label="Check for updates" variant="ghost" onPress={check} loading={checking} />
          )}
          {result && <Muted>{result}</Muted>}
        </>
      ) : (
        <Muted>Update checks run in release builds only (not Expo Go or dev builds).</Muted>
      )}
    </Card>
  )
}

/** Probes both backends so a sync problem can be pinned on one of them. */
function ConnectionCard() {
  const [busy, setBusy] = useState(false)
  const [api, setApi] = useState<string | null>(null)
  const [db_, setDb] = useState<string | null>(null)

  const test = async () => {
    setBusy(true)
    const t0 = Date.now()
    const r = await apiRequest('GET', '/api/user')
    const apiMs = Date.now() - t0
    setApi(r.kind === 'ok' ? `OK (${apiMs} ms)` : `${r.error}${r.status ? ` [HTTP ${r.status}]` : ''} (${apiMs} ms)`)

    const t1 = Date.now()
    const { error } = await supabase.from('user_profiles').select('id').limit(1)
    const dbMs = Date.now() - t1
    setDb(error ? `${error.message} (${dbMs} ms)` : `OK (${dbMs} ms)`)
    setBusy(false)
  }

  return (
    <Card>
      <H2>Connection</H2>
      <Item label="Website API" value={API_URL || 'not set at build time'} />
      <Item label="Supabase" value={SUPABASE_URL ? SUPABASE_URL.replace(/^https?:\/\//, '') : 'not set at build time'} />
      {api && <Item label="API test" value={api} tone={api.startsWith('OK') ? colors.success : colors.danger} />}
      {db_ && <Item label="Supabase test" value={db_} tone={db_.startsWith('OK') ? colors.success : colors.danger} />}
      <Button label="Test connection" variant="ghost" onPress={test} loading={busy} />
    </Card>
  )
}

function DeviceCard() {
  const tz = phoneTimeZone()
  const profile = useKv<Profile & { timezone?: string }>('profile')
  const accountTz = profile?.timezone
  return (
    <Card>
      <H2>Device</H2>
      <Item label="Model" value={[Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || '—'} />
      <Item label="OS" value={`${Platform.OS === 'android' ? 'Android' : Platform.OS} ${Device.osVersion ?? Platform.Version}`} />
      <Item label="Time zone" value={tz} />
      <Item label="Today" value={localDay()} />
      <Item
        label="Account time zone"
        value={accountTz ? (accountTz === tz ? `${accountTz} ✓` : `${accountTz} (updating to ${tz})`) : '—'}
        tone={accountTz && accountTz !== tz ? colors.warning : undefined}
      />
      <Muted>Your day follows this phone’s time zone: dailies, the check-in and streaks roll over at your local midnight, on the website too.</Muted>
    </Card>
  )
}

function StorageCard({ pendingCount }: { pendingCount: number }) {
  const [counts, setCounts] = useState<{ tbl: string; n: number }[]>([])

  const load = useCallback(() => {
    db.getAllAsync<{ tbl: string; n: number }>('SELECT tbl, COUNT(*) AS n FROM records GROUP BY tbl ORDER BY tbl')
      .then(setCounts)
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const subs = ['*', 'dailies', 'habits', 'todos', 'money_transactions'].map((c) => subscribe(c, load))
    return () => subs.forEach((u) => u())
  }, [load])

  const reset = () => {
    if (pendingCount > 0) {
      Alert.alert('Not yet', `${pendingCount} change${pendingCount === 1 ? '' : 's'} haven’t synced. Reset after they sync, or they’ll be lost.`)
      return
    }
    Alert.alert('Reset local data?', 'This clears the copy stored on this phone and downloads everything again. Nothing on the server is deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetDatabase()
          const uid = getCurrentUserId()
          if (uid) await setKv('owner', uid)
          requestSync()
        },
      },
    ])
  }

  const total = counts.reduce((s, c) => s + c.n, 0)
  return (
    <Card>
      <H2>Stored on this phone</H2>
      {counts.length === 0 ? <Muted>Nothing yet.</Muted> : counts.map((c) => <Item key={c.tbl} label={c.tbl.replace(/_/g, ' ')} value={String(c.n)} />)}
      <Muted>{total} records in total.</Muted>
      <Button label="Reset local data" variant="ghost" onPress={reset} />
    </Card>
  )
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md },
  label: { color: colors.textMuted, fontSize: 14, flexShrink: 0 },
  value: { color: colors.text, fontSize: 14, flex: 1, textAlign: 'right' },
})
