import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { Muted } from '@/ui/primitives'
import { colors, priorityColor, radius, space } from '@/ui/theme'

/** One habit / daily / to-do line: tap the circle to complete, long-press to delete. */
export function TaskRow({
  title,
  subtitle,
  done,
  priority,
  onComplete,
  onDelete,
  pending,
  inactive,
}: {
  title: string
  subtitle?: string
  done: boolean
  priority?: string
  onComplete: () => void
  onDelete: () => void
  /** Has a change that hasn't reached the server yet. */
  pending?: boolean
  /** Not due today: dimmed, and the circle can't be tapped (long-press delete still works). */
  inactive?: boolean
}) {
  const confirmDelete = () =>
    Alert.alert('Delete?', `“${title}” will be deleted everywhere.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ])

  return (
    <Pressable
      onLongPress={confirmDelete}
      style={[styles.row, (done || inactive) && { opacity: inactive ? 0.4 : 0.6 }]}
      accessibilityHint="Long-press to delete">
      <Pressable
        onPress={done || inactive ? undefined : onComplete}
        disabled={done || inactive}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? `${title}, done` : inactive ? `${title}, not due today` : `Complete ${title}`}
        hitSlop={8}
        style={[styles.circle, { borderColor: priority ? priorityColor[priority] ?? colors.border : colors.primary }, done && styles.circleDone]}>
        {done ? <Text style={styles.check}>✓</Text> : inactive ? null : <Text style={styles.plus}>+</Text>}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, done && { textDecorationLine: 'line-through' }]} numberOfLines={2}>{title}</Text>
        {subtitle ? <Muted>{subtitle}</Muted> : null}
      </View>
      {pending ? <View style={styles.pendingDot} accessibilityLabel="Waiting to sync" /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, paddingHorizontal: space.sm, borderRadius: radius.sm, backgroundColor: colors.cardRaised, minHeight: 52 },
  circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  circleDone: { backgroundColor: colors.success, borderColor: colors.success },
  check: { color: '#000', fontWeight: '800' },
  plus: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: -2 },
  title: { color: colors.text, fontSize: 15 },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
})
