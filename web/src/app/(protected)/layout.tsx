'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import AppShell from '@/components/layout/AppShell'

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-foreground-secondary text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, profile, setProfile, session } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Sync profile with database on mount
    const syncProfile = async () => {
      if (session?.access_token) {
        try {
          const res = await fetch('/api/user', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setProfile(data)
          }
        } catch (err) {
          console.error('Failed to sync profile', err)
        }
      }
    }

    if (isAuthenticated && !isLoading) {
      syncProfile()
    }
  }, [isAuthenticated, isLoading, session, setProfile])

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(ROUTES.LOGIN)
      } else if (profile && !profile.onboarding_done) {
        router.replace(ROUTES.ONBOARDING)
      }
    }
  }, [isLoading, isAuthenticated, profile, router])

  // Loading Guard: Wait for auth to resolve AND profile to sync before rendering
  const isProfileRequired = isAuthenticated && !profile
  
  if (isLoading || isProfileRequired) {
    return <LoadingScreen />
  }

  // Redirects
  if (!isAuthenticated) {
    router.replace(ROUTES.LOGIN)
    return <LoadingScreen />
  }

  if (profile && !profile.onboarding_done) {
    router.replace(ROUTES.ONBOARDING)
    return <LoadingScreen />
  }

  return <AppShell>{children}</AppShell>
}
