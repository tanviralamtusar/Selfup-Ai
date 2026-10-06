import { useState } from 'react'
import { Alert, Linking, View } from 'react-native'

import { GoalRow } from '@/components/GoalRow'
import { ProfileHeader } from '@/components/ProfileHeader'
import { formatDate, formatTime, PickerField } from '@/components/PickerField'
import { SwipeTabs } from '@/components/SwipeTabs'
import { TaskRow } from '@/components/TaskRow'
import {
  addGoalProgress,
  completeDaily,
  completeTodo,
  createDaily,
  createDeadlineGoal,
  createHabit,
  createTodo,
  deleteDaily,
  deleteDeadlineGoal,
  deleteHabit,
  deleteTodo,
  logHabit,
} from '@/domain/actions'
import { goalStatus, isDailyDoneToday, isHabitDone, useGoals, useHabits, useOpenTodos, useTodayDailies } from '@/domain/selectors'
import type { Goal, GoalDifficulty } from '@/domain/types'
import { GOAL_REWARDS, type Difficulty, type Priority, type ResetType } from '@/lib/gamification'
import { ensurePermission, parseTime } from '@/lib/notifications'
import { localDay } from '@/lib/dates'
import { requestSync } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePendingIds } from '@/sync/usePendingIds'
import { Button, Card, Empty, H2, Input, Muted, Screen, Segmented, Sheet } from '@/ui/primitives'
import { space } from '@/ui/theme'

type Tab = 'dailies' | 'habits' | 'todos' | 'goals'

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

const GOAL_DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const TABS: readonly Tab[] = ['dailies', 'habits', 'todos', 'goals']

