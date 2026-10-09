import { randomUUID } from 'expo-crypto'

import { db, emit, withWriteLock, writeTransaction, type Executor } from '@/db/database'

export type OpKind =
  | 'daily.create' | 'daily.update' | 'daily.delete' | 'daily.complete'
  | 'habit.create' | 'habit.update' | 'habit.delete' | 'habit.log'
  | 'todo.create' | 'todo.update' | 'todo.delete' | 'todo.complete'
  | 'pomodoro.start' | 'pomodoro.finish'
  | 'account.create' | 'account.update' | 'account.delete'
  | 'category.create'
  | 'txn.create' | 'txn.update' | 'txn.delete'
  | 'budget.set' | 'budget.delete'
  | 'recurring.create' | 'recurring.delete' | 'recurring.post'
  | 'goal.create' | 'goal.update' | 'goal.delete' | 'goal.contribute'
  | 'goals.create' | 'goals.update' | 'goals.progress' | 'goals.delete'

export interface OpInput {
  kind: OpKind
  /** Local table + row the op touches; pulls won't overwrite that row until the op is replayed. */
  tbl?: string
  entityId?: string
  method: 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  /** Day (UTC, server convention) the action belongs to — only for completions/logs that score per day. */
  actionDate?: string
  /** XP the action is expected to earn, shown as "pending XP" until the server confirms. */
  xpHint?: number
}

export interface Op {
  seq: number
  op_id: string
  kind: OpKind
  tbl: string | null
  entity_id: string | null
  method: string
  path: string
  body: string | null
  action_date: string | null
  xp_hint: number
  attempts: number
  last_error: string | null
  created_at: string
}

/**
 * Apply a local change and queue its server op atomically. `apply` writes the
 * optimistic state with the given transaction; the op is appended in the same
 * transaction, so a crash can never leave one without the other.
 */
export async function commitLocal(
  apply: (ex: Executor) => Promise<void>,
  op: OpInput,
  touchedTables: string[] = []
): Promise<string> {
  const opId = randomUUID()
  await writeTransaction(async (txn) => {
    await apply(txn)
    await txn.runAsync(
      `INSERT INTO outbox (op_id, kind, tbl, entity_id, method, path, body, action_date, xp_hint, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opId,
        op.kind,
        op.tbl ?? null,
        op.entityId ?? null,
        op.method,
        op.path,
        op.body === undefined ? null : JSON.stringify(op.body),
        op.actionDate ?? null,
        op.xpHint ?? 0,
        new Date().toISOString(),
      ]
    )
  })
  // Re-notify after commit so readers on the main connection see the new state.
  emit('outbox', ...touchedTables, ...(op.tbl ? [op.tbl] : []))
  onEnqueued?.()
  return opId
}

let onEnqueued: (() => void) | null = null
/** The sync engine registers here to flush as soon as something is queued. */
export function setOnEnqueued(fn: () => void) {
  onEnqueued = fn
}

export async function listOps(): Promise<Op[]> {
  return db.getAllAsync<Op>('SELECT * FROM outbox ORDER BY seq ASC')
}

export async function removeOp(opId: string) {
  await withWriteLock(() => db.runAsync('DELETE FROM outbox WHERE op_id = ?', [opId]))
  emit('outbox')
}

export async function markAttempt(opId: string, error: string) {
  await withWriteLock(() => db.runAsync('UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE op_id = ?', [error, opId]))
  emit('outbox')
}

/** Ids of rows that still have queued changes; pulls and realtime leave these alone. */
export async function pendingEntityIds(): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ entity_id: string }>('SELECT DISTINCT entity_id FROM outbox WHERE entity_id IS NOT NULL')
  return new Set(rows.map((r) => r.entity_id))
}

export async function recordFailure(op: Op, label: string, error: string) {
  await withWriteLock(() =>
    db.runAsync(
      'INSERT OR REPLACE INTO sync_failures (op_id, kind, label, error, created_at) VALUES (?, ?, ?, ?, ?)',
      [op.op_id, op.kind, label, error, new Date().toISOString()]
    )
  )
  emit('sync_failures')
}

export async function clearFailures() {
  await withWriteLock(() => db.runAsync('DELETE FROM sync_failures'))
  emit('sync_failures')
}
