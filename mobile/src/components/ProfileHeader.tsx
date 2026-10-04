import { StyleSheet, Text, View } from 'react-native'

import { useKv } from '@/db/kv'
import type { Profile } from '@/domain/types'
import { getHpState, getRank } from '@/lib/gamification'
import { usePendingOps } from '@/sync/hooks'
import { Card, Muted, ProgressBar, Row } from '@/ui/primitives'
import { colors, space } from '@/ui/theme'
import { SyncBadge } from './SyncBadge'

/** Level, XP, HP and coins from the last synced profile, plus XP still waiting to sync. */
export function ProfileHeader() {
  const profile = useKv<Profile>('profile')
  const pending = usePendingOps()

  if (!profile) {
    return (
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted>Loading your profile…</Muted>
          <SyncBadge />
        </Row>
      </Card>
    )
  }

  const rank = getRank(profile.level)
  const hpState = getHpState(profile.hp, profile.max_hp)

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{profile.display_name || profile.username}</Text>
          <Muted>
            Level {profile.level} · {rank.rank}-rank {rank.title}
          </Muted>
        </View>
        <SyncBadge />
      </Row>

      <View style={{ gap: space.xs }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={styles.stat}>XP</Text>
          <Muted>
            {profile.xp} / {profile.xp_to_next_level}
            {pending.xp > 0 ? `  (+${pending.xp} pending)` : ''}
          </Muted>
        </Row>
        <ProgressBar value={profile.xp} max={profile.xp_to_next_level} color={colors.xp} />
      </View>

      <View style={{ gap: space.xs }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={styles.stat}>HP</Text>
          <Muted>
            {profile.hp} / {profile.max_hp} · {hpState}
          </Muted>
        </Row>
        <ProgressBar value={profile.hp} max={profile.max_hp} color={colors.hp} />
      </View>

      <Row style={{ justifyContent: 'space-between' }}>
        <Muted>🔥 {profile.streak_overall}-day streak</Muted>
        <Muted style={{ color: colors.coin }}>◎ {profile.ai_coins} AiCoins</Muted>
      </Row>
    </Card>
  )
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  stat: { color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
})
