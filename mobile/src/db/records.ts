import { useCallback, useEffect, useState } from 'react'

import { db, emit, subscribe, withWriteLock, writeTransaction, type Executor } from './database'

export type Row = { id: string } & Record<string, any>

export async function getRecord<T extends Row>(tbl: string, id: string, ex: Executor = db): Promise<T | null> {
  const r = await ex.getFirstAsync<{ data: string }>('SELECT data FROM records WHERE tbl = ? AND id = ?', [tbl, id])
  return r ? (JSON.parse(r.data) as T) : null
}

export async function listRecords<T extends Row>(tbl: string, ex: Executor = db): Promise<T[]> {
  const rows = await ex.getAllAsync<{ data: string }>('SELECT data FROM records WHERE tbl = ?', [tbl])
  return rows.map((r) => JSON.parse(r.data) as T)
}

/** Pass `ex` when already inside writeTransaction(); otherwise this takes the write lock itself. */
export async function putRecord(tbl: string, row: Row, ex?: Executor) {
  const write = (e: Executor) => e.runAsync('INSERT OR REPLACE INTO records (tbl, id, data) VALUES (?, ?, ?)', [tbl, row.id, JSON.stringify(row)])
  await (ex ? write(ex) : withWriteLock(() => write(db)))
  emit(tbl)
}

/** Shallow-merge `patch` into an existing row; no-op if the row is gone. */
export async function patchRecord<T extends Row>(tbl: string, id: string, patch: Partial<T>, ex?: Executor): Promise<T | null> {
  const apply = async (e: Executor) => {
    const cur = await getRecord<T>(tbl, id, e)
    if (!cur) return null
    const next = { ...cur, ...patch }
    await putRecord(tbl, next, e)
    return next
  }
  return ex ? apply(ex) : withWriteLock(() => apply(db))
}

export async function removeRecord(tbl: string, id: string, ex?: Executor) {
  const write = (e: Executor) => e.runAsync('DELETE FROM records WHERE tbl = ? AND id = ?', [tbl, id])
  await (ex ? write(ex) : withWriteLock(() => write(db)))
  emit(tbl)
}

/**
 * Make the local copy of `tbl` match `rows` from the server, except for ids
 * in `protectedIds` (rows with queued local changes), which keep their local
 * version until their ops have been replayed.
 */
export async function replaceTable(tbl: string, rows: Row[], protectedIds: Set<string>) {
  await writeTransaction(async (txn) => {
    const keep = new Set(rows.map((r) => r.id))
    const existing = await txn.getAllAsync<{ id: string }>('SELECT id FROM records WHERE tbl = ?', [tbl])
    for (const { id } of existing) {
      if (!keep.has(id) && !protectedIds.has(id)) {
        await txn.runAsync('DELETE FROM records WHERE tbl = ? AND id = ?', [tbl, id])
      }
    }
    for (const row of rows) {
      if (protectedIds.has(row.id)) continue
      await txn.runAsync('INSERT OR REPLACE INTO records (tbl, id, data) VALUES (?, ?, ?)', [tbl, row.id, JSON.stringify(row)])
    }
  })
  emit(tbl)
}

/** Live list of a table, re-read whenever it changes. */
export function useRecords<T extends Row>(tbl: string): T[] {
  const [rows, setRows] = useState<T[]>([])
  const load = useCallback(() => {
    listRecords<T>(tbl).then(setRows).catch(() => {})
  }, [tbl])
  useEffect(() => {
    load()
    const unsubA = subscribe(tbl, load)
    const unsubB = subscribe('*', load)
    return () => {
      unsubA()
      unsubB()
    }
  }, [tbl, load])
  return rows
}
