import { create } from 'zustand'

export interface CheckinDaily {
  id: string
  title: string
  category: string
  priority: string
  xp_reward: number
  xp_penalty: number
  current_streak: number
  is_completed: boolean
}

/** The server's "new day" check-in, pending until the user confirms it. */
export interface Checkin {
  lastCronDate: string
  today: string
  daysMissed: number
  dailies: CheckinDaily[]
}

export interface CheckinResult {
  completedCount: number
  missedCount: number
  xpEarned: number
  xpLost: number
  hpLost: number
  perfectDay: boolean
}

interface SyncState {
  online: boolean
  syncing: boolean
  lastSyncAt: string | null
  lastError: string | null
  /** The server rejected our token and it couldn't be refreshed. */
  needsSignIn: boolean
  /** Completions waiting for the new-day check-in before they can be sent. */
  heldOps: number
  checkin: Checkin | null
  /** "Later" on the check-in hides it until this time (ms epoch); held completions keep waiting. */
  checkinSnoozedUntil: number
  checkinResult: CheckinResult | null
  set: (patch: Partial<Omit<SyncState, 'set'>>) => void
}

export const useSyncStatus = create<SyncState>((set) => ({
  online: true,
  syncing: false,
  lastSyncAt: null,
  lastError: null,
  needsSignIn: false,
  heldOps: 0,
  checkin: null,
  checkinSnoozedUntil: 0,
  checkinResult: null,
  set: (patch) => set(patch),
}))
