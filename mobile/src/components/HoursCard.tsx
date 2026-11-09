import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

import { setKv, useKv } from '@/db/kv'
import { useRecords } from '@/db/records'
import { isDueToday } from '@/domain/selectors'
import type { Daily } from '@/domain/types'
import {
  DEFAULT_SLEEP,
  clockLabel,
  computeDay,
  dayWindow,
  formatHours,
  markOf,
  remainingToday,
  sanitizeHours,
  timeToHours,
  type SleepMarks,
  type SleepSettings,
} from '@/lib/availableHours'
import { Body, Button, Card, H2, Muted, Row, Segmented } from '@/ui/primitives'
import { colors, radius, space } from '@/ui/theme'

// Phone-only sleep settings, kept in the local kv table (not synced): which
// dailies mark wake-up / bedtime, and the fallback for days without them. The
// rest of the day's committed time comes from the dailies' time ranges.
const KV_KEY = 'available_hours.v2'

const BEDTIMES = [21, 22, 23, 0, 1, 2]
const BEDTIME_OPTIONS = BEDTIMES.map((h) => ({ value: String(h), label: clockLabel(h) }))

const SEGMENT_COLORS = ['#818cf8', '#38bdf8', '#fbbf24', '#fb7185', '#a78bfa', '#2dd4bf', '#fb923c', '#f472b6']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** The next 7 days starting today, at noon so DST shifts can't change the date. */
function nextSevenDays(now: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12))
}

/** Hours field that lets you type "7." or clear it without snapping back mid-edit. */
function HoursInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
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

