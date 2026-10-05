import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { TaskRow } from '@/components/TaskRow'
import { completeTodo, deleteTodo, finishPomodoro, startPomodoro } from '@/domain/actions'
import { useOpenTodos } from '@/domain/selectors'
import type { PomodoroSession } from '@/domain/types'
import { useRecords } from '@/db/records'
import { dayOf, localDay } from '@/lib/dates'
import { requestSync } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { Body, Button, Card, Empty, H1, H2, Muted, Row, Screen, Segmented } from '@/ui/primitives'
import { colors, space } from '@/ui/theme'

const DURATIONS = [
  { value: '25', label: '25 min' },
  { value: '50', label: '50 min' },
  { value: '15', label: '15 min' },
] as const

export default function Time() {
  const sessions = useRecords<PomodoroSession>('pomodoro_sessions')
  const todos = useOpenTodos()
  const syncing = useSyncStatus((s) => s.syncing)
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]['value']>('25')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const active = useMemo(
    () => sessions.filter((s) => s.status === 'active').sort((a, b) => b.started_at.localeCompare(a.started_at))[0],
    [sessions]
  )
  const endsAt = active ? new Date(active.started_at).getTime() + active.duration_minutes * 60000 : 0
  const remaining = Math.max(0, Math.round((endsAt - nowMs) / 1000))

  // Tick while a session runs; the countdown is derived from started_at, so it
  // survives the app being closed or the phone going offline.
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])

  const finishing = useRef<string | null>(null)
  useEffect(() => {
    if (active && remaining === 0 && finishing.current !== active.id) {
      finishing.current = active.id
      void finishPomodoro(active.id, 'complete', new Date(endsAt).toISOString())
    }
  }, [active, remaining, endsAt])

  const today = localDay()
  const todaySessions = sessions
    .filter((s) => dayOf(s.started_at) === today && s.status !== 'active')
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
  const focusMinutes = todaySessions.filter((s) => s.status === 'completed').reduce((m, s) => m + s.duration_minutes, 0)
  const dueToday = todos.filter((t) => t.due_date && t.due_date <= today)
  const linked = active?.task_id ? todos.find((t) => t.id === active.task_id) : undefined

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <Screen onRefresh={() => requestSync()} refreshing={syncing}>
      <H1>Time</H1>

      <Card>
        <H2>Focus timer</H2>
        {active ? (
          <View style={{ alignItems: 'center', gap: space.sm }}>
            <Text style={styles.clock} accessibilityRole="timer" accessibilityLabel={`${mm} minutes ${ss} seconds left`}>
              {mm}:{ss}
            </Text>
            {linked && <Muted>Working on: {linked.title}</Muted>}
            <Button label="Give up" variant="danger" onPress={() => finishPomodoro(active.id, 'cancel')} />
          </View>
        ) : (
          <>
            <Segmented label="Length" options={DURATIONS} value={duration} onChange={setDuration} />
            {todos.length > 0 && (
              <View style={{ gap: space.xs }}>
                <Muted>Link a to-do (optional)</Muted>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
                  {todos.slice(0, 8).map((t) => (
                    <Button key={t.id} small label={t.title.length > 24 ? `${t.title.slice(0, 22)}…` : t.title} variant={taskId === t.id ? 'primary' : 'ghost'} onPress={() => setTaskId(taskId === t.id ? null : t.id)} />
                  ))}
                </View>
              </View>
            )}
            <Button
              label="Start"
              onPress={async () => {
                await startPomodoro({ duration: Number(duration), breakMinutes: Number(duration) >= 50 ? 10 : 5, taskId })
                setNowMs(Date.now())
              }}
            />
            <Muted>XP: 1 per minute + 5 for finishing. Works offline.</Muted>
          </>
        )}
      </Card>

      <Card>
        <H2>Today</H2>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>{focusMinutes} min focused</Body>
          <Muted>{todaySessions.filter((s) => s.status === 'completed').length} sessions</Muted>
        </Row>
        {todaySessions.length === 0 ? <Empty text="No sessions yet today." /> : todaySessions.map((s) => (
          <Row key={s.id} style={{ justifyContent: 'space-between' }}>
            <Muted>{new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Muted>
            <Body style={{ color: s.status === 'completed' ? colors.success : colors.textMuted }}>
              {s.duration_minutes} min · {s.status}
            </Body>
          </Row>
        ))}
      </Card>

      <Card>
        <H2>Due today</H2>
        {dueToday.length === 0 ? <Empty text="Nothing due today." /> : dueToday.map((t) => (
          <TaskRow
            key={t.id}
            title={t.title}
            subtitle={t.due_date && t.due_date < today ? `overdue since ${t.due_date}` : 'due today'}
            priority={t.priority}
            done={t.is_completed}
            onComplete={() => completeTodo(t)}
            onDelete={() => deleteTodo(t.id)}
          />
        ))}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  clock: { color: colors.text, fontSize: 64, fontWeight: '200', fontVariant: ['tabular-nums'] },
})
