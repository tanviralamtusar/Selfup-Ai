'use client'

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
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: ROUTES.DASHBOARD },
  { icon: MessageSquare, label: 'AI Chat', href: ROUTES.CHAT },
  { icon: Dumbbell, label: 'Fitness', href: ROUTES.FITNESS },
  { icon: Brain, label: 'Skills', href: ROUTES.SKILLS },
  { icon: Clock, label: 'Time', href: ROUTES.TIME },
  { icon: Palette, label: 'Style', href: ROUTES.STYLE },
  { icon: Sword, label: 'Quests', href: ROUTES.QUESTS },
  { icon: Users, label: 'Social', href: ROUTES.LEADERBOARD },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile, logout: logoutStore } = useAuthStore()

  const getIsActive = (href: string) => {
    if (href.includes('?')) {
      // Handle query params (like /time?tab=habits)
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

  const username = profile?.username || profile?.display_name || 'Warrior'
  const level = profile?.level || 1
  const xp = profile?.xp || 0
  const maxXP = level * 1000
  const progress = (xp / maxXP) * 100

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 md:px-6 bg-slate-950/80 backdrop-blur-xl border-b border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <div className="flex items-center gap-6">
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3 group relative">
            {/* Holographic Logo Effect */}
            <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center border border-blue-500/50 group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] overflow-hidden">
              <Sparkles className="text-blue-400 animate-pulse" size={16} />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent" />
            </div>
            <span className="text-xl font-black font-headline tracking-[-0.05em] text-blue-50 system-text-glow italic uppercase">Selfup AI</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative group">
            <Search className="absolute left-3 text-blue-500/40 group-focus-within:text-blue-400 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="QUERY SELFUP..."
              className="bg-blue-500/5 border border-blue-500/10 rounded h-8 pl-9 pr-4 w-56 text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none focus:border-blue-500/30 focus:bg-blue-500/10 transition-all text-blue-100 placeholder:text-blue-500/30 italic"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded bg-blue-500/5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all relative border border-blue-500/10">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-slate-950" />
          </button>
          
          <button 
            onClick={() => router.push(ROUTES.SETTINGS)}
            className="p-2 rounded bg-blue-500/5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all border border-blue-500/10"
          >
            <Settings size={18} />
          </button>

          <div className="h-6 w-px bg-blue-500/20 mx-1" />

          <div className="flex items-center gap-3 pl-1">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-blue-50 truncate max-w-[100px] uppercase tracking-wider italic">{username}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                <p className="text-[8px] font-black uppercase text-cyan-400/80 tracking-[0.2em] italic">AWAKENED</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-slate-900 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black shadow-[inset_0_0_10px_rgba(59,130,246,0.2)] overflow-hidden text-xs">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover opacity-80" />
              ) : (
                <User size={14} className="text-blue-400/80 system-text-glow" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Sidebar ─── */}
      <aside className="fixed left-0 top-14 bottom-0 w-56 bg-slate-950/40 backdrop-blur-md border-r border-blue-500/10 hidden lg:flex flex-col z-40">
        <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Section: Main */}
          <div>
            <p className="px-3 text-[9px] font-black text-blue-500/40 uppercase tracking-[0.3em] mb-3 italic">PROTOCOL MODULES</p>
            <div className="space-y-1">
              {navItems.slice(0, 4).map((item) => {
                const isActive = getIsActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all group relative overflow-hidden italic",
                      isActive 
                        ? "bg-blue-500/20 text-blue-100 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                        : "text-blue-500/60 hover:text-blue-300 hover:bg-blue-500/5"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav"
                        className="absolute left-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      />
                    )}
                    <Icon size={16} className={cn(isActive ? "text-blue-400" : "text-blue-500/40 group-hover:text-blue-400")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Section: Social */}
          <div>
            <p className="px-3 text-[9px] font-black text-blue-500/40 uppercase tracking-[0.3em] mb-3 italic">NETWORK & LOGS</p>
            <div className="space-y-1">
              {navItems.slice(4).map((item) => {
                const isActive = getIsActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all group relative overflow-hidden italic",
                      isActive 
                        ? "bg-blue-500/20 text-blue-100 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                        : "text-blue-500/60 hover:text-blue-300 hover:bg-blue-500/5"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav"
                        className="absolute left-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      />
                    )}
                    <Icon size={16} className={cn(isActive ? "text-blue-400" : "text-blue-500/40 group-hover:text-blue-400")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 mt-auto border-t border-blue-500/10 bg-blue-500/5">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-blue-500/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black uppercase text-blue-500/40 tracking-widest italic">SYNCHRONIZATION</span>
              <span className="text-[9px] font-black text-blue-400 tabular-nums">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-slate-950 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all italic"
          >
            <LogOut size={16} />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="lg:pl-56 pt-14 min-h-screen">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950/90 backdrop-blur-xl border-t border-blue-500/20 px-6 flex items-center justify-between z-50">
        {navItems.slice(0, 5).map((item) => {
          const isActive = getIsActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive ? "text-blue-400" : "text-blue-500/40"
              )}
            >
              <div className={cn(
                "w-12 h-8 rounded-full flex items-center justify-center transition-all",
                isActive ? "bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "bg-transparent"
              )}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest scale-90 italic">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
