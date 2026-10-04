import NetInfo from '@react-native-community/netinfo'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { AppState } from 'react-native'

import { emit } from '@/db/database'
import { getKv, setKv } from '@/db/kv'
import { getRecord, putRecord, removeRecord, replaceTable, type Row } from '@/db/records'
import { supabase } from '@/lib/supabase'
import { apiGet, apiRequest } from './api'
import {
  listOps,
  markAttempt,
  pendingEntityIds,
  recordFailure,
  removeOp,
  setOnEnqueued,
  type Op,
} from './outbox'
import { useSyncStatus, type Checkin, type CheckinResult } from './status'

/**
 * Offline-first sync.
 *
 *   write path: UI → commitLocal (SQLite row + outbox op, one transaction)
 *               → flush() replays ops in order through the website's /api,
 *                 each with its op_id as Idempotency-Key, so retries after a
 *                 lost response never double-apply.
 *   read path:  pull() reads the user's rows straight from Supabase (RLS) and
 *               replaces the local cache, skipping rows with queued ops;
 *               realtime applies other devices' changes as they happen.
 *
 * Day boundaries: completions are scored per server day (UTC). The server
 * keeps a day "open" until the new-day check-in runs, so a completion is sent
 * only when its day is the open day; later days wait for the check-in and
 * days that were already closed are reported as failures.
 */

export const SYNCED_TABLES = [
  'dailies', 'habits', 'todos', 'pomodoro_sessions',
  'money_accounts', 'money_categories', 'money_transactions',
  'money_budgets', 'money_recurring', 'money_goals',
] as const

const RETRY_MIN_MS = 2000
const RETRY_MAX_MS = 60000
const PERIODIC_MS = 5 * 60 * 1000

let userId: string | null = null
let running = false
let rerun = false
let retryDelay = RETRY_MIN_MS
let retryTimer: ReturnType<typeof setTimeout> | null = null
let enqueueTimer: ReturnType<typeof setTimeout> | null = null
let channel: RealtimeChannel | null = null

const status = () => useSyncStatus.getState()

// ── Public API ───────────────────────────────────────────────

/** Signed-in user id while syncing (used to stamp rows created offline). */
export function getCurrentUserId(): string {
  return userId ?? ''
}

/** Start syncing for a signed-in user. Returns a stop function. */
export function startSync(uid: string): () => void {
  userId = uid
  const unsubs: (() => void)[] = []

  unsubs.push(
    NetInfo.addEventListener((s) => {
      const online = Boolean(s.isConnected) && s.isInternetReachable !== false
      const wasOnline = status().online
      status().set({ online })
      if (online && !wasOnline) {
        retryDelay = RETRY_MIN_MS
        requestSync()
      }
    })
  )

  const appSub = AppState.addEventListener('change', (s) => {
    if (s === 'active') requestSync()
  })
  unsubs.push(() => appSub.remove())

  setOnEnqueued(() => {
    // Coalesce a burst of taps into one flush.
    if (enqueueTimer) clearTimeout(enqueueTimer)
    enqueueTimer = setTimeout(() => requestSync({ pull: false }), 250)
  })
  unsubs.push(() => setOnEnqueued(() => {}))

  const periodic = setInterval(() => {
    if (AppState.currentState === 'active') requestSync()
  }, PERIODIC_MS)
  unsubs.push(() => clearInterval(periodic))

  subscribeRealtime(uid)
  unsubs.push(() => {
    if (channel) supabase.removeChannel(channel)
    channel = null
  })

  requestSync()

  return () => {
    unsubs.forEach((u) => u())
    if (retryTimer) clearTimeout(retryTimer)
    if (enqueueTimer) clearTimeout(enqueueTimer)
    userId = null
  }
}

/** Flush queued ops, then (by default) pull fresh data. Safe to call any time. */
export function requestSync(opts: { pull?: boolean } = {}) {
  const pull = opts.pull ?? true
  if (running) {
    rerun = true
    return
  }
  void runSync(pull)
}