export default function Dashboard() {
  const [page, setPage] = useState(0)
  const [adding, setAdding] = useState(false)
  const dailies = useTodayDailies()
  const habits = useHabits()
  const todos = useOpenTodos()
  const goals = useGoals()
  const [logging, setLogging] = useState<Goal | null>(null)
  const pendingIds = usePendingIds()
  const syncing = useSyncStatus((s) => s.syncing)

  const tab = TABS[page]
  const doneDailies = dailies.filter(isDailyDoneToday).length
  const doneHabits = habits.filter(isHabitDone).length
  const activeGoals = goals.filter((g) => goalStatus(g) === 'active').length
  const today = localDay()
  const addButton = <Button label="+ Add" small onPress={() => setAdding(true)} />

  return (
    <Screen onRefresh={() => requestSync()} refreshing={syncing}>
      <ProfileHeader />

      <SwipeTabs
        tabs={[
          { key: 'dailies', label: `Dailies ${doneDailies}/${dailies.length}` },
          { key: 'habits', label: `Habits ${doneHabits}/${habits.length}` },
          { key: 'todos', label: `To-dos ${todos.length}` },
          { key: 'goals', label: `Goals ${activeGoals}` },
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
                subtitle={[
                  `+${d.xp_reward} XP`,
                  d.current_streak ? `🔥 ${d.current_streak}` : null,
                  parseTime(d.scheduled_time) ? `⏰ ${formatTime(d.scheduled_time!.slice(0, 5))}` : null,
                ].filter(Boolean).join(' · ')}
                priority={d.priority}
                done={isDailyDoneToday(d)}
                pending={pendingIds.has(d.id)}
                onComplete={() => completeDaily(d)}
                onDelete={() => deleteDaily(d.id)}
              />
            ))
          )}
          <Muted>Tap the circle to complete. Long-press to delete. Swipe for habits, to-dos and goals.</Muted>
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
                subtitle={`${h.reset_type} · +${h.xp_reward} XP${h.current_streak ? ` · 🔥 ${h.current_streak}` : ''}${h.end_date ? ` · until ${formatDate(h.end_date)}` : ''}`}
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
                  t.due_date ? (t.due_date < today ? `overdue since ${formatDate(t.due_date)}` : `due ${formatDate(t.due_date)}`) : null,
                  parseTime(t.scheduled_time) ? `⏰ ${formatTime(t.scheduled_time!.slice(0, 5))}` : null,
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

        <Card>
          <H2 right={addButton}>Goals</H2>
          {goals.length === 0 ? (
            <Empty text="No goals yet. Set one with a hard deadline." />
          ) : (
            goals.map((g) => (
              <GoalRow
                key={g.id}
                goal={g}
                pending={pendingIds.has(g.id)}
                onProgress={() => addGoalProgress(g, 1)}
                onLog={() => setLogging(g)}
                onDelete={() => deleteDeadlineGoal(g.id)}
              />
            ))
          )}
          <Muted>Deadlines are strict: miss one and the goal fails and you lose HP.</Muted>
        </Card>
      </SwipeTabs>

      <AddSheet kind={tab} visible={adding} onClose={() => setAdding(false)} />
      <LogGoalSheet goal={logging} onClose={() => setLogging(null)} />
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
  const [due, setDue] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [deadline, setDeadline] = useState<string | null>(null)
  const [target, setTarget] = useState('1')
  const [unit, setUnit] = useState('')
  const [goalDifficulty, setGoalDifficulty] = useState<GoalDifficulty>('medium')

  const targetNum = Number(target.replace(/,/g, ''))
  const valid =
    title.trim().length > 0 &&
    title.length <= (kind === 'goals' ? 120 : 100) &&
    (!weekly || days.length > 0) &&
    (kind !== 'goals' || (deadline !== null && targetNum > 0))

  const close = () => {
    setTitle('')
    setDue(null)
    setTime(null)
    setEndDate(null)
    setDeadline(null)
    setTarget('1')
    setUnit('')
    onClose()
  }

  const save = async () => {
    if (!valid) return
    // A to-do reminder needs a day; picking only a time means today.
    const dueDate = kind === 'todos' && time && !due ? localToday() : due
    if (kind === 'dailies') await createDaily({ title, priority, repeat_type: weekly ? 'weekly' : 'daily', repeat_days: days, scheduled_time: time })
    else if (kind === 'goals' && deadline) await createDeadlineGoal({ title, target_value: targetNum, unit, deadline, difficulty: goalDifficulty })
    else if (kind === 'habits') await createHabit({ title, difficulty, reset_type: reset, end_date: endDate })
    else await createTodo({ title, priority, due_date: dueDate, scheduled_time: time })
    close()

    if (time && (kind === 'dailies' || kind === 'todos') && !(await ensurePermission(true))) {
      Alert.alert('Notifications are off', 'Saved, but SelfUp can’t remind you. Turn on notifications for SelfUp in Android settings.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ])
    }
  }

  return (
    <Sheet visible={visible} title={kind === 'dailies' ? 'New daily' : kind === 'habits' ? 'New habit' : kind === 'goals' ? 'New goal' : 'New to-do'} onClose={close}>
      <Input label="Title" value={title} onChangeText={setTitle} maxLength={kind === 'todos' ? 200 : kind === 'goals' ? 120 : 100} autoFocus />

      {kind === 'goals' && (
        <>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Input label="Target" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="1" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Unit (optional)" value={unit} onChangeText={setUnit} maxLength={30} placeholder="books, km…" />
            </View>
          </View>
          <PickerField label="Deadline" mode="date" value={deadline} onChange={setDeadline} placeholder="Pick the last day" clearable={false} />
          <Segmented label="Difficulty" options={GOAL_DIFFICULTIES} value={goalDifficulty} onChange={setGoalDifficulty} />
          <Muted>
            Reach it by the end of {deadline ? formatDate(deadline) : 'the deadline'} for +{GOAL_REWARDS[goalDifficulty].xp} XP. Miss it (or give up)
            and it fails: −{GOAL_REWARDS[goalDifficulty].hpPenalty} HP.
          </Muted>
        </>
      )}

      {(kind === 'dailies' || kind === 'todos') && <Segmented label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />}

      {kind === 'habits' && (
        <>
          <Segmented label="Difficulty" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
          <Segmented label="Resets" options={RESETS} value={reset} onChange={setReset} />
          <PickerField label="End date" mode="date" value={endDate} onChange={setEndDate} placeholder="No end date (ongoing)" />
          {endDate && <Muted>Runs until {formatDate(endDate)}.</Muted>}
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
          <PickerField label="Reminder" mode="time" value={time} onChange={setTime} placeholder="No reminder" />
          {time && <Muted>You’ll be notified at {formatTime(time)} on each day it’s due, until you tick it off.</Muted>}
        </>
      )}

      {kind === 'todos' && (
        <>
          <PickerField label="Due date" mode="date" value={due} onChange={setDue} placeholder="No due date" />
          <PickerField label="Time" mode="time" value={time} onChange={setTime} placeholder="No time" />
          {time && <Muted>You’ll get a reminder {due ? formatDate(due) : 'today'} at {formatTime(time)}.</Muted>}
          {!time && due && <Muted>Without a time you’ll get a reminder at 9:00 AM on the due date.</Muted>}
        </>
      )}

      <Button label="Save" onPress={save} disabled={!valid} />
      <Muted>Saved on this phone instantly; syncs to the website when you’re online.</Muted>
    </Sheet>
  )
}

/** Today's date on the phone (YYYY-MM-DD, local time). */
function localToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Log a custom amount of progress on a goal (negative to correct a mistake). */
function LogGoalSheet({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const n = Number(amount.replace(/,/g, ''))
  const close = () => {
    setAmount('')
    onClose()
  }
  return (
    <Sheet visible={Boolean(goal)} title={goal ? `Progress on “${goal.title}”` : ''} onClose={close}>
      <Input label={goal?.unit ? `Amount (${goal.unit})` : 'Amount'} value={amount} onChangeText={setAmount} keyboardType="numbers-and-punctuation" autoFocus placeholder="e.g. 3" />
      {goal && <Muted>{Number(goal.current_value)} / {Number(goal.target_value)} so far.</Muted>}
      <Button
        label="Add"
        disabled={!Number.isFinite(n) || n === 0}
        onPress={async () => {
          if (goal) await addGoalProgress(goal, n)
          close()
        }}
      />
    </Sheet>
  )
}
