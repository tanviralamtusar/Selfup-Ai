import * as Notifications from 'expo-notifications'
import { AppState, Platform } from 'react-native'

import { subscribe } from '@/db/database'
import { getKv, setKv } from '@/db/kv'
import { listRecords } from '@/db/records'
import { isDailyDoneToday } from '@/domain/selectors'
import type { Daily, PomodoroSession, Todo } from '@/domain/types'

/**
 * Local reminders. Everything is scheduled on the phone from the synced
 * data, so a reminder set on the website rings here too, and reminders fire
 * offline. The schedule is rebuilt whenever dailies / to-dos / focus sessions
 * change (debounced), and when the app comes to the foreground.
 *
 *   daily with a time  → that time on each of the next 7 days it's scheduled
 *                        (skipping today once it's done)
 *   to-do with a time  → once, at scheduled_start or due_date + scheduled_time
 *   to-do, date only   → 9:00 on the due date
 *
 * A task scheduled over a range (`end_time` set) rings twice, at the start
 * and again at the end, so the end reminder marks the time running out.
 *   focus session      → when the timer ends
 */

const CHANNEL = 'reminders'
const DAYS_AHEAD = 7
const DUE_DATE_HOUR = 9
const SETTINGS_KEY = 'settings:reminders'
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export interface PlannedReminder {
  id: string
  at: Date
  title: string
  body: string
  route: string
}

let configured = false

/** Show reminders while the app is open too, and create the Android channel. */
export async function setupNotifications() {
  if (configured) return
  configured = true
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Reminders',
      description: 'Dailies, to-dos and focus timers',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#9c7ef0',
    })
  }
}

export async function remindersEnabled(): Promise<boolean> {
  return (await getKv<boolean>(SETTINGS_KEY)) !== false
}

export async function setRemindersEnabled(on: boolean) {
  await setKv(SETTINGS_KEY, on)
  if (on) await ensurePermission(true)
  scheduleRebuild(0)
}

/** Whether we may post notifications; asks the user if `ask` and not yet decided. */
export async function ensurePermission(ask: boolean): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync()
  if (cur.granted) return true
  if (!ask || !cur.canAskAgain) return false
  const next = await Notifications.requestPermissionsAsync()
  return next.granted
}

// ── Building the plan ───────────────────────────────────────

/** "HH:MM" or "HH:MM:SS" (Postgres TIME) → [hour, minute], else null. */
export function parseTime(t: string | null | undefined): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? '')
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  return h < 24 && min < 60 ? [h, min] : null
}

function localDate(dateStr: string, h: number, m: number): Date {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d, h, m, 0, 0)
}