/** Free hours in a day: waking hours minus the time blocked out by dailies' time ranges. */
export function HoursCard() {
  const sleep: SleepSettings & SleepMarks = useKv<SleepSettings & SleepMarks>(KV_KEY) ?? DEFAULT_SLEEP
  const dailies = useRecords<Daily>('dailies')
  const [dayIndex, setDayIndex] = useState('0')
  const [editing, setEditing] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const save = (next: SleepSettings & SleepMarks) => void setKv(KV_KEY, next)

  // Dailies with a time that can mark wake-up or bedtime.
  const timed = useMemo(
    () => dailies.filter((d) => d.scheduled_time).sort((a, b) => (a.scheduled_time ?? '').localeCompare(b.scheduled_time ?? '')),
    [dailies]
  )
  const toggleMark = (id: string, mark: 'wake' | 'bed') => {
    // The first explicit choice freezes the title guesses into real choices.
    const wakeIds = sleep.wakeIds ?? timed.filter((d) => markOf(d, sleep) === 'wake').map((d) => d.id)
    const bedIds = sleep.bedIds ?? timed.filter((d) => markOf(d, sleep) === 'bed').map((d) => d.id)
    const on = (mark === 'wake' ? wakeIds : bedIds).includes(id)
    save({
      ...sleep,
      wakeIds: mark === 'wake' ? (on ? wakeIds.filter((x) => x !== id) : [...wakeIds, id]) : wakeIds.filter((x) => x !== id),
      bedIds: mark === 'bed' ? (on ? bedIds.filter((x) => x !== id) : [...bedIds, id]) : bedIds.filter((x) => x !== id),
    })
  }

  const todayKey = now.toDateString()
  const days = useMemo(() => {
    return nextSevenDays(now).map((date) => {
      const due = dailies.filter((d) => isDueToday(d, date))
      const win = dayWindow(due, sleep, sleep)
      // Wake / bed markers set the window; they aren't "dailies without a range".
      const untimed = due.filter((d) => !d.end_time && !(markOf(d, sleep) && timeToHours(d.scheduled_time) !== null)).length
      return { date, win, untimed, ...computeDay(due, win) }
    })
    // Recompute when the date changes, not every minute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailies, sleep.sleepHours, sleep.bedtimeHour, sleep.wakeIds, sleep.bedIds, todayKey])

  const dayOptions = days.map((d, i) => ({ value: String(i), label: i === 0 ? 'Today' : DAY_SHORT[d.date.getDay()] }))
  const day = days[Number(dayIndex)] ?? days[0]
  const leftToday = remainingToday(days[0].blocks, days[0].win, now)
  const weekly = days.reduce((s, d) => s + d.available, 0)
  const { wake, bed, wakeFrom, bedFrom } = day.win
  const span = bed - wake
  const dayName = Number(dayIndex) === 0 ? 'today' : day.date.toLocaleDateString(undefined, { weekday: 'long' })

  return (
    <Card>
      <H2 right={<Button small variant="ghost" label={editing ? 'Done' : 'Sleep'} onPress={() => setEditing(!editing)} />}>
        Hours available
      </H2>
      <Segmented options={dayOptions} value={dayIndex} onChange={setDayIndex} />

      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.big}>{formatHours(day.available)}</Text>
          <Muted>
            free {dayName} · {formatHours(day.committed)} in dailies
          </Muted>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Body style={{ color: colors.primary }}>{formatHours(leftToday)}</Body>
          <Muted>left today</Muted>
        </View>
      </Row>

      {/* Waking hours from wake-up to bedtime; coloured blocks are dailies, the rest is free. */}
      <View>
        <View style={styles.bar} accessibilityLabel={`${formatHours(day.available)} free of ${formatHours(day.waking)} awake`}>
          {span > 0 &&
            day.blocks.map((b, i) => (
              <View
                key={b.id}
                style={[
                  styles.block,
                  {
                    left: `${((b.start - wake) / span) * 100}%`,
                    width: `${((b.end - b.start) / span) * 100}%`,
                    backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                  },
                ]}
              />
            ))}
        </View>
        <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
          <Muted>
            {clockLabel(wake)} wake{wakeFrom ? ' ·' : ''}
          </Muted>
          <Muted>
            {bedFrom ? '· ' : ''}bed {clockLabel(bed)}
          </Muted>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Muted style={{ flexShrink: 1 }}>{wakeFrom ? `from “${wakeFrom}”` : 'usual'}</Muted>
          <Muted style={{ flexShrink: 1, textAlign: "right" }}>{bedFrom ? `from “${bedFrom}”` : 'usual'}</Muted>
        </Row>
      </View>

      <Row style={{ justifyContent: 'space-between' }}>
        <Muted>Next 7 days: {formatHours(weekly)}</Muted>
        <Muted>Daily avg: {formatHours(weekly / 7)}</Muted>
      </Row>

      {day.blocks.length > 0 ? (
        <View style={{ gap: space.xs }}>
          {day.blocks.map((b, i) => (
            <Row key={b.id} style={{ justifyContent: 'space-between' }}>
              <Row style={{ flexShrink: 1 }}>
                <View style={[styles.dot, { backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }]} />
                <Body numberOfLines={1} style={{ flexShrink: 1 }}>
                  {b.title || 'Untitled'}
                </Body>
              </Row>
              <Muted>
                {clockLabel(b.start)}–{clockLabel(b.end)} · {formatHours(b.end - b.start)}
              </Muted>
            </Row>
          ))}
        </View>
      ) : (
        <Muted>{`No dailies with a time range ${dayName}. Give a daily a start and end time and it's taken out of your free hours.`}</Muted>
      )}
      {day.untimed > 0 && (
        <Muted>
          {day.untimed} {day.untimed === 1 ? 'daily has' : 'dailies have'} no time range, so {day.untimed === 1 ? "it isn't" : "they aren't"} counted.
        </Muted>
      )}

      {editing && (
        <View style={{ gap: space.sm }}>
          <Body>Wake-up and bedtime dailies</Body>
          <Muted>
            Mark the dailies that set when you wake up and go to bed. Each day uses the ones due that day, so weekly dailies can give
            different times on different days. Their start time is used.
          </Muted>
          {timed.length === 0 ? (
            <Muted>No dailies with a time yet. Add e.g. “Wake up” at 6:00 and “Sleep” at 23:00.</Muted>
          ) : (
            timed.map((d) => {
              const mark = markOf(d, sleep)
              return (
                <Row key={d.id} style={{ justifyContent: 'space-between' }}>
                  <View style={{ flexShrink: 1 }}>
                    <Body numberOfLines={1}>{d.title || 'Untitled'}</Body>
                    <Muted>{clockLabel(timeToHours(d.scheduled_time) ?? 0)}</Muted>
                  </View>
                  <Row>
                    <Button small label="Wake" variant={mark === 'wake' ? 'primary' : 'ghost'} onPress={() => toggleMark(d.id, 'wake')} />
                    <Button small label="Bed" variant={mark === 'bed' ? 'primary' : 'ghost'} onPress={() => toggleMark(d.id, 'bed')} />
                  </Row>
                </Row>
              )
            })
          )}
          <Muted>On days without them:</Muted>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body>Sleep (hours per night)</Body>
            <HoursInput
              label="Sleep hours per night"
              value={sleep.sleepHours}
              onChange={(v) => save({ ...sleep, sleepHours: sanitizeHours(v) })}
            />
          </Row>
          <Segmented
            label="Usual bedtime"
            options={BEDTIME_OPTIONS}
            value={String(sleep.bedtimeHour)}
            onChange={(v) => save({ ...sleep, bedtimeHour: Number(v) })}
          />
          <Button small variant="ghost" label="Reset to defaults" onPress={() => save(DEFAULT_SLEEP)} />
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  big: { color: colors.text, fontSize: 36, fontWeight: '300', fontVariant: ['tabular-nums'] },
  bar: { height: 12, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.primary },
  block: { position: 'absolute', top: 0, bottom: 0 },
  dot: { width: 8, height: 8, borderRadius: 4 },
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
