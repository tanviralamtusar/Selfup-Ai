'use client'
import { useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  MessageSquare,
  Dumbbell,
  Brain,
  Clock,
  Palette,
  Sword,
  Users,
  Bell,
  LogOut,
  Sparkles,
  Search,
  Settings,
  User,
  Activity,
  Wallet,
} from 'lucide-react'

import { SystemKnowledge } from '@/components/dashboard/SystemKnowledge'
import { BackgroundTasksWidget } from '@/components/layout/BackgroundTasksWidget'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: ROUTES.DASHBOARD },
  { icon: MessageSquare, label: 'AI Chat', href: ROUTES.CHAT },
  { icon: Dumbbell, label: 'Fitness', href: ROUTES.FITNESS },
  { icon: Brain, label: 'Skills', href: ROUTES.SKILLS },
  { icon: Clock, label: 'Time', href: ROUTES.TIME },
  { icon: Wallet, label: 'Money', href: ROUTES.MONEY },
  { icon: Palette, label: 'Style', href: ROUTES.STYLE },
  { icon: Sword, label: 'Quests', href: ROUTES.QUESTS },
  { icon: Activity, label: 'Analysis', href: ROUTES.ANALYSIS },
  { icon: Users, label: 'Social', href: ROUTES.LEADERBOARD },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile, logout: logoutStore } = useAuthStore()
  const [showSystemKnowledge, setShowSystemKnowledge] = useState(false)

  const getIsActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?')
      if (pathname !== path) return false
      const [paramKey, paramValue] = query.split('=')
      return searchParams.get(paramKey) === paramValue
    }
    return pathname === href
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      logoutStore()
      toast.success('Signed out successfully')
      router.push(ROUTES.LOGIN)
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  const username = profile?.username || profile?.display_name || 'User'
  const level = profile?.level || 1
  const xp = profile?.xp || 0
  const maxXP = level * 1000
  const progress = (xp / maxXP) * 100

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 md:px-6 bg-background border-b border-border">
        <div className="flex items-center gap-6">
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="text-primary" size={14} />
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight">Selfup AI</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search..."
              className="bg-muted border border-border rounded-lg h-8 pl-9 pr-4 w-56 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-card transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSystemKnowledge(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="AI Memory"
          >
            <Brain size={18} />
          </button>

          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
          </button>

          <BackgroundTasksWidget />

          <button
            onClick={() => router.push(ROUTES.SETTINGS)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings size={18} />
          </button>

          <div className="h-5 w-px bg-border mx-2" />

          {/* Profile */}
          <div className="relative group">
            <div className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground truncate max-w-[100px]">{username}</p>
                <p className="text-xs text-muted-foreground">Level {level}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-muted-foreground" />
                )}
              </div>
            </div>

            {/* ─── Profile Hover Card ─── */}
            <div className="absolute top-full right-0 mt-1.5 w-64 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-[100]">
              <div className="bg-popover border border-border rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden text-sm font-semibold text-foreground">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      username[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{username}</h4>
                    <p className="text-xs text-muted-foreground">Level {level}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>XP Progress</span>
                      <span>{xp} / {maxXP}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-2">
                      <img src="/coin.png" alt="AiCoins" className="w-4 h-4 object-contain" />
                      <span className="text-xs text-muted-foreground">AiCoins</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{profile?.ai_coins || 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(ROUTES.SETTINGS)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Settings size={13} />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <LogOut size={13} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Sidebar ─── */}
      <aside className="fixed left-0 top-14 bottom-0 w-56 bg-card border-r border-border hidden lg:flex flex-col z-40">
        <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto">
          {/* Section: Core */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground mb-1">Core</p>
            <div className="space-y-0.5">
              {navItems.slice(0, 4).map((item) => {
                const isActive = getIsActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                      />
                    )}
                    <Icon size={16} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Section: Social & Data */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground mb-1">Explore</p>
            <div className="space-y-0.5">
              {navItems.slice(4).map((item) => {
                const isActive = getIsActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                      />
                    )}
                    <Icon size={16} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border">
          <div className="bg-muted rounded-lg p-3 border border-border mb-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">XP Progress</span>
              <span className="text-xs text-muted-foreground tabular-nums">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="lg:pl-56 pt-14 min-h-screen">
        <div className={cn(
          "w-full",
          pathname === ROUTES.CHAT ? "p-0 h-[calc(100vh-136px)] lg:h-[calc(100vh-56px)]" : "p-4 md:p-8 lg:p-10"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border px-4 flex items-center justify-between z-50">
        {navItems.slice(0, 5).map((item) => {
          const isActive = getIsActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-10 h-7 rounded-lg flex items-center justify-center transition-colors",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <SystemKnowledge
        isOpen={showSystemKnowledge}
        onClose={() => setShowSystemKnowledge(false)}
      />
    </div>
  )
}
