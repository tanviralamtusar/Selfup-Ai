'use client'

import { usePathname, useRouter } from 'next/navigation'
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
  Flame
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: ROUTES.DASHBOARD },
  { icon: MessageSquare, label: 'AI Chat', href: ROUTES.CHAT },
  { icon: Dumbbell, label: 'Fitness', href: ROUTES.FITNESS },
  { icon: Brain, label: 'Skills', href: ROUTES.SKILLS },
  { icon: Clock, label: 'Time', href: ROUTES.TIME },
  { icon: Flame, label: 'Habits', href: '/time?tab=habits' },
  { icon: Palette, label: 'Style', href: ROUTES.STYLE },
  { icon: Sword, label: 'Quests', href: ROUTES.QUESTS },
  { icon: Users, label: 'Social', href: ROUTES.LEADERBOARD },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, logout: logoutStore } = useAuthStore()

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

  const username = profile?.username || profile?.display_name || 'Warrior'
  const level = profile?.level || 1
  const xp = profile?.xp || 0
  const maxXP = level * 1000
  const progress = (xp / maxXP) * 100

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 md:px-6 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high shadow-[0_40px_40px_rgba(174,162,255,0.08)]">
        <div className="flex items-center gap-6">
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Sparkles className="text-on-primary" size={16} />
            </div>
            <span className="text-xl font-black font-headline tracking-tighter text-on-surface">SelfUp</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative group">
            <Search className="absolute left-3 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search..."
              className="bg-surface-container-highest/20 border border-outline-variant/10 rounded-lg h-8 pl-9 pr-4 w-56 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/30 focus:bg-surface-container-highest/40 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg bg-surface-container-highest/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full border border-surface" />
          </button>
          
          <button 
            onClick={() => router.push(ROUTES.SETTINGS)}
            className="p-2 rounded-lg bg-surface-container-highest/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all"
          >
            <Settings size={18} />
          </button>

          <div className="h-6 w-px bg-surface-container-high mx-1" />

          <div className="flex items-center gap-3 pl-1">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-on-surface truncate max-w-[100px] uppercase tracking-wider">{username}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-tertiary shadow-[0_0_8px_rgba(107,255,193,0.4)]" />
                <p className="text-[8px] font-black uppercase text-tertiary-fixed-dim/80 tracking-[0.2em]">Level {level}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border-2 border-outline-variant/10 flex items-center justify-center text-primary font-black shadow-inner overflow-hidden text-xs">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover" />
              ) : (
                username?.[0]?.toUpperCase() || 'U'
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Sidebar ─── */}
      <aside className="fixed left-0 top-14 bottom-0 w-56 bg-surface-container-low border-r border-surface-container-high hidden lg:flex flex-col z-40">
        <div className="flex-1 py-6 px-3 space-y-8">
          {/* Section: Main */}
          <div>
            <p className="px-3 text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-3">Core Pillars</p>
            <div className="space-y-1">
              {navItems.slice(0, 4).map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group",
                      isActive 
                        ? "bg-primary text-on-primary shadow-md shadow-primary/20" 
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50"
                    )}
                  >
                    <Icon size={16} className={cn(isActive ? "text-on-primary" : "text-on-surface-variant group-hover:text-on-surface")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Section: Social */}
          <div>
            <p className="px-3 text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-3">Social & Skills</p>
            <div className="space-y-1">
              {navItems.slice(4).map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group",
                      isActive 
                        ? "bg-primary text-on-primary shadow-md shadow-primary/20" 
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50"
                    )}
                  >
                    <Icon size={16} className={cn(isActive ? "text-on-primary" : "text-on-surface-variant group-hover:text-on-surface")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 mt-auto border-t border-surface-container-high bg-surface-container-lowest/30">
          <div className="bg-surface-container-high/40 rounded-xl p-3 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black uppercase text-on-surface-variant/60 tracking-widest">Progress</span>
              <span className="text-[9px] font-black text-primary">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-surface-container-lowest rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-error/60 hover:text-error hover:bg-error/10 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="lg:pl-56 pt-14 min-h-screen border-l border-surface-container-high">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl border-t border-surface-container-high px-6 flex items-center justify-between z-50">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive ? "text-primary" : "text-on-surface-variant"
              )}
            >
              <div className={cn(
                "w-12 h-8 rounded-full flex items-center justify-center transition-all",
                isActive ? "bg-primary/10 shadow-[0_0_20px_rgba(174,162,255,0.1)]" : "bg-transparent"
              )}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest scale-90">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
