'use client'

import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import Link from 'next/link'
import { cn, formatNumber } from '@/lib/utils'
import { xpToNextLevel, getRank, getRankLetter, getHpState, ATTRIBUTES, type HpState, type AttributeKey } from '@/constants/gamification'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  PlusCircle,
  Bolt,
  Calendar,
  CheckCircle,
  Trophy,
  Plus,
  Minus,
  Check,
  ArrowRight,
  User,
  History,
  Gamepad2,
  Shield,
  Filter,
  Sparkles,
  Flame,
  Loader2,
  Activity,
  Award,
  Brain,
  Zap
} from 'lucide-react'
import { LevelUpModal } from '@/components/gamification/LevelUpModal'
import { StreakCard } from '@/components/gamification/StreakCard'
import { BadgeShowcase } from '@/components/gamification/BadgeShowcase'
import { ActivityFeed } from '@/components/gamification/ActivityFeed'
import { AiCoinWalletModal } from '@/components/gamification/AiCoinWalletModal'
import { StreakHistory } from '@/components/gamification/StreakHistory'
import { DailyModal } from '@/components/dashboard/DailyModal'
import { HabitModal } from '@/components/dashboard/HabitModal'
import { TodoModal } from '@/components/dashboard/TodoModal'

const containerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any } },
}

function Gauge({ percent, colorClass, label, title }: { percent: number, colorClass: string, label: string, title: string }) {
  const dasharray = 364.4;
  const dashoffset = dasharray - (dasharray * percent) / 100;

  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center p-1.5">
        <div className="absolute inset-0 border border-blue-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-2 border border-blue-500/5 rounded-full animate-[spin_15s_linear_reverse_infinite]" />

        <svg
          className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
          viewBox="0 0 128 128"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Track */}
          <circle
            className="text-blue-500/10"
            cx="64" cy="64" r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="4"
          />
          {/* Progress */}
          <motion.circle
            className={cn('transition-all duration-1000', colorClass)}
            cx="64" cy="64" r="58"
            fill="transparent"
            stroke="currentColor"
            strokeDasharray={dasharray}
            initial={{ strokeDashoffset: dasharray }}
            animate={{ strokeDashoffset: dashoffset }}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-lg md:text-xl font-black text-blue-50 system-text-glow leading-none">{Math.round(percent)}%</span>
          <span className="text-[8px] md:text-[9px] uppercase font-black text-blue-400/60 tracking-[0.2em] mt-0.5">{label}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-blue-300/40 group-hover:text-blue-400 uppercase tracking-[0.3em] transition-colors mb-0.5">{title}</p>
        <div className="h-[1px] w-4 bg-blue-500/20 mx-auto group-hover:w-8 transition-all" />
      </div>
    </div>
  )
}

interface Habit {
  id: string
  title: string
  category: string
  current_streak: number
  is_completed_this_cycle: boolean
  xp_reward: number
  is_positive?: boolean
  is_negative?: boolean
  difficulty?: 'trivial' | 'easy' | 'medium' | 'hard'
  reset_type?: 'daily' | 'weekly' | 'monthly'
  description?: string
}

interface ActivityItem {
  id: string
  type: 'habit' | 'workout' | 'skill' | 'task' | 'badge' | 'quest' | 'outfit'
  title: string
  pillar: string | null
  xp_earned: number
  timestamp: string
  metadata?: Record<string, unknown>
}

interface BadgeItem {
  id: string
  name: string
  icon: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret'
  earned_at: string
}

interface ActiveDungeon {
  id: string
  tier: string
  title: string
  description: string
  objectives: { action: string; target: number; label: string }[]
  progress: Record<string, number>
  xpReward: number
  coinReward: number
  status: string
  expiresAt: string
  timeRemainingMs: number
}