/** [9, 5] → "09:05", for the reminder text. */
function fmt(t: [number, number]): string {
  return `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function planReminders(dailies: Daily[], todos: Todo[], sessions: PomodoroSession[], now = new Date()): PlannedReminder[] {
  const out: PlannedReminder[] = []

  for (const d of dailies) {
    const time = parseTime(d.scheduled_time)
    if (!time) continue
    const end = parseTime(d.end_time)
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, time[0], time[1])
      if (day <= now) continue
      if (d.expires_on && ymd(day) > d.expires_on) break
      if (d.repeat_type === 'weekly' && d.repeat_days && !d.repeat_days.includes(WEEKDAYS[day.getDay()])) continue
      if (i === 0 && isDailyDoneToday(d)) continue
      out.push({
        id: `daily:${d.id}:${ymd(day)}`,
        at: day,
        title: `⏰ ${d.title}`,
        body: end ? `Daily · until ${fmt(end)} · +${d.xp_reward} XP` : `Daily · +${d.xp_reward} XP`,
        route: '/',
      })
      if (!end) continue
      const endAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), end[0], end[1])
      if (endAt <= now) continue
      out.push({
        id: `daily:${d.id}:${ymd(day)}:end`,
        at: endAt,
        title: `⏳ ${d.title}`,
        body: `Ends now · Daily · +${d.xp_reward} XP`,
        route: '/',
      })
    }
  }

  for (const t of todos) {
    if (t.is_completed) continue
    const time = parseTime(t.scheduled_time)
    let at: Date | null = null
    if (t.scheduled_start) at = new Date(t.scheduled_start)
    else if (t.due_date && time) at = localDate(t.due_date, time[0], time[1])
    else if (t.due_date) at = localDate(t.due_date, DUE_DATE_HOUR, 0)
    if (!at || Number.isNaN(at.getTime()) || at <= now) continue
    const end = time ? parseTime(t.end_time) : null
    out.push({
      id: `todo:${t.id}`,
      at,
      title: `📝 ${t.title}`,
      body: end
        ? `To-do · until ${fmt(end)} · +${t.xp_reward} XP`
        : time || t.scheduled_start ? `To-do · +${t.xp_reward} XP` : `Due today · +${t.xp_reward} XP`,
      route: '/',
    })
    if (end && t.due_date) {
      const endAt = localDate(t.due_date, end[0], end[1])
      if (endAt > now) {
        out.push({ id: `todo:${t.id}:end`, at: endAt, title: `⏳ ${t.title}`, body: `Ends now · To-do · +${t.xp_reward} XP`, route: '/' })
      }
    }
  }

  for (const s of sessions) {
    if (s.status !== 'active') continue
    const at = new Date(new Date(s.started_at).getTime() + s.duration_minutes * 60000)
    if (at <= now) continue
    out.push({
      id: `focus:${s.id}`,
      at,
      title: '✅ Focus session done',
      body: `${s.duration_minutes} minutes — nice work. Take a ${s.break_minutes}-minute break.`,
      route: '/time',
    })
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime())
}

// ── Applying the plan ────────────────────────────────────────

let lastSignature = ''
let timer: ReturnType<typeof setTimeout> | null = null

/** Rebuild the OS schedule from local data. Cheap when nothing changed. */
export async function rebuildReminders(force = false): Promise<number> {
  const enabled = await remindersEnabled()
  const allowed = enabled && (await ensurePermission(false))
  const plan = allowed
    ? planReminders(
        await listRecords<Daily>('dailies'),
        await listRecords<Todo>('todos'),
        await listRecords<PomodoroSession>('pomodoro_sessions')
      )
    : []

  const signature = plan.map((p) => `${p.id}@${p.at.getTime()}|${p.title}`).join(',')
  if (!force && signature === lastSignature) return plan.length
  lastSignature = signature

  await Notifications.cancelAllScheduledNotificationsAsync()
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: p.title, body: p.body, data: { route: p.route }, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.at, channelId: CHANNEL },
    })
  }
  return plan.length
}

function scheduleRebuild(delay = 1500) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    rebuildReminders().catch(() => {})
  }, delay)
}

/** Keep the OS schedule in step with local data while signed in. Returns a stop function. */
export function startReminderSync(): () => void {
  const unsubs = ['dailies', 'todos', 'pomodoro_sessions', `kv:${SETTINGS_KEY}`, '*'].map((c) => subscribe(c, () => scheduleRebuild()))
  const app = AppState.addEventListener('change', (s) => {
    if (s === 'active') scheduleRebuild(300)
  })
  scheduleRebuild(300)
  return () => {
    unsubs.forEach((u) => u())
    app.remove()
    if (timer) clearTimeout(timer)
  }
}

/** Clear everything (sign-out). */
export async function clearReminders() {
  lastSignature = ''
  await Notifications.cancelAllScheduledNotificationsAsync()
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: { title: '🔔 SelfUp reminders work', body: 'You’ll get alerts like this for dailies and to-dos with a time.', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL },
  })
}

export async function countScheduled(): Promise<number> {
  return (await Notifications.getAllScheduledNotificationsAsync()).length
}
