import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, space } from '@/ui/theme'

const pad = (n: number) => String(n).padStart(2, '0')

/** "HH:MM" → "8:30 AM" in the phone's locale. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** "YYYY-MM-DD" → "Mon, Oct 6". */
export function formatDate(ymd: string): string {
  const [y, mo, d] = ymd.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * A tappable field that opens Android's native time or date picker.
 * Values are "HH:MM" (time) or "YYYY-MM-DD" (date), or null when cleared.
 */
export function PickerField({
  label,
  mode,
  value,
  onChange,
  placeholder,
}: {
  label: string
  mode: 'time' | 'date'
  value: string | null
  onChange: (v: string | null) => void
  placeholder: string
}) {
  const open = () => {
    const now = new Date()
    let initial = now
    if (value && mode === 'time') {
      const [h, m] = value.split(':').map(Number)
      initial = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
    } else if (value && mode === 'date') {
      const [y, mo, d] = value.split('-').map(Number)
      initial = new Date(y, mo - 1, d)
    } else if (mode === 'time') {
      initial = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0)
    }
    DateTimePickerAndroid.open({
      value: initial,
      mode,
      is24Hour: false,
      minimumDate: mode === 'date' ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : undefined,
      onChange: (event, picked) => {
        if (event.type !== 'set' || !picked) return
        onChange(
          mode === 'time'
            ? `${pad(picked.getHours())}:${pad(picked.getMinutes())}`
            : `${picked.getFullYear()}-${pad(picked.getMonth() + 1)}-${pad(picked.getDate())}`
        )
      },
    })
  }

  const shown = value ? (mode === 'time' ? formatTime(value) : formatDate(value)) : placeholder

  return (
    <View style={{ gap: space.xs }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable onPress={open} style={styles.field} accessibilityRole="button" accessibilityLabel={`${label}: ${shown}. Change`}>
          <Text style={[styles.value, !value && { color: colors.textMuted }]}>{shown}</Text>
        </Pressable>
        {value ? (
          <Pressable onPress={() => onChange(null)} style={styles.clear} accessibilityRole="button" accessibilityLabel={`Clear ${label}`} hitSlop={8}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  field: { flex: 1, minHeight: 44, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardRaised, paddingHorizontal: space.md },
  value: { color: colors.text, fontSize: 15 },
  clear: { paddingHorizontal: space.sm, minHeight: 44, justifyContent: 'center' },
  clearText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
})
