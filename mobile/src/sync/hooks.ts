import { useCallback, useEffect, useState } from 'react'

import { db, subscribe } from '@/db/database'

export interface PendingSummary {
  count: number
  xp: number
}

/** Queued-op count and the XP they're expected to earn, live. */
export function usePendingOps(): PendingSummary {
  const [summary, setSummary] = useState<PendingSummary>({ count: 0, xp: 0 })
  const load = useCallback(() => {
    db.getFirstAsync<{ count: number; xp: number | null }>('SELECT COUNT(*) AS count, SUM(xp_hint) AS xp FROM outbox')
      .then((r) => setSummary({ count: r?.count ?? 0, xp: r?.xp ?? 0 }))
      .catch(() => {})
  }, [])
  useEffect(() => {
    load()
    const a = subscribe('outbox', load)
    const b = subscribe('*', load)
    return () => {
      a()
      b()
    }
  }, [load])
  return summary
}

export interface SyncFailure {
  op_id: string
  kind: string
  label: string
  error: string
  created_at: string
}

export function useSyncFailures(): SyncFailure[] {
  const [rows, setRows] = useState<SyncFailure[]>([])
  const load = useCallback(() => {
    db.getAllAsync<SyncFailure>('SELECT * FROM sync_failures ORDER BY created_at DESC LIMIT 50').then(setRows).catch(() => {})
  }, [])
  useEffect(() => {
    load()
    const a = subscribe('sync_failures', load)
    const b = subscribe('*', load)
    return () => {
      a()
      b()
    }
  }, [load])
  return rows
}
