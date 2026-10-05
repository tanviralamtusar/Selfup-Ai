import { useState } from 'react'
import { View } from 'react-native'

import { ProfileHeader } from '@/components/ProfileHeader'
import { SwipeTabs } from '@/components/SwipeTabs'
import { TaskRow } from '@/components/TaskRow'
import {
  completeDaily,
  completeTodo,
  createDaily,
  createHabit,
  createTodo,
  deleteDaily,
  deleteHabit,
  deleteTodo,
  logHabit,
} from '@/domain/actions'
import { isDailyDoneToday, isHabitDone, useHabits, useOpenTodos, useTodayDailies } from '@/domain/selectors'
import type { Difficulty, Priority, ResetType } from '@/lib/gamification'
import { serverDay } from '@/lib/dates'
import { requestSync } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePendingIds } from '@/sync/usePendingIds'
import { Button, Card, Empty, H2, Input, Muted, Screen, Segmented, Sheet } from '@/ui/primitives'
import { space } from '@/ui/theme'

type Tab = 'dailies' | 'habits' | 'todos'

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const

const DIFFICULTIES = [
  { value: 'trivial', label: 'Trivial' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const

const RESETS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const TABS: readonly Tab[] = ['dailies', 'habits', 'todos']

export default function Dashboard() {
  const [page, setPage] = useState(0)
  const [adding, setAdding] = useState(false)
  const dailies = useTodayDailies()
  const habits = useHabits()
  const todos = useOpenTodos()
  const pendingIds = usePendingIds()
  const syncing = useSyncStatus((s) => s.syncing)

  const tab = TABS[page]
  const doneDailies = dailies.filter(isDailyDoneToday).length
  const doneHabits = habits.filter(isHabitDone).length
  const today = serverDay()
  const addButton = <Button label="+ Add" small onPress={() => setAdding(true)} />

  return (
    <Screen onRefresh={() => requestSync()} refreshing={syncing}>
      <ProfileHeader />

      <SwipeTabs
        tabs={[
          { key: 'dailies', label: `Dailies ${doneDailies}/${dailies.length}` },
          { key: 'habits', label: `Habits ${doneHabits}/${habits.length}` },
          { key: 'todos', label: `To-dos ${todos.length}` },
        ]}
        index={page}
        onIndexChange={setPage}>
        <Card>
          <H2 right={addButton}>Today’s dailies</H2>
          {dailies.length === 0 ? (
            <Empty text="No dailies today. Add one to build a routine." />
          ) : (
            dailies.map((d) => (
              <TaskRow
                key={d.id}
                title={d.title}
                subtitle={`+${d.xp_reward} XP${d.current_streak ? ` · 🔥 ${d.current_streak}` : ''}`}
                priority={d.priority}
                done={isDailyDoneToday(d)}
                pending={pendingIds.has(d.id)}
                onComplete={() => completeDaily(d)}
                onDelete={() => deleteDaily(d.id)}
              />
            ))
          )}
          <Muted>Tap the circle to complete. Long-press to delete. Swipe for habits and to-dos.</Muted>
        </Card>

        <Card>
          <H2 right={addButton}>Habits</H2>
          {habits.length === 0 ? (
            <Empty text="No habits yet." />
          ) : (
            habits.map((h) => (
              <TaskRow
                key={h.id}
                title={h.title}
                subtitle={`${h.reset_type} · +${h.xp_reward} XP${h.current_streak ? ` · 🔥 ${h.current_streak}` : ''}`}
                done={isHabitDone(h)}
                pending={pendingIds.has(h.id)}
                onComplete={() => logHabit(h)}
                onDelete={() => deleteHabit(h.id)}
              />
            ))
          )}
        </Card>

        <Card>
          <H2 right={addButton}>To-dos</H2>
          {todos.length === 0 ? (
            <Empty text="Nothing on your list." />
          ) : (
            todos.map((t) => (
              <TaskRow
                key={t.id}
                title={t.title}
                subtitle={[
                  `+${t.xp_reward} XP`,
                  t.due_date ? (t.due_date < today ? `overdue since ${t.due_date}` : `due ${t.due_date}`) : null,
                ].filter(Boolean).join(' · ')}
                priority={t.priority}
                done={t.is_completed}
                pending={pendingIds.has(t.id)}
                onComplete={() => completeTodo(t)}
                onDelete={() => deleteTodo(t.id)}
              />
            ))
          )}
        </Card>
      </SwipeTabs>

      <AddSheet kind={tab} visible={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}

function AddSheet({ kind, visible, onClose }: { kind: Tab; visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [reset, setReset] = useState<ResetType>('daily')
  const [weekly, setWeekly] = useState(false)
  const [days, setDays] = useState<string[]>(['mon', 'wed', 'fri'])
  const [due, setDue] = useState('')

  const dueValid = !due || /^\d{4}-\d{2}-\d{2}$/.test(due)
  const valid = title.trim().length > 0 && title.length <= 100 && dueValid && (!weekly || days.length > 0)

  const close = () => {
    setTitle('')
    setDue('')
    onClose()
  }

  const save = async () => {
    if (!valid) return
    if (kind === 'dailies') await createDaily({ title, priority, repeat_type: weekly ? 'weekly' : 'daily', repeat_days: days })
    else if (kind === 'habits') await createHabit({ title, difficulty, reset_type: reset })
    else await createTodo({ title, priority, due_date: due || null })
    close()
  }

  return (
    <Sheet visible={visible} title={kind === 'dailies' ? 'New daily' : kind === 'habits' ? 'New habit' : 'New to-do'} onClose={close}>
      <Input label="Title" value={title} onChangeText={setTitle} maxLength={kind === 'todos' ? 200 : 100} autoFocus />

      {kind !== 'habits' && <Segmented label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />}

      {kind === 'habits' && (
        <>
          <Segmented label="Difficulty" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
          <Segmented label="Resets" options={RESETS} value={reset} onChange={setReset} />
        </>
      )}

      {kind === 'dailies' && (
        <>
          <Segmented
            label="Repeats"
            options={[{ value: 'daily', label: 'Every day' }, { value: 'weekly', label: 'Some days' }] as const}
            value={weekly ? 'weekly' : 'daily'}
            onChange={(v) => setWeekly(v === 'weekly')}
          />
          {weekly && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
              {WEEKDAYS.map((d) => (
                <Button
                  key={d}
                  small
                  label={d}
                  variant={days.includes(d) ? 'primary' : 'ghost'}
                  onPress={() => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
                />
              ))}
            </View>
          )}
        </>
      )}

      {kind === 'todos' && (
        <Input label="Due date (YYYY-MM-DD, optional)" value={due} onChangeText={setDue} placeholder="2026-10-15" autoCapitalize="none" />
      )}
      {!dueValid && <Muted>Use the format YYYY-MM-DD.</Muted>}

      <Button label="Save" onPress={save} disabled={!valid} />
      <Muted>Saved on this phone instantly; syncs to the website when you’re online.</Muted>
    </Sheet>
  )
}
