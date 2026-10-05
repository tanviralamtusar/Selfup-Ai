import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { useKv } from '@/db/kv'
import type { Profile } from '@/domain/types'
import { timeAgo } from '@/lib/dates'
import { ATTRIBUTES, getRank } from '@/lib/gamification'
import { apiRequest } from '@/sync/api'
import { requestSync } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { Body, Button, Card, Empty, H1, H2, Muted, ProgressBar, Row, Screen } from '@/ui/primitives'
import { colors, radius } from '@/ui/theme'

interface Activity {
  id: string
  type: string
  title: string
  xp_earned: number
  timestamp: string
}

interface AnalysisCache {
  activities?: Activity[]
  weeklyActivity?: boolean[]
  updatedAt?: string
}

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Analysis() {
  const profile = useKv<Profile>('profile')
  const cache = useKv<AnalysisCache>('analysis')
  const { online, syncing, lastError } = useSyncStatus()
  const [allocating, setAllocating] = useState<string | null>(null)

  const allocate = async (attribute: string) => {
    setAllocating(attribute)
    // Spending stat points needs the server's answer, so it's online-only.
    const r = await apiRequest('POST', '/api/gamification', JSON.stringify({ action: 'allocate_stat', attribute }))
    setAllocating(null)
    if (r.kind === 'ok') requestSync()
    else Alert.alert('Couldn’t allocate', r.error)
  }

  if (!profile) {
    return (
      <Screen onRefresh={() => requestSync()} refreshing={syncing}>
        <H1>Analysis</H1>
        <Card>
          <Empty text={syncing ? 'Loading your stats…' : online ? 'Your stats haven’t loaded yet.' : 'Connect to the internet once to load your stats.'} />
          {!syncing && lastError ? <Muted style={{ color: colors.danger }}>{lastError}</Muted> : null}
          {!syncing && online && <Button label="Retry" variant="ghost" onPress={() => requestSync()} />}
        </Card>
      </Screen>
    )
  }

  const rank = getRank(profile.level)
  const maxAttr = Math.max(10, ...ATTRIBUTES.map((a) => Number(profile[`attr_${a.key}` as keyof Profile]) || 0))

  return (
    <Screen onRefresh={() => requestSync()} refreshing={syncing}>
      <H1>Analysis</H1>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Level" value={String(profile.level)} />
          <Stat label="Rank" value={`${rank.rank} · ${rank.title}`} />
          <Stat label="Total XP" value={String(profile.total_xp ?? 0)} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Streak" value={`${profile.streak_overall}d`} />
          <Stat label="Best" value={`${profile.streak_best}d`} />
          <Stat label="Freezes" value={String(profile.streak_freeze_count ?? 0)} />
        </Row>
      </Card>

      <Card>
        <H2 right={profile.stat_points > 0 ? <Muted style={{ color: colors.primary }}>{profile.stat_points} points to spend</Muted> : undefined}>
          Attributes
        </H2>
        {ATTRIBUTES.map((a) => {
          const value = Number(profile[`attr_${a.key}` as keyof Profile]) || 0
          return (
            <View key={a.key} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body>{a.label}</Body>
                <Row>
                  <Muted>{value}</Muted>
                  {profile.stat_points > 0 && (
                    <Button small label="+" accessibilityLabel={`Add a point to ${a.label}`} onPress={() => allocate(a.key)} disabled={!online} loading={allocating === a.key} />
                  )}
                </Row>
              </Row>
              <ProgressBar value={value} max={maxAttr} />
            </View>
          )
        })}
        {profile.stat_points > 0 && !online && <Muted>Go online to spend stat points.</Muted>}
      </Card>

      <Card>
        <H2>This week</H2>
        {cache?.weeklyActivity ? (
          <Row style={{ justifyContent: 'space-between' }}>
            {cache.weeklyActivity.map((on, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.day, on && { backgroundColor: colors.success, borderColor: colors.success }]} />
                <Muted>{WEEK[i]}</Muted>
              </View>
            ))}
          </Row>
        ) : (
          <Empty text="Not loaded yet." />
        )}
      </Card>

      <Card>
        <H2>Recent activity</H2>
        {!cache?.activities?.length ? (
          <Empty text="No activity yet." />
        ) : (
          cache.activities.slice(0, 20).map((a) => (
            <Row key={`${a.type}:${a.id}`} style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Body numberOfLines={1}>{a.title}</Body>
                <Muted>{timeAgo(a.timestamp)}</Muted>
              </View>
              {a.xp_earned ? <Text style={{ color: colors.xp, fontWeight: '600' }}>+{a.xp_earned}</Text> : null}
            </Row>
          ))
        )}
        {cache?.updatedAt && <Muted>Updated {timeAgo(cache.updatedAt)}</Muted>}
      </Card>

    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Muted>{label}</Muted>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  day: { width: 28, height: 28, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardRaised },
})

