import { useCallback, useEffect, useState } from 'react'

import { subscribe } from '@/db/database'
import { pendingEntityIds } from './outbox'

/** Ids of rows with changes not yet on the server, for "waiting to sync" markers. */
export function usePendingIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const load = useCallback(() => {
    pendingEntityIds().then(setIds).catch(() => {})
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
  return ids
}