/** Confirm the new-day check-in. `completedIds` are dailies the user did on the closed day. */
export async function confirmCheckin(completedIds: string[]): Promise<CheckinResult | null> {
  const checkin = status().checkin
  if (!checkin) return null
  const r = await apiRequest(
    'POST',
    '/api/dailies/cron',
    JSON.stringify({ completedIds }),
    `cron:${checkin.lastCronDate}:${checkin.today}`
  )
  if (r.kind !== 'ok') {
    status().set({ lastError: r.kind === 'transient' ? 'Offline — check-in will finish when you reconnect' : r.error })
    return null
  }
  const d = r.json?.data ?? {}
  const result: CheckinResult = {
    completedCount: d.completedCount ?? 0,
    missedCount: d.missedCount ?? 0,
    xpEarned: d.xpEarned ?? 0,
    xpLost: d.xpLost ?? 0,
    hpLost: d.hpLost ?? 0,
    perfectDay: Boolean(d.perfectDay),
  }
  status().set({ checkin: null, checkinResult: d.alreadyRan ? null : result })
  requestSync()
  return result
}

// ── Sync loop ────────────────────────────────────────────────

async function runSync(pull: boolean) {
  if (!userId || !status().online) return
  running = true
  status().set({ syncing: true })
  try {
    const outcome = await flush()
    if (outcome === 'auth') return
    if (pull) await pullAll()
    status().set({ lastSyncAt: new Date().toISOString(), needsSignIn: false })
    if (outcome === 'ok') {
      status().set({ lastError: null })
      retryDelay = RETRY_MIN_MS
    }
  } catch (e: any) {
    status().set({ lastError: e?.message ?? 'Sync failed' })
    scheduleRetry()
  } finally {
    running = false
    status().set({ syncing: false })
    if (rerun) {
      rerun = false
      requestSync()
    }
  }
}

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = setTimeout(() => requestSync(), retryDelay)
  retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS)
}

type FlushOutcome = 'ok' | 'transient' | 'auth'

async function flush(): Promise<FlushOutcome> {
  const ops = await listOps()

  // Which server day is open? Needed only if a day-scored op is queued, or to
  // surface a pending check-in.
  const cron = await apiGet<{ data: { isDue: boolean; lastCronDate: string } }>('/api/dailies/cron')
  const openDay = cron?.data?.lastCronDate ?? null

  let held = 0
  for (const op of ops) {
    if (op.action_date) {
      if (!openDay) {
        held++
        continue
      }
      if (op.action_date > openDay) {
        held++
        continue
      }
      if (op.action_date < openDay) {
        await recordFailure(op, labelFor(op), `That day (${op.action_date}) was already closed when this synced, so it couldn't be scored.`)
        await removeOp(op.op_id)
        continue
      }
    }

    const r = await apiRequest(op.method, op.path, op.body, op.op_id)
    if (r.kind === 'ok') {
      await onSuccess(op, r.json)
      await removeOp(op.op_id)
      continue
    }
    if (r.kind === 'transient') {
      await markAttempt(op.op_id, r.error)
      status().set({ lastError: r.error, heldOps: held })
      scheduleRetry()
      return 'transient'
    }
    if (r.kind === 'auth') {
      const { error } = await supabase.auth.refreshSession()
      if (error) status().set({ needsSignIn: true, lastError: 'Session expired — sign in again to sync' })
      else scheduleRetry()
      return 'auth'
    }
    await onRejected(op, r.status, r.error)
    await removeOp(op.op_id)
  }

  status().set({ heldOps: held })

  if (cron?.data?.isDue) await loadCheckin()
  else status().set({ checkin: null })

  return 'ok'
}

