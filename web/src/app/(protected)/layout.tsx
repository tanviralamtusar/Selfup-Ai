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
  const { isAuthenticated, isLoading, profile } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(ROUTES.LOGIN)
      } else if (profile && !profile.onboarding_done) {
        router.replace(ROUTES.ONBOARDING)
      }
    }
  }, [isLoading, isAuthenticated, profile, router])

  if (isLoading || !isAuthenticated || (profile && !profile.onboarding_done)) {
    return <LoadingScreen />
  }

  return <AppShell>{children}</AppShell>
}
