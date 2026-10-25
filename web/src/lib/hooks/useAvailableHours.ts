import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_COMMITMENTS,
  computeWeek,
  sanitizeHours,
  type Commitment,
  type DayType,
} from '@/lib/time/available-hours'

// Per-browser planner settings; nothing here needs to reach the server.
const STORAGE_KEY = 'selfup.available-hours.v1'

interface StoredState {
  commitments: Commitment[]
  bedtimeHour: number
}

const DEFAULT_STATE: StoredState = { commitments: DEFAULT_COMMITMENTS, bedtimeHour: 23 }

function load(): StoredState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<StoredState>
    if (!Array.isArray(parsed.commitments)) return DEFAULT_STATE
    return {
      commitments: parsed.commitments.map(c => ({
        id: String(c.id),
        label: String(c.label ?? ''),
        weekday: sanitizeHours(Number(c.weekday)),
        weekend: sanitizeHours(Number(c.weekend)),
      })),
      bedtimeHour: Number.isInteger(parsed.bedtimeHour) ? parsed.bedtimeHour! : DEFAULT_STATE.bedtimeHour,
    }
  } catch {
    return DEFAULT_STATE
  }
}

export const useAvailableHours = () => {
  // The Hours tab only mounts on the client, so storage can be read up front.
  const [state, setState] = useState<StoredState>(load)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage blocked (private mode); the calculator still works for this visit.
    }
  }, [state])

  const updateCommitment = useCallback((id: string, patch: Partial<Omit<Commitment, 'id'>>) => {
    setState(s => ({
      ...s,
      commitments: s.commitments.map(c => {
        if (c.id !== id) return c
        const next = { ...c, ...patch }
        return { ...next, weekday: sanitizeHours(next.weekday), weekend: sanitizeHours(next.weekend) }
      }),
    }))
  }, [])

  const addCommitment = useCallback((label: string) => {
    setState(s => ({
      ...s,
      commitments: [...s.commitments, { id: crypto.randomUUID(), label, weekday: 1, weekend: 1 }],
    }))
  }, [])

  const removeCommitment = useCallback((id: string) => {
    setState(s => ({ ...s, commitments: s.commitments.filter(c => c.id !== id) }))
  }, [])

  const setBedtimeHour = useCallback((bedtimeHour: number) => {
    setState(s => ({ ...s, bedtimeHour }))
  }, [])

  const reset = useCallback(() => setState(DEFAULT_STATE), [])

  const week = useMemo(() => computeWeek(state.commitments), [state.commitments])

  const sleepHours = useCallback(
    (day: DayType) => state.commitments.find(c => c.id === 'sleep')?.[day] ?? 0,
    [state.commitments],
  )

  return {
    commitments: state.commitments,
    bedtimeHour: state.bedtimeHour,
    week,
    sleepHours,
    updateCommitment,
    addCommitment,
    removeCommitment,
    setBedtimeHour,
    reset,
  }
}
