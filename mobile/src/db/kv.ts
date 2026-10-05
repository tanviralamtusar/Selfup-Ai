import { useCallback, useEffect, useState } from 'react'

import { db, emit, subscribe, withWriteLock } from './database'

export async function getKv<T>(k: string): Promise<T | null> {
  const r = await db.getFirstAsync<{ v: string }>('SELECT v FROM kv WHERE k = ?', [k])
  return r ? (JSON.parse(r.v) as T) : null
}

export async function setKv(k: string, v: unknown) {
  await withWriteLock(() => db.runAsync('INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)', [k, JSON.stringify(v)]))
  emit(`kv:${k}`)
}

/** Live value of a kv key. */
export function useKv<T>(k: string): T | null {
  const [value, setValue] = useState<T | null>(null)
  const load = useCallback(() => {
    getKv<T>(k).then(setValue).catch(() => {})
  }, [k])
  useEffect(() => {
    load()
    const a = subscribe(`kv:${k}`, load)
    const b = subscribe('*', load)
    return () => {
      a()
      b()
    }
  }, [k, load])
  return value
}
