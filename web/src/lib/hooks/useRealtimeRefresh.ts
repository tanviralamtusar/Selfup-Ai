'use client'

import { useEffect, useId, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

/**
 * Re-run `onChange` whenever one of `tables` changes for the signed-in user —
 * from another tab, the website on another device, or the Android app syncing
 * its offline queue. Events are debounced so a burst (e.g. a sync replaying
 * twenty ops) triggers one refresh per table.
 *
 * Tables must be in the `supabase_realtime` publication
 * (web/scripts/migrations/add_mobile_sync.sql). INSERT/UPDATE are filtered to
 * the user's rows; DELETE events can't be filtered server-side, so a delete
 * triggers a refresh regardless of owner (debounced, and the refetch itself
 * is RLS-scoped).
 */
export function useRealtimeRefresh(
  tables: string[],
  onChange: (table: string) => void,
  debounceMs = 400
) {
  const userId = useAuthStore((s) => s.user?.id ?? s.session?.user?.id)
  const cb = useRef(onChange)
  useEffect(() => { cb.current = onChange })
  const key = tables.join(',')
  // supabase.channel() reuses an existing channel with the same topic, so two
  // hooks on the same tables would collide; give each instance its own topic.
  const instance = useId()

  useEffect(() => {
    if (!userId || !key) return
    const timers = new Map<string, ReturnType<typeof setTimeout>>()
    const fire = (table: string) => {
      clearTimeout(timers.get(table))
      timers.set(table, setTimeout(() => cb.current(table), debounceMs))
    }

    const channel = supabase.channel(`rt:${key}:${userId}:${instance}`)
    for (const table of key.split(',')) {
      const ownerColumn = table === 'user_profiles' ? 'id' : 'user_id'
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: `${ownerColumn}=eq.${userId}` }, () => fire(table))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `${ownerColumn}=eq.${userId}` }, () => fire(table))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, () => fire(table))
    }
    channel.subscribe()

    return () => {
      timers.forEach(clearTimeout)
      supabase.removeChannel(channel)
    }
  }, [userId, key, debounceMs, instance])
}
