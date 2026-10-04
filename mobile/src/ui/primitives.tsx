import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors, radius, space } from './theme'

export function Screen({ children, onRefresh, refreshing }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          ) : undefined
        }>
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>
}

export function H2({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.h2Row}>
      <Text style={styles.h2}>{children}</Text>
      {right}
    </View>
  )
}

export function Muted({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.muted, style]}>{children}</Text>
}

export function Body({ children, style, numberOfLines }: { children: ReactNode; style?: TextStyle; numberOfLines?: number }) {
  return <Text style={[styles.body, style]} numberOfLines={numberOfLines}>{children}</Text>
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  accessibilityLabel,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  loading?: boolean
  small?: boolean
  accessibilityLabel?: string
}) {
  const bg = variant === 'primary' ? colors.primary : 'transparent'
  const fg = variant === 'primary' ? colors.primaryText : variant === 'danger' ? colors.danger : colors.text
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, borderColor: variant === 'primary' ? bg : colors.border, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, small && { fontSize: 13 }, { color: fg }]}>{label}</Text>}
    </Pressable>
  )
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  )
}

/** Single-choice pill row. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((o) => {
          const selected = o.value === value
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={[styles.segment, selected && styles.segmentSelected]}>
              <Text style={[styles.segmentText, selected && { color: colors.text }]}>{o.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function ProgressBar({ value, max, color = colors.primary, height = 6 }: { value: number; max: number; color?: string; height?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: Math.max(max, 0), now: Math.max(0, Math.min(value, max)) }}>
      <View style={{ width: `${pct * 100}%`, height, backgroundColor: color, borderRadius: radius.pill }} />
    </View>
  )
}

export function Empty({ text }: { text: string }) {
  return <Muted style={{ textAlign: 'center', paddingVertical: space.lg }}>{text}</Muted>
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm }, style]}>{children}</View>
}

/** Bottom sheet–style modal with a title and a form body. */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
            <Text style={styles.h2}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12}>
              <Text style={styles.muted}>Close</Text>
            </Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: space.md }}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: space.lg, gap: space.lg, paddingBottom: space.xl * 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.md },
  h1: { color: colors.text, fontSize: 24, fontWeight: '700' },
  h2Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h2: { color: colors.text, fontSize: 17, fontWeight: '600' },
  muted: { color: colors.textMuted, fontSize: 13 },
  body: { color: colors.text, fontSize: 15 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  button: { minHeight: 44, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  buttonSmall: { minHeight: 34, paddingHorizontal: space.md },
  buttonText: { fontSize: 15, fontWeight: '600' },
  input: { minHeight: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardRaised, color: colors.text, paddingHorizontal: space.md, fontSize: 15 },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  segment: { paddingHorizontal: space.md, minHeight: 34, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  segmentSelected: { backgroundColor: colors.accent, borderColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  track: { width: '100%', backgroundColor: colors.cardRaised, borderRadius: radius.pill, overflow: 'hidden' },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, maxHeight: '85%', borderWidth: 1, borderColor: colors.border },
})
