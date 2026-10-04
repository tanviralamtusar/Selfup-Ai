import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/**
 * Supabase is used for three things only: auth, direct RLS-scoped reads when
 * pulling data, and realtime. Every write goes through the website's /api
 * routes so XP, HP and streak rules stay server-side.
 */
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

// Refresh tokens only while the app is in the foreground (Supabase's RN guidance).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})

/** Current access token, refreshing it first if it has expired. Null when signed out or offline-expired. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
