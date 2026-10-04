import * as SQLite from 'expo-sqlite'

/**
 * Local store for offline-first operation.
 *
 * records — a document cache of server rows, keyed by (table, id). Rows are
 *           stored as JSON exactly as Supabase returns them, so pulls,
 *           realtime payloads and optimistic local edits share one shape.
 * outbox  — queued mutations, replayed in order against the website's /api.
 *           op_id doubles as the Idempotency-Key header.
 * kv      — small singletons: profile snapshot, cached analysis, sync cursors.
 * sync_failures — ops the server rejected for good, shown to the user.
 */
export const db = SQLite.openDatabaseSync('selfup.db')

const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS records (
    tbl  TEXT NOT NULL,
    id   TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (tbl, id)
  );
  CREATE TABLE IF NOT EXISTS outbox (
    seq         INTEGER PRIMARY KEY AUTOINCREMENT,
    op_id       TEXT NOT NULL UNIQUE,
    kind        TEXT NOT NULL,
    tbl         TEXT,
    entity_id   TEXT,
    method      TEXT NOT NULL,
    path        TEXT NOT NULL,
    body        TEXT,
    action_date TEXT,
    xp_hint     INTEGER NOT NULL DEFAULT 0,
    attempts    INTEGER NOT NULL DEFAULT 0,
    last_error  TEXT,
    created_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kv (
    k TEXT PRIMARY KEY,
    v TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sync_failures (
    op_id      TEXT PRIMARY KEY,
    kind       TEXT NOT NULL,
    label      TEXT NOT NULL,
    error      TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  `,
]

let ready: Promise<void> | null = null

/** Apply pending schema migrations once per launch. */
export function initDatabase(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await db.execAsync('PRAGMA journal_mode = WAL;')
      const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
      const current = row?.user_version ?? 0
      for (let v = current; v < MIGRATIONS.length; v++) {
        await db.withExclusiveTransactionAsync(async (txn) => {
          await txn.execAsync(MIGRATIONS[v])
          await txn.execAsync(`PRAGMA user_version = ${v + 1}`)
        })
      }
    })()
  }
  return ready
}

// ── Change notifications ─────────────────────────────────────
// Screens subscribe to a table name ('dailies', 'outbox', 'kv:profile', ...)
// and re-read when anything writes to it.

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

export function subscribe(channel: string, fn: Listener): () => void {
  let set = listeners.get(channel)
  if (!set) listeners.set(channel, (set = new Set()))
  set.add(fn)
  return () => {
    set!.delete(fn)
  }
}

let pending = new Set<string>()
let scheduled = false

/** Notify subscribers of `channels`, coalesced to one call per channel per tick. */
export function emit(...channels: string[]) {
  for (const c of channels) pending.add(c)
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    const batch = pending
    pending = new Set()
    scheduled = false
    for (const c of batch) listeners.get(c)?.forEach((fn) => fn())
  })
}

/** Wipe everything (sign-out / account switch). */
export async function resetDatabase() {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM records; DELETE FROM outbox; DELETE FROM kv; DELETE FROM sync_failures;')
  })
  emit('*')
  for (const c of listeners.keys()) emit(c)
}
