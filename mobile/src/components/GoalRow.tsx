import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { formatDate } from '@/components/PickerField'
import { daysLeft, goalStatus } from '@/domain/selectors'
import type { Goal } from '@/domain/types'
import { Button, Muted, ProgressBar, Row } from '@/ui/primitives'
import { colors, radius, space } from '@/ui/theme'

/** Deleting an active goal later than this counts as giving up (mirrors FREE_DELETE_MS on the server). */
const FREE_DELETE_MS = 60 * 60 * 1000

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''))

/** One deadline goal: progress, time left and what's at stake. Long-press to delete. */
export function GoalRow({
  goal,
  pending,
  onProgress,
  onLog,
  onDelete,
}: {
  goal: Goal
  pending?: boolean
  /** Add one unit (or finish a yes/no goal). */
  onProgress: () => void
  /** Open the custom-amount sheet. */
  onLog: () => void
  onDelete: () => void
}) {
  const status = goalStatus(goal)
  const left = daysLeft(goal)
  const target = Number(goal.target_value)
  const current = Number(goal.current_value)
  const isCheck = target === 1 && !goal.unit
  const urgent = status === 'active' && left <= 2

  const when =
    status === 'completed' ? 'Completed' :
    status === 'failed' ? `Failed · deadline was ${formatDate(goal.deadline)}` :
    left === 0 ? 'Due today' :
    left === 1 ? '1 day left' :
    `${left} days left · ${formatDate(goal.deadline)}`

  const confirmDelete = () => {
    const givingUp = status === 'active' && Date.now() - new Date(goal.created_at).getTime() > FREE_DELETE_MS
    Alert.alert(
      givingUp ? 'Give up on this goal?' : 'Delete?',
      givingUp
        ? `Deleting “${goal.title}” before it’s done counts as missing it: you’ll lose ${goal.hp_penalty} HP.`
        : `“${goal.title}” will be deleted everywhere.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: givingUp ? 'Give up' : 'Delete', style: 'destructive', onPress: onDelete },
      ]
    )
  }

  const barColor = status === 'completed' ? colors.success : status === 'failed' ? colors.danger : urgent ? colors.warning : colors.primary

  return (
    <Pressable onLongPress={confirmDelete} style={[styles.row, status !== 'active' && { opacity: 0.65 }]} accessibilityHint="Long-press to delete">
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={[styles.title, status === 'completed' && { textDecorationLine: 'line-through' }]} numberOfLines={2}>
          {status === 'completed' ? '✅ ' : status === 'failed' ? '❌ ' : ''}{goal.title}
        </Text>
        {pending ? <View style={styles.pendingDot} accessibilityLabel="Waiting to sync" /> : null}
      </Row>

      {!isCheck && (
        <>
          <ProgressBar value={current} max={target} color={barColor} />
          <Muted>{fmt(current)} / {fmt(target)}{goal.unit ? ` ${goal.unit}` : ''}</Muted>
        </>
      )}

      <Muted style={{ color: status === 'failed' ? colors.danger : urgent ? colors.warning : colors.textMuted }}>{when}</Muted>
      {status === 'active' && <Muted>+{goal.xp_reward} XP if done · −{goal.hp_penalty} HP if missed</Muted>}

      {status === 'active' && (
        <Row>
          {isCheck ? (
            <Button small label="Mark done" onPress={onProgress} />
          ) : (
            <>
              <Button small label="+1" accessibilityLabel={`Add 1 to ${goal.title}`} onPress={onProgress} />
              <Button small variant="ghost" label="Log amount" onPress={onLog} />
            </>
          )}
        </Row>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { gap: space.xs, padding: space.md, borderRadius: radius.sm, backgroundColor: colors.cardRaised },
  title: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning, marginTop: 6 },
})