export default function DashboardPage() {
  const { profile, session, setProfile } = useAuthStore()

  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpNeeded = profile?.xp_to_next_level ?? xpToNextLevel(level)
  const xpPercent = xpNeeded > 0 ? Math.min((xp / xpNeeded) * 100, 100) : 0
  const coins = profile?.ai_coins ?? 20
  const displayName = profile?.display_name || profile?.username || 'Pathfinder'

  const hp = profile?.hp ?? 100
  const maxHp = profile?.max_hp ?? 100
  const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0
  const hpState = (profile?.hp_state as HpState) ?? 'healthy'

  const rankInfo = useMemo(() => getRank(level), [level])
  const rankLetter = profile?.rank ?? getRankLetter(level)

  const attrs = useMemo(() => ({
    str: profile?.attr_str ?? 0,
    int: profile?.attr_int ?? 0,
    agi: profile?.attr_agi ?? 0,
    vit: profile?.attr_vit ?? 0,
    cha: profile?.attr_cha ?? 0,
  }), [profile])
  const statPoints = profile?.stat_points ?? 0

  const [habits, setHabits] = useState<Habit[]>([])
  const [loggingHabit, setLoggingHabit] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [badgesLoading, setBadgesLoading] = useState(true)
  const [dailies, setDailies] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [completingDaily, setCompletingDaily] = useState<string | null>(null)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'habits' | 'dailies' | 'todo'>('dailies')
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false)
  const [editingDaily, setEditingDaily] = useState<any>(null)
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any>(null)
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<any>(null)

  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ newLevel: 2, totalXp: 100, coinsRewarded: 50, statPointsAwarded: 1, rankUp: undefined as { oldRank: string; newRank: string; rankTitle: string } | undefined })
  const [activeDungeons, setActiveDungeons] = useState<ActiveDungeon[]>([])
  const [dungeonCountdown, setDungeonCountdown] = useState<string>('')
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [weeklyActivity, setWeeklyActivity] = useState<boolean[]>([false, false, false, false, false, false, false])
  const [showStreakHistory, setShowStreakHistory] = useState(false)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  useEffect(() => {
    if (session?.access_token) {
      fetchHabits()
      fetchActivities()
      fetchBadges()
      fetchStreakStats()
      fetchDungeons()
      fetchDailies()
      fetchTasks()
    }
  }, [session])

  useEffect(() => {
    const activeDungeon = activeDungeons.find(d => d.status === 'active')
    if (!activeDungeon) { setDungeonCountdown(''); return }

    const interval = setInterval(() => {
      const remaining = new Date(activeDungeon.expiresAt).getTime() - Date.now()
      if (remaining <= 0) { setDungeonCountdown('EXPIRED'); clearInterval(interval); return }
      const h = Math.floor(remaining / 3600000)
      const m = Math.floor((remaining % 3600000) / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setDungeonCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeDungeons])

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits', { headers: headers() })
      if (res.ok) {
        const json = await res.json()
        setHabits(json.data || [])
      }
    } catch {}
  }

  const fetchActivities = async () => {
    setActivitiesLoading(true)
    try {
      const res = await fetch('/api/user/activities', { headers: headers() })
      if (res.ok) setActivities(await res.json())
    } catch {}
    finally { setActivitiesLoading(false) }
  }

  const fetchBadges = async () => {
    setBadgesLoading(true)
    try {
      const res = await fetch('/api/user/badges', { headers: headers() })
      if (res.ok) setBadges(await res.json())
    } catch {}
    finally { setBadgesLoading(false) }
  }

  const fetchStreakStats = async () => {
    try {
      const res = await fetch('/api/gamification?type=stats', { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        const activity = data.data?.weeklyActivity ?? data.weeklyActivity
        if (activity) setWeeklyActivity(activity)
      }
    } catch {}
  }

  const fetchDungeons = async () => {
    try {
      const res = await fetch('/api/gamification?type=dungeons', { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        if (data.data?.dungeons) setActiveDungeons(data.data.dungeons)
      }
    } catch {}
  }

  const fetchDailies = async () => {
    try {
      const res = await fetch('/api/dailies', { headers: headers() })
      if (res.ok) {
        const json = await res.json()
        setDailies(json.data || [])
      }
    } catch {}
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/todos', { headers: headers() })
      if (res.ok) {
        const json = await res.json()
        setTasks(json.data || [])
      }
    } catch {}
  }

  const handleSaveDaily = async (data: any) => {
    try {
      const url = editingDaily ? `/api/dailies/${editingDaily.id}` : '/api/dailies'
      const method = editingDaily ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(data)
      })
      if (res.ok) {
        fetchDailies()
        toast.success(`Daily ${editingDaily ? 'updated' : 'created'}!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save daily')
      }
    } catch (e: any) {
      toast.error('Network error. Could not connect to the system.')
    }
  }

  const handleDeleteDaily = async (id: string) => {
    try {
      const res = await fetch(`/api/dailies/${id}`, {
        method: 'DELETE',
        headers: headers()
      })
      if (res.ok) {
        fetchDailies()
        toast.success('Daily deleted')
        setIsDailyModalOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete daily')
      }
    } catch (e: any) {
      toast.error('Network error. Could not connect to the system.')
    }
  }

  const handleSaveHabit = async (data: any) => {
    try {
      const url = editingHabit ? `/api/habits/${editingHabit.id}` : '/api/habits'
      const method = editingHabit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(data)
      })
      if (res.ok) {
        fetchHabits()
        toast.success(`Habit ${editingHabit ? 'updated' : 'created'}!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save habit')
      }
    } catch (e: any) {
      toast.error('Network error. Could not connect to the system.')
    }
  }

  const handleDeleteHabit = async (id: string) => {
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: headers()
      })
      if (res.ok) {
        fetchHabits()
        toast.success('Habit deleted')
        setIsHabitModalOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete habit')
      }
    } catch (e: any) {
      toast.error('Network error. Could not connect to the system.')
    }
  }

  const handleSaveTask = async (data: any) => {
    try {
      const url = editingTodo ? `/api/todos/${editingTodo.id}` : '/api/todos'
      const method = editingTodo ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(data)
      })
      if (res.ok) {
        fetchTasks()
        toast.success(`Task ${editingTodo ? 'updated' : 'created'}!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save task')
      }
    } catch (e: any) {
      toast.error('Network error. Could not connect to the system.')
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: headers()
      })
      if (res.ok) {
        fetchTasks()
        toast.success('Task deleted')
        setIsTodoModalOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete task')
      }
    } catch (e: any) {
      toast.error('Network error. Could not connect to the system.')
    }
  }

  const handleCompleteDaily = async (daily: any) => {
    if (daily.is_completed || completingDaily) return
    setCompletingDaily(daily.id)
    try {
      const res = await fetch(`/api/dailies/${daily.id}/complete`, {
        method: 'POST',
        headers: headers()
      })
      if (res.ok) {
        const result = await res.json()
        toast.success(`Daily complete! +${result.data.xp_awarded} XP`)
        setDailies(prev => prev.map(d => d.id === daily.id ? { ...d, is_completed: true } : d))
        const profileRes = await fetch('/api/user/profile', { headers: headers() })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setProfile(profileData.data)
        }
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to complete daily')
      }
    } catch {
      toast.error('Network error during synchronization')
    } finally {
      setCompletingDaily(null)
    }
  }

  const handleCompleteTask = async (task: any) => {
    if (task.is_completed || completingTask) return
    setCompletingTask(task.id)
    try {
      const res = await fetch(`/api/todos/${task.id}/complete`, {
        method: 'POST',
        headers: headers()
      })
      if (res.ok) {
        const result = await res.json()
        toast.success(`Task complete! +${result.data.xp_awarded} XP`)
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: true } : t))
        const profileRes = await fetch('/api/user/profile', { headers: headers() })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setProfile(profileData.data)
        }
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to complete task')
      }
    } catch {
      toast.error('Network error during synchronization')
    } finally {
      setCompletingTask(null)
    }
  }

  const handleLogHabit = async (habitId: string) => {
    setLoggingHabit(habitId)
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST', headers: headers()
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const xp = data.data?.xp_awarded || 10
        toast.success(`+${xp} XP — Habit logged! 🔥`)
        fetchHabits()
        fetchActivities()
      } else if (res.status === 409) {
        toast.info('Already logged this cycle!')
      }
    } catch { toast.error('Failed to log habit') }
    finally { setLoggingHabit(null) }
  }

  const handleBuyFreeze = async () => {
    try {
      const res = await fetch('/api/user/streak-freeze', {
        method: 'POST', headers: headers()
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Streak Freeze purchased! ❄️')
        if (profile) {
          setProfile({
            ...profile,
            ai_coins: data.newBalance ?? profile.ai_coins - 100,
            streak_freeze_count: data.newFreezeCount ?? (profile.streak_freeze_count ?? 0) + 1,
          })
        }
      } else {
        toast.error('Not enough AiCoins')
      }
    } catch { toast.error('Failed to purchase freeze') }
  }

  return (
    <motion.div
      variants={containerAnim}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-6"
    >
      {/* ─── SYSTEM STATUS HEADER ─── */}
      <motion.section variants={itemAnim} className="relative group">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-[2.5rem] pointer-events-none" />

        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950/80 backdrop-blur-xl p-4 md:p-6 border border-blue-500/20 shadow-2xl">
          {/* Decorative Corner Lines */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-blue-400/50" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue-400/50" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue-400/50" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-blue-400/50" />

          {/* === MOBILE LAYOUT === */}
          <div className="grid grid-cols-1 gap-6 relative z-10 lg:hidden">
            <div className="space-y-5">
              <div className="flex flex-row gap-4 md:gap-6 items-center">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-blue-400/30 p-1 bg-slate-950 shadow-[0_0_20px_rgba(59,130,246,0.15)] flex items-center justify-center group-hover:border-blue-400/50 transition-all">
                    {profile?.avatar_url ? (
                      <img className="w-full h-full object-cover rounded-xl" alt="Avatar" src={profile.avatar_url} />
                    ) : (
                      <User size={48} className="text-blue-400/40 system-text-glow" />
                    )}
                  </div>
                  <div className="absolute -bottom-3 -left-2 bg-slate-950 border border-blue-500/30 text-blue-100 font-black px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <span className={cn('w-5 h-5 rounded flex items-center justify-center text-[9px] font-black border', 
                      rankLetter === 'S' || rankLetter === 'SSS' ? 'text-amber-300 border-amber-500/50 bg-amber-500/10' : 
                      rankLetter === 'A' ? 'text-purple-300 border-purple-500/50 bg-purple-500/10' : 
                      'text-blue-300 border-blue-500/30 bg-blue-500/20'
                    )}>
                      {rankLetter}
                    </span>
                    LVL {level}
                  </div>
                </div>

                <div className="flex-1 space-y-4 md:space-y-5 mt-1 md:mt-0">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-emerald-400 system-text-glow">H P</span>
                      <span className="text-[10px] md:text-[11px] font-black text-blue-100/80 tabular-nums tracking-widest">{hp} / {maxHp}</span>
                    </div>
                    <div className="h-2.5 md:h-3 w-full bg-slate-900/80 rounded-md border border-blue-500/20 overflow-hidden shadow-inner">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${hpPct}%` }} className="h-full bg-emerald-400 rounded-md shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-blue-400 system-text-glow">X P</span>
                      <span className="text-[10px] md:text-[11px] font-black text-blue-100/80 tabular-nums tracking-widest">{formatNumber(xp)} / {formatNumber(xpNeeded)}</span>
                    </div>
                    <div className="h-2.5 md:h-3 w-full bg-slate-900/80 rounded-md border border-blue-500/20 overflow-hidden shadow-inner">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} className="h-full bg-blue-500 rounded-md shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row justify-center flex-wrap gap-3 md:gap-4 mt-2">
                <button onClick={() => setShowWalletModal(true)} className="bg-slate-900/90 px-4 md:px-5 py-2 md:py-2.5 rounded-full border border-blue-500/30 flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 group/wallet shadow-lg shrink-0">
                  <img src="/coin.png" alt="AiCoins" className="w-4 h-4 md:w-5 md:h-5 object-contain" />
                  <span className="text-xs md:text-sm font-black text-white tabular-nums tracking-tighter ml-1">{formatNumber(coins)}</span>
                </button>
                <div className="bg-slate-900/90 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-blue-500/20 flex items-center gap-2 shadow-lg shrink-0">
                  <Trophy size={12} className="text-blue-400/60" />
                  <span className="text-[10px] md:text-xs font-black text-blue-100 ml-1">#420</span>
                </div>
                <button onClick={() => setShowStreakHistory(true)} className="bg-slate-900/90 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-orange-500/30 flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shrink-0">
                  <Flame size={12} className="text-orange-400" />
                  <span className="text-[10px] md:text-xs font-black text-orange-100 ml-1">{profile?.streak_overall ?? 0}</span>
                </button>
              </div>
            </div>
          </div>

          {/* === DESKTOP LAYOUT === */}
          <div className="hidden lg:grid grid-cols-12 gap-6 relative z-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-blue-400/30 p-1 bg-slate-950 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center justify-center font-black text-blue-400 text-2xl">
                    {profile?.avatar_url ? (
                      <img className="w-full h-full object-cover rounded-xl" alt="Avatar" src={profile.avatar_url} />
                    ) : (
                      <User size={48} className="text-blue-400/80 system-text-glow" />
                    )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-blue-500/50 text-blue-400 font-black px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.2em] shadow-lg whitespace-nowrap system-text-glow flex items-center gap-2">
                    <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black border', rankLetter === 'S' || rankLetter === 'SSS' ? 'text-amber-300 border-amber-500/50 bg-amber-500/10 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : rankLetter === 'A' ? 'text-purple-300 border-purple-500/50 bg-purple-500/10' : 'text-blue-300 border-blue-500/30 bg-blue-500/10')}>{rankLetter}</span>
                    LVL {level}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1">
                    <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', hpState === 'healthy' ? 'bg-blue-400' : hpState === 'weakened' ? 'bg-amber-400' : 'bg-rose-400')} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/50">Rank {rankLetter} — {rankInfo.title}</p>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-blue-50 font-headline leading-tight uppercase italic system-text-glow">{displayName}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                    <button onClick={() => setShowWalletModal(true)} className="bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-2 hover:bg-blue-500/20 transition-all active:scale-95 group/wallet">
                      <img src="/coin.png" alt="AiCoins" className="w-4 h-4 object-contain group-hover/wallet:scale-110 transition-transform" />
                      <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest group-hover/wallet:text-blue-300">AiCoins</span>
                      <span className="text-xs font-black text-blue-100 tabular-nums">{formatNumber(coins)}</span>
                    </button>
                    <div className="bg-blue-500/5 px-4 py-1.5 rounded-lg border border-blue-500/10 flex items-center gap-2">
                      <Trophy size={10} className="text-blue-400" />
                      <span className="text-[9px] font-black text-blue-400/40 uppercase tracking-widest">Global Rank: #420</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 max-w-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-black uppercase tracking-[0.3em] system-text-glow', hpState === 'healthy' ? 'text-emerald-400' : hpState === 'weakened' ? 'text-amber-400' : 'text-rose-500')}>HP</span>
                      {hpState !== 'healthy' && (
                        <span className={cn('text-[7px] font-black uppercase tracking-[0.3em] px-1.5 py-0.5 rounded border', hpState === 'weakened' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : hpState === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse' : 'text-rose-500 bg-rose-500/20 border-rose-500/30 animate-pulse')}>{hpState.toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-blue-100/60 tabular-nums">{hp} / {maxHp}</span>
                  </div>
                  <div className={cn('h-3 w-full bg-slate-900 rounded-sm p-[1px] border overflow-hidden', hpState === 'critical' || hpState === 'collapse' ? 'border-rose-500/30' : 'border-blue-500/10')}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${hpPct}%` }} className={cn('h-full', hpState === 'healthy' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : hpState === 'weakened' ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 system-text-glow">XP</span>
                    <span className="text-[10px] font-black text-blue-100/60 tabular-nums">{formatNumber(xp)} / {formatNumber(xpNeeded)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-sm p-[1px] border border-blue-500/10 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col relative">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-px bg-blue-400" />
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-400/80 italic whitespace-nowrap">ACHIEVEMENTS</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <BadgeShowcase />
              </div>
            </div>

            <div className="lg:col-span-4">
              <StreakCard
                currentStreak={profile?.streak_overall ?? 0}
                bestStreak={profile?.streak_best ?? 0}
                freezeCount={profile?.streak_freeze_count ?? 0}
                weeklyActivity={weeklyActivity}
                lastDate={profile?.streak_last_date}
                onPurchase={fetchStreakStats}
                onViewHistory={() => setShowStreakHistory(true)}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Main Content: 4-Column Grid + Activity Feed ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3">
          <div className="flex lg:hidden bg-slate-900/60 p-1 rounded-lg border border-blue-500/10 mb-4 gap-1">
            {[
              { id: 'habits', label: 'Habits', activeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              { id: 'dailies', label: 'Dailies', activeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
              { id: 'todo', label: 'To-Do', activeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded transition-all italic border border-transparent",
                  activeTab === tab.id ? tab.activeClass : "text-blue-100/30 hover:text-blue-100/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div variants={itemAnim} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
            {/* Habits Panel */}
            <div className={cn("relative group flex flex-col bg-slate-950/40 backdrop-blur-xl border border-blue-500/10 rounded-2xl overflow-hidden italic shadow-2xl p-4 space-y-4", activeTab !== 'habits' && 'hidden lg:block')}>
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-blue-500/30 z-10" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-blue-500/30 z-10" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-blue-500/30 z-10" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-blue-500/30 z-10" />
              <div className="flex items-center justify-between px-1 relative z-10">
                <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  Habits
                </h2>
                <button onClick={() => { setEditingHabit(null); setIsHabitModalOpen(true); }} className="text-blue-500/40 hover:text-blue-400 transition-all hover:scale-110 active:scale-90">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-3 relative z-10">
                {habits.length === 0 ? (
                  <div className="p-6 rounded border border-dashed border-blue-500/10 text-center bg-slate-900/20">
                    <p className="text-[10px] text-blue-500/30 font-black uppercase tracking-[0.2em] italic">No active habits</p>
                    <Link href={ROUTES.TIME} className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-2 block hover:underline italic">+ New Habit</Link>
                  </div>
                ) : habits.slice(0, 4).map(habit => (
                  <div key={habit.id} className={cn("group bg-slate-900/40 hover:bg-slate-900/60 p-2.5 rounded-lg transition-all border relative overflow-hidden italic cursor-pointer", habit.is_completed_this_cycle ? 'border-blue-500/10 opacity-50' : 'border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]')} onClick={() => { setEditingHabit(habit); setIsHabitModalOpen(true); }}>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); !habit.is_completed_this_cycle && handleLogHabit(habit.id); }} disabled={habit.is_completed_this_cycle || loggingHabit === habit.id} className={cn("w-9 h-9 flex items-center justify-center rounded border transition-all active:scale-90", habit.is_completed_this_cycle ? 'bg-blue-500/5 text-blue-500/30 border-blue-500/10' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]')}>
                        {loggingHabit === habit.id ? <Loader2 size={14} className="animate-spin" /> : habit.is_completed_this_cycle ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                      <div className="flex-1">
                        <p className="text-xs font-black tracking-wide text-blue-50 uppercase italic">{habit.title}</p>
                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] italic">+{habit.xp_reward || 10} EXP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dailies Panel */}
            <div className={cn("relative group flex flex-col bg-slate-950/40 backdrop-blur-xl border border-cyan-500/10 rounded-2xl overflow-hidden italic shadow-2xl p-4 space-y-4", activeTab !== 'dailies' && 'hidden lg:block')}>
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500/30 z-10" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/30 z-10" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-500/30 z-10" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/30 z-10" />
              <div className="flex items-center justify-between px-1 relative z-10">
                <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  Dailies
                </h2>
                <button onClick={() => { setEditingDaily(null); setIsDailyModalOpen(true); }} className="text-cyan-400/40 hover:text-cyan-400 transition-all hover:scale-110 active:scale-90">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-3 relative z-10">
                {dailies.length === 0 ? (
                  <div className="p-6 rounded border border-dashed border-cyan-500/10 text-center bg-slate-900/20">
                    <p className="text-[10px] text-cyan-500/30 font-black uppercase tracking-[0.2em] italic">No active dailies</p>
                  </div>
                ) : dailies.slice(0, 4).map(daily => (
                  <div key={daily.id} onClick={() => handleCompleteDaily(daily)} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all group italic relative overflow-hidden", daily.is_completed ? 'bg-slate-900/20 border-cyan-500/10 opacity-50 grayscale cursor-default' : 'bg-slate-900/40 border-cyan-500/20 hover:bg-slate-900/60 cursor-pointer')}>
                    <div className={cn("w-5 h-5 rounded flex items-center justify-center transition-all relative z-10", daily.is_completed ? 'bg-cyan-500/20 border border-cyan-500/30' : 'border border-cyan-500/30 group-hover:border-cyan-400 bg-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.2)]')}>
                      {completingDaily === daily.id ? <Loader2 className="text-cyan-400 animate-spin" size={10} /> : <Check className={cn("text-cyan-400", daily.is_completed ? '' : 'opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100')} size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 overflow-hidden relative z-10" onClick={(e) => { e.stopPropagation(); setEditingDaily(daily); setIsDailyModalOpen(true); }}>
                      <p className={cn("text-[11px] font-black uppercase tracking-tight truncate hover:text-cyan-400 transition-colors", daily.is_completed ? 'text-cyan-500/60 line-through decoration-cyan-500/40 pointer-events-none' : 'text-blue-50')}>{daily.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* To-Do Panel */}
            <div className={cn("relative group flex flex-col bg-slate-950/40 backdrop-blur-xl border border-rose-500/10 rounded-2xl overflow-hidden italic shadow-2xl p-4 space-y-4", activeTab !== 'todo' && 'hidden lg:block')}>
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-rose-500/30 z-10" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-rose-500/30 z-10" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-rose-500/30 z-10" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-rose-500/30 z-10" />
              <div className="flex items-center justify-between px-1 relative z-10">
                <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  To-Do
                </h2>
                <button onClick={() => { setEditingTodo(null); setIsTodoModalOpen(true); }} className="text-rose-400/40 hover:text-rose-400 transition-all hover:scale-110 active:scale-90">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-3 relative z-10">
                {tasks.filter((t: any) => !t.is_completed).length === 0 ? (
                  <div className="p-6 rounded border border-dashed border-rose-500/10 text-center bg-slate-900/20">
                    <p className="text-[10px] text-rose-500/30 font-black uppercase tracking-[0.2em] italic">No pending tasks</p>
                  </div>
                ) : tasks.filter((t: any) => !t.is_completed).slice(0, 3).map(task => (
                  <div key={task.id} className="bg-slate-900/40 p-3.5 rounded-lg border border-blue-500/20 hover:border-blue-400/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.05)] cursor-pointer group relative overflow-hidden italic" onClick={() => { setEditingTodo(task); setIsTodoModalOpen(true); }}>
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="space-y-2 flex-1">
                        <p className="text-[11px] font-black leading-snug text-blue-50 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{task.title}</p>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-[0.3em] border bg-blue-500/10 text-blue-400 border-blue-500/20">PRIORITY: {task.priority.toUpperCase()}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }} className="w-4 h-4 rounded-sm bg-slate-950 border border-blue-500/20 flex items-center justify-center transition-all hover:border-blue-400 group-hover:border-blue-400/60">
                        <div className="w-1.5 h-1.5 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column: Activity Feed */}
        <motion.div variants={itemAnim} className="bg-slate-950/40 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)] max-h-[600px] overflow-y-auto custom-scrollbar relative overflow-hidden italic">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-blue-500/30 z-10" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-blue-500/30 z-10" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-blue-500/30 z-10" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-blue-500/30 z-10" />
          <div className="flex items-center gap-1.5 mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md pb-2 z-10 -mx-1 px-1">
            <div className="w-4 h-px bg-blue-500" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-500 italic">ACTIVITY LOG</p>
          </div>
          <ActivityFeed />
        </motion.div>
      </div>

      {/* ─── Attributes Section ─── */}
      <motion.section variants={itemAnim} className="bg-slate-950/40 rounded-xl p-8 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-px bg-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 italic">ATTRIBUTES</p>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-blue-50 font-headline leading-none italic uppercase system-text-glow">Attributes of the Awakened</h2>
          </div>
          <Link href={ROUTES.SKILLS} className="px-6 py-2.5 hover:bg-blue-500 hover:text-white transition-all text-blue-400 bg-blue-500/10 rounded border border-blue-500/20 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-3 italic">DETAILED ANALYSIS <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
          {ATTRIBUTES.map((attr) => (
            <Gauge key={attr.key} percent={Math.min(100, (attrs[attr.key] / 50) * 100)} colorClass={attr.key === 'str' ? 'text-red-400' : attr.key === 'int' ? 'text-cyan-400' : 'text-blue-400'} label={attr.key.toUpperCase()} title={attr.name.toUpperCase()} />
          ))}
          {statPoints > 0 && (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center bg-amber-500/5 animate-pulse">
                <span className="text-lg font-black text-amber-300">+{statPoints}</span>
              </div>
              <p className="text-[8px] font-black text-amber-400 uppercase tracking-[0.3em]">Allocate</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Dungeon Section */}
      {activeDungeons.length > 0 && (
        <motion.section variants={itemAnim} className="relative overflow-hidden rounded-xl bg-slate-950/60 backdrop-blur-xl border border-blue-500/20 p-6 shadow-2xl">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-5 h-px bg-purple-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 italic">DUNGEON GATES</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDungeons.map(dungeon => (
              <div key={dungeon.id} className="p-4 rounded-lg border bg-slate-900/40 border-purple-500/20">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-blue-50 uppercase italic">{dungeon.title}</h3>
                  {dungeonCountdown && <span className="text-[10px] font-black text-rose-400 tabular-nums animate-pulse">{dungeonCountdown}</span>}
                </div>
                <div className="space-y-2">
                  {dungeon.objectives.map((obj, i) => {
                    const current = dungeon.progress[`obj_${i}`] ?? 0
                    const pct = Math.min(100, (current / obj.target) * 100)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-blue-200/70">{obj.label}</span>
                          <span className="text-blue-300/50">{current}/{obj.target}</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-blue-500/10">
                          <div className={cn("h-full", pct >= 100 ? 'bg-emerald-500' : 'bg-purple-500')} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Modals */}
      <LevelUpModal isOpen={showLevelUp} onClose={() => setShowLevelUp(false)} newLevel={levelUpData.newLevel} totalXp={levelUpData.totalXp} coinsReward={levelUpData.coinsRewarded} />
      <AiCoinWalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <StreakHistory isOpen={showStreakHistory} onClose={() => setShowStreakHistory(false)} currentStreak={profile?.streak_overall ?? 0} bestStreak={profile?.streak_best ?? 0} freezeCount={profile?.streak_freeze_count ?? 0} lastDate={profile?.streak_last_date} />
      <DailyModal isOpen={isDailyModalOpen} onClose={() => { setIsDailyModalOpen(false); setEditingDaily(null); }} daily={editingDaily} onSave={handleSaveDaily} onDelete={editingDaily ? handleDeleteDaily : undefined} />
      <HabitModal isOpen={isHabitModalOpen} onClose={() => { setIsHabitModalOpen(false); setEditingHabit(null); }} habit={editingHabit} onSave={handleSaveHabit} onDelete={editingHabit ? handleDeleteHabit : undefined} />
      <TodoModal isOpen={isTodoModalOpen} onClose={() => { setIsTodoModalOpen(false); setEditingTodo(null); }} todo={editingTodo} onSave={handleSaveTask} onDelete={editingTodo ? handleDeleteTask : undefined} />
    </motion.div>
  )
}
