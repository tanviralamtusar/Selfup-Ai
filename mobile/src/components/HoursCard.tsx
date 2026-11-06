import Ionicons from '@expo/vector-icons/Ionicons'
import { randomUUID } from 'expo-crypto'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { setKv, useKv } from '@/db/kv'
import {
  DEFAULT_COMMITMENTS,
  HOURS_IN_DAY,
  computeWeek,
  formatHours,
  remainingToday,
  sanitizeHours,
  type Commitment,
  type DayType,
} from '@/lib/availableHours'
import { Body, Button, Card, H2, Input, Muted, Row, Segmented } from '@/ui/primitives'
import { colors, radius, space } from '@/ui/theme'

// Phone-only planner settings, kept in the local kv table (not synced).
const KV_KEY = 'available_hours'

interface Settings {
  commitments: Commitment[]
  bedtimeHour: number
}

const DEFAULTS: Settings = { commitments: DEFAULT_COMMITMENTS, bedtimeHour: 23 }

const DAY_OPTIONS = [
  { value: 'weekday', label: 'Weekday' },
  { value: 'weekend', label: 'Weekend' },
] as const

const BEDTIMES = [21, 22, 23, 0, 1, 2]
const BEDTIME_OPTIONS = BEDTIMES.map((h) => ({ value: String(h), label: hourLabel(h) }))

const SEGMENT_COLORS = ['#818cf8', '#38bdf8', '#fbbf24', '#fb7185', '#a78bfa', '#2dd4bf', '#fb923c', '#f472b6']

function hourLabel(h: number) {
  return `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`
}

function isWeekend(d: Date) {
  return d.getDay() === 0 || d.getDay() === 6
}

/** Hours field that lets you type "1." or clear it without snapping back mid-edit. */
function HoursInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  // Only while focused; otherwise the field shows the saved value.
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <TextInput
      value={draft ?? String(value)}
      onFocus={() => setDraft(String(value))}
      onChangeText={(t) => {
        setDraft(t)
        const n = Number(t.replace(',', '.'))
        if (t.trim() !== '' && Number.isFinite(n)) onChange(n)
      }}
      onBlur={() => setDraft(null)}
      keyboardType="decimal-pad"
      selectTextOnFocus
      accessibilityLabel={label}
      style={styles.hours}
    />
  )
}

/** How many free hours a day has once sleep, work and other fixed commitments are taken out. */
export function HoursCard() {
  const stored = useKv<Settings>(KV_KEY)
  const settings = stored ?? DEFAULTS
  const [day, setDay] = useState<DayType>(() => (isWeekend(new Date()) ? 'weekend' : 'weekday'))
  const [editing, setEditing] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const save = (next: Settings) => void setKv(KV_KEY, next)
  const update = (id: string, patch: Partial<Commitment>) =>
    save({
      ...settings,
      commitments: settings.commitments.map((c) => {
        if (c.id !== id) return c
        const n = { ...c, ...patch }
        return { ...n, weekday: sanitizeHours(n.weekday), weekend: sanitizeHours(n.weekend) }
      }),
    })

  const week = computeWeek(settings.commitments)
  const b = week[day]
  const todayType: DayType = isWeekend(now) ? 'weekend' : 'weekday'
  const sleep = settings.commitments.find((c) => c.id === 'sleep')?.[todayType] ?? 0
  const leftToday = remainingToday(week[todayType].available, sleep, now, settings.bedtimeHour)
  const scale = Math.max(HOURS_IN_DAY, b.committed)

  return (
    <Card>
      <H2 right={<Button small variant="ghost" label={editing ? 'Done' : 'Edit'} onPress={() => setEditing(!editing)} />}>
        Hours available
      </H2>
      <Segmented options={DAY_OPTIONS} value={day} onChange={setDay} />

      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={styles.big}>{formatHours(b.available)}</Text>
          <Muted>free per {day} · {formatHours(b.committed)} committed</Muted>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Body style={{ color: colors.primary }}>{formatHours(leftToday)}</Body>
          <Muted>left today</Muted>
        </View>
      </Row>

      <View style={styles.bar} accessibilityLabel={`${formatHours(b.available)} free of 24 hours`}>
        {settings.commitments.map((c, i) =>
          c[day] > 0 ? <View key={c.id} style={{ flex: c[day] / scale, backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} /> : null
        )}
        {b.available > 0 ? <View style={{ flex: b.available / scale, backgroundColor: colors.primary }} /> : null}
      </View>

      {b.overBy > 0 && (
        <Body style={{ color: colors.danger }}>
          Commitments are {formatHours(b.overBy)} over 24h — trim something.
        </Body>
      )}

      <Row style={{ justifyContent: 'space-between' }}>
        <Muted>Per week: {formatHours(week.weeklyAvailable)}</Muted>
        <Muted>Daily avg: {formatHours(week.dailyAverage)}</Muted>
      </Row>

      {!editing ? (
        <View style={{ gap: space.xs }}>
          {settings.commitments.map((c, i) => (
            <Row key={c.id} style={{ justifyContent: 'space-between' }}>
              <Row>
                <View style={[styles.dot, { backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }]} />
                <Body>{c.label || 'Untitled'}</Body>
              </Row>
              <Muted>{formatHours(c[day])}</Muted>
            </Row>
          ))}
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <Row>
            <Muted style={{ flex: 1 }}>Activity</Muted>
            <Muted style={styles.col}>Weekday</Muted>
            <Muted style={styles.col}>Weekend</Muted>
            <View style={{ width: 28 }} />
          </Row>
          {settings.commitments.map((c) => (
            <Row key={c.id}>
              <TextInput
                value={c.label}
                onChangeText={(label) => update(c.id, { label })}
                accessibilityLabel="Activity name"
                style={[styles.hours, { flex: 1, textAlign: 'left' }]}
              />
              <HoursInput label={`${c.label} hours per weekday`} value={c.weekday} onChange={(weekday) => update(c.id, { weekday })} />
              <HoursInput label={`${c.label} hours per weekend day`} value={c.weekend} onChange={(weekend) => update(c.id, { weekend })} />
              <Pressable
                onPress={() => save({ ...settings, commitments: settings.commitments.filter((x) => x.id !== c.id) })}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${c.label}`}
                style={{ width: 28, alignItems: 'center' }}>
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </Row>
          ))}
          <Row>
            <View style={{ flex: 1 }}>
              <Input value={newLabel} onChangeText={setNewLabel} placeholder="Add (e.g. Gym, Family time)" />
            </View>
            <Button
              small
              label="Add"
              disabled={!newLabel.trim()}
              onPress={() => {
                save({ ...settings, commitments: [...settings.commitments, { id: randomUUID(), label: newLabel.trim(), weekday: 1, weekend: 1 }] })
                setNewLabel('')
              }}
            />
          </Row>
          <Segmented
            label="Usual bedtime"
            options={BEDTIME_OPTIONS}
            value={String(settings.bedtimeHour)}
            onChange={(v) => save({ ...settings, bedtimeHour: Number(v) })}
          />
          <Button small variant="ghost" label="Reset to defaults" onPress={() => save(DEFAULTS)} />
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  big: { color: colors.text, fontSize: 36, fontWeight: '300', fontVariant: ['tabular-nums'] },
  bar: { flexDirection: 'row', height: 12, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.cardRaised },
  dot: { width: 8, height: 8, borderRadius: 4 },
  col: { width: 64, textAlign: 'center' },
  hours: {
    width: 64,
    color: colors.text,
    backgroundColor: colors.cardRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
})
