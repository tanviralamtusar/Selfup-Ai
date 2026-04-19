'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { useUIStore } from '@/store/uiStore'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme)
  const { setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    // Safety timeout to prevent infinite loading if Supabase is unreachable
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeoutId)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme={theme as 'light' | 'dark'}
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