async function loadCheckin() {
  const res = await apiGet<{ data: Checkin & { isDue: boolean } }>('/api/dailies/cron')
  const data = res?.data
  if (!data?.isDue) {
    status().set({ checkin: null })
    return
  }
  if (data.dailies.length === 0) {
    // Nothing was due that day — roll it over silently.
    status().set({ checkin: data })
    await confirmCheckin([])
    return
  }
  if (Date.now() < status().checkinSnoozedUntil) return
  status().set({ checkin: data })
}

// ── Op results ───────────────────────────────────────────────

const strip = (row: Record<string, any>) => {
  const { category: _c, account: _a, spent: _s, balance: _b, ...rest } = row
  return rest as Row
}

async function onSuccess(op: Op, json: any) {
  const data = json?.data
  switch (op.kind) {
    case 'daily.create': case 'daily.update':
    case 'habit.create': case 'habit.update':
    case 'todo.create': case 'todo.update':
    case 'account.create': case 'account.update':
    case 'category.create':
    case 'txn.create': case 'txn.update':
    case 'recurring.create':
    case 'goal.create': case 'goal.update': case 'goal.contribute':
      if (op.tbl && data?.id) await putRecord(op.tbl, strip(data))
      break
    case 'budget.set':
      // Budgets are keyed by (category, month) server-side; adopt the server's id.
      if (data?.id) {
        if (op.entity_id && data.id !== op.entity_id) await removeRecord('money_budgets', op.entity_id)
        await putRecord('money_budgets', strip(data))
      }
      break
    case 'recurring.post': {
      const body = op.body ? JSON.parse(op.body) : {}
      if (body._tempTxnId) await removeRecord('money_transactions', body._tempTxnId)
      if (data?.transaction?.id) await putRecord('money_transactions', strip(data.transaction))
      if (data?.recurring?.id) await putRecord('money_recurring', strip(data.recurring))
      break
    }
    case 'pomodoro.start':
      if (json?.id) await putRecord('pomodoro_sessions', strip(json))
      break
    case 'pomodoro.finish':
      if (json?.session?.id) await putRecord('pomodoro_sessions', strip(json.session))
      break
    default:
      break // deletes, completions: local state is already right; XP arrives via the profile
  }
}

async function onRejected(op: Op, httpStatus: number, error: string) {
  // Already done on the server (e.g. completed on the website meanwhile) — that's the state we wanted.
  if (httpStatus === 409 && (op.kind === 'daily.complete' || op.kind === 'todo.complete' || op.kind === 'habit.log')) return
  // Deleting something that's already gone is a success too.
  if (httpStatus === 404 && op.kind.endsWith('.delete')) return

  if (httpStatus === 404 && op.tbl && op.entity_id) {
    // The row was deleted elsewhere; drop our stale local copy.
    await removeRecord(op.tbl, op.entity_id)
  }
  await recordFailure(op, labelFor(op), error)
}

function labelFor(op: Op): string {
  const body = op.body ? safeJson(op.body) : null
  const name = body?.title ?? body?.name ?? body?.note
  const verb = op.kind.split('.')[1]
  const noun = op.kind.split('.')[0]
  return name ? `${verb} ${noun} “${name}”` : `${verb} ${noun}`
}

