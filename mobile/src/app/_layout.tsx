import type { Session } from '@supabase/supabase-js'
import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'

import { CheckInModal } from '@/components/CheckInModal'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { initDatabase, resetDatabase } from '@/db/database'
import { getKv, setKv } from '@/db/kv'
import { supabase } from '@/lib/supabase'
import { startSync } from '@/sync/engine'
import { colors } from '@/ui/theme'

SplashScreen.preventAutoHideAsync()

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.card, text: colors.text, border: colors.border, primary: colors.primary },
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    initDatabase().then(() => setDbReady(true))
    // The stored session is read from AsyncStorage, so this works offline too.
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const ready = dbReady && session !== undefined
  const userId = session?.user.id

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  // Sync runs for as long as someone is signed in.
  useEffect(() => {
    if (!ready || !userId) return
    let stop: (() => void) | undefined
    let cancelled = false
    ;(async () => {
      // The local store belongs to one account. Signing in as someone else
      // starts clean (sign-out alone keeps the queue, so the same user loses nothing).
      const owner = await getKv<string>('owner')
      if (owner && owner !== userId) await resetDatabase()
      if (owner !== userId) await setKv('owner', userId)
      if (!cancelled) stop = startSync(userId)
    })()
    return () => {
      cancelled = true
      stop?.()
    }
  }, [ready, userId])

  if (!ready) return null

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={Boolean(userId)}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!userId}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      {userId ? <CheckInModal /> : null}
      <UpdatePrompt />
    </ThemeProvider>
  )
}