function safeJson(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

// ── Pull ─────────────────────────────────────────────────────

async function selectAll(table: string, build?: (q: any) => any): Promise<Row[]> {
  const out: Row[] = []
  const page = 1000
  for (let from = 0; ; from += page) {
    let q = supabase.from(table).select('*')
    if (build) q = build(q)
    const { data, error } = await q.range(from, from + page - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...((data ?? []) as Row[]))
    if (!data || data.length < page) break
  }
  return out
}

async function pullAll() {
  const uid = userId
  if (!uid) return
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [dailies, habits, todos, pomodoro, accounts, categories, txns, budgets, recurring, goals] = await Promise.all([
    selectAll('dailies', (q) => q.eq('user_id', uid)),
    selectAll('habits', (q) => q.eq('user_id', uid).eq('is_active', true)),
    selectAll('todos', (q) => q.eq('user_id', uid).or(`is_completed.eq.false,completed_at.gte.${weekAgo}`)),
    selectAll('pomodoro_sessions', (q) => q.eq('user_id', uid).gte('started_at', weekAgo)),
    selectAll('money_accounts', (q) => q.eq('user_id', uid)),
    selectAll('money_categories', (q) => q.eq('is_active', true)),
    selectAll('money_transactions', (q) => q.eq('user_id', uid).order('occurred_at', { ascending: false })),
    selectAll('money_budgets', (q) => q.eq('user_id', uid)),
    selectAll('money_recurring', (q) => q.eq('user_id', uid)),
    selectAll('money_goals', (q) => q.eq('user_id', uid)),
  ])

  // Re-read after the network round trip: an op queued meanwhile must not be clobbered.
  const protectedIds = await pendingEntityIds()
  await replaceTable('dailies', dailies, protectedIds)
  await replaceTable('habits', habits, protectedIds)
  await replaceTable('todos', todos, protectedIds)
  await replaceTable('pomodoro_sessions', pomodoro, protectedIds)
  await replaceTable('money_accounts', accounts, protectedIds)
  await replaceTable('money_categories', categories, protectedIds)
  await replaceTable('money_transactions', txns, protectedIds)
  await replaceTable('money_budgets', budgets, protectedIds)
  await replaceTable('money_recurring', recurring, protectedIds)
  await replaceTable('money_goals', goals, protectedIds)

  // Profile via the API: it also rolls the overall streak, like the website does on load.
  const profile = await apiGet('/api/user')
  if (profile?.id) await setKv('profile', profile)

  await pullAnalysis()
}

/** Cached for offline viewing on the Analysis tab. */
async function pullAnalysis() {
  const [activities, stats] = await Promise.all([
    apiGet<any[]>('/api/user/activities'),
    apiGet<{ data: { weeklyActivity: unknown } }>('/api/gamification?type=stats'),
  ])
  const prev = (await getKv<Record<string, unknown>>('analysis')) ?? {}
  await setKv('analysis', {
    ...prev,
    ...(Array.isArray(activities) ? { activities } : {}),
    ...(stats?.data ? { weeklyActivity: stats.data.weeklyActivity } : {}),
    updatedAt: new Date().toISOString(),
  })
}

// ── Realtime ─────────────────────────────────────────────────

function subscribeRealtime(uid: string) {
  if (channel) supabase.removeChannel(channel)
  const ch = supabase.channel(`mobile:${uid}:${Date.now()}`)

  for (const table of SYNCED_TABLES) {
    const filter = table === 'money_categories' ? undefined : `user_id=eq.${uid}`
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, (p) => applyRemote(table, p.new as Row))
    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter }, (p) => applyRemote(table, p.new as Row))
    ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (p) => applyRemoteDelete(table, (p.old as Row)?.id))
  }
  ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${uid}` }, async (p) => {
    const cur = (await getKv<Record<string, unknown>>('profile')) ?? {}
    await setKv('profile', { ...cur, ...(p.new as Record<string, unknown>) })
  })

  ch.subscribe((state) => {
    // After a (re)connect we may have missed events while away — catch up.
    if (state === 'SUBSCRIBED') requestSync()
  })
  channel = ch
}

async function applyRemote(table: string, row: Row) {
  if (!row?.id) return
  const pending = await pendingEntityIds()
  if (pending.has(row.id)) return // our queued change wins until it's replayed
  if (table === 'habits' && row.is_active === false) {
    await removeRecord(table, row.id)
    return
  }
  await putRecord(table, row)
}

async function applyRemoteDelete(table: string, id: string | undefined) {
  if (!id) return
  // DELETE events aren't owner-filtered; removing an id we don't have is a no-op.
  if (await getRecord(table, id)) {
    await removeRecord(table, id)
    emit(table)
  }
}
