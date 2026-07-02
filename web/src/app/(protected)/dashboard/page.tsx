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
  Calendar,
  CheckCircle,
  Trophy,
  Plus,
  Check,
  ArrowRight,
  User,
  Flame,
  Loader2,
  Activity,
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
import { StatAllocationModal } from '@/components/gamification/StatAllocationModal'

const containerAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as any } },
}

function Gauge({ percent, colorClass, label, title }: { percent: number, colorClass: string, label: string, title: string }) {
  const dasharray = 364.4
  const dashoffset = dasharray - (dasharray * percent) / 100

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 128 128"
          preserveAspectRatio="xMidYMid meet"
        >
          <circle
            className="text-muted"
            cx="64" cy="64" r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
          />
          <motion.circle
            className={cn('transition-all duration-1000', colorClass)}
            cx="64" cy="64" r="58"
            fill="transparent"
            stroke="currentColor"
            strokeDasharray={dasharray}
            initial={{ strokeDashoffset: dasharray }}
            animate={{ strokeDashoffset: dashoffset }}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-base font-semibold text-foreground leading-none">{Math.round(percent)}%</span>
          <span className="text-[9px] font-medium text-muted-foreground mt-0.5">{label}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
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
  const [showStatAllocationModal, setShowStatAllocationModal] = useState(false)
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
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(data) })
      if (res.ok) {
        fetchDailies()
        toast.success(`Daily ${editingDaily ? 'updated' : 'created'}!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save daily')
      }
    } catch { toast.error('Network error') }
  }

  const handleDeleteDaily = async (id: string) => {
    try {
      const res = await fetch(`/api/dailies/${id}`, { method: 'DELETE', headers: headers() })
      if (res.ok) {
        fetchDailies()
        toast.success('Daily deleted')
        setIsDailyModalOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete daily')
      }
    } catch { toast.error('Network error') }
  }

  const handleSaveHabit = async (data: any) => {
    try {
      const url = editingHabit ? `/api/habits/${editingHabit.id}` : '/api/habits'
      const method = editingHabit ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(data) })
      if (res.ok) {
        fetchHabits()
        toast.success(`Habit ${editingHabit ? 'updated' : 'created'}!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save habit')
      }
    } catch { toast.error('Network error') }
  }

  const handleDeleteHabit = async (id: string) => {
    try {
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE', headers: headers() })
      if (res.ok) {
        fetchHabits()
        toast.success('Habit deleted')
        setIsHabitModalOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete habit')
      }
    } catch { toast.error('Network error') }
  }

  const handleSaveTask = async (data: any) => {
    try {
      const url = editingTodo ? `/api/todos/${editingTodo.id}` : '/api/todos'
      const method = editingTodo ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(data) })
      if (res.ok) {
        fetchTasks()
        toast.success(`Task ${editingTodo ? 'updated' : 'created'}!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save task')
      }
    } catch { toast.error('Network error') }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE', headers: headers() })
      if (res.ok) {
        fetchTasks()
        toast.success('Task deleted')
        setIsTodoModalOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete task')
      }
    } catch { toast.error('Network error') }
  }

  const handleCompleteDaily = async (daily: any) => {
    if (daily.is_completed || completingDaily) return
    setCompletingDaily(daily.id)
    try {
      const res = await fetch(`/api/dailies/${daily.id}/complete`, { method: 'POST', headers: headers() })
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
    } catch { toast.error('Network error') }
    finally { setCompletingDaily(null) }
  }

  const handleCompleteTask = async (task: any) => {
    if (task.is_completed || completingTask) return
    setCompletingTask(task.id)
    try {
      const res = await fetch(`/api/todos/${task.id}/complete`, { method: 'POST', headers: headers() })
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
    } catch { toast.error('Network error') }
    finally { setCompletingTask(null) }
  }

  const handleLogHabit = async (habitId: string) => {
    setLoggingHabit(habitId)
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, { method: 'POST', headers: headers() })
      const data = await res.json()
      if (res.ok && data.success) {
        const earned = data.data?.xp_awarded || 10
        toast.success(`+${earned} XP — Habit logged!`)
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
      const res = await fetch('/api/user/streak-freeze', { method: 'POST', headers: headers() })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Streak Freeze purchased!')
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

  const handleAllocateStat = async (attribute: AttributeKey): Promise<boolean> => {
    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action: 'allocate_stat', attribute })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`${attribute.toUpperCase()} enhanced!`)
        if (profile) {
          setProfile({
            ...profile,
            stat_points: data.data.remainingPoints,
            [`attr_${attribute}`]: data.data.newValue,
            max_hp: attribute === 'vit' ? data.data.newValue * 15 + 100 : profile.max_hp
          })
        }
        return true
      } else {
        toast.error(data.error || 'Failed to allocate point')
        return false
      }
    } catch {
      toast.error('Network error')
      return false
    }
  }

  const hpColor = hpState === 'healthy' ? 'bg-emerald-500' : hpState === 'weakened' ? 'bg-amber-500' : 'bg-rose-500'
  const hpTextColor = hpState === 'healthy' ? 'text-emerald-400' : hpState === 'weakened' ? 'text-amber-400' : 'text-rose-400'

  return (
    <motion.div variants={containerAnim} initial="hidden" animate="show" className="space-y-5 pb-6">

      {/* ─── Profile Header ─── */}
      <motion.section variants={itemAnim}>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                {profile?.avatar_url
                  ? <img className="w-full h-full object-cover" alt="Avatar" src={profile.avatar_url} />
                  : <User size={28} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md border',
                    rankLetter === 'S' || rankLetter === 'SSS' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                    rankLetter === 'A' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                    'text-primary border-primary/30 bg-primary/10'
                  )}>
                    {rankLetter}
                  </span>
                  <span className="text-xs text-muted-foreground">Level {level}</span>
                </div>
                <h1 className="text-xl font-semibold text-foreground truncate">{displayName}</h1>
                <p className="text-xs text-muted-foreground">{rankInfo.title}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowWalletModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                <img src="/coin.png" alt="Coins" className="w-4 h-4 object-contain" />
                {formatNumber(coins)}
              </button>
              <button onClick={() => setShowStreakHistory(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                <Flame size={14} className="text-orange-400" />
                {profile?.streak_overall ?? 0}
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={hpTextColor}>HP</span>
                  <span>{hp} / {maxHp}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${hpPct}%` }} className={cn('h-full rounded-full', hpColor)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-primary">XP</span>
                  <span>{formatNumber(xp)} / {formatNumber(xpNeeded)}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} className="h-full bg-primary rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.avatar_url
                    ? <img className="w-full h-full object-cover" alt="Avatar" src={profile.avatar_url} />
                    : <User size={36} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md border',
                      rankLetter === 'S' || rankLetter === 'SSS' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                      rankLetter === 'A' ? 'text-purple-400 border-purple-500/30 bg-purple-500/10' :
                      'text-primary border-primary/30 bg-primary/10'
                    )}>
                      {rankLetter}
                    </span>
                    <span className="text-sm text-muted-foreground">Level {level}</span>
                  </div>
                  <h1 className="text-2xl font-semibold text-foreground leading-tight">{displayName}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{rankInfo.title}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => setShowWalletModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                      <img src="/coin.png" alt="Coins" className="w-4 h-4 object-contain" />
                      {formatNumber(coins)}
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-muted-foreground">
                      <Trophy size={13} />
                      #420
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className={cn('font-medium', hpTextColor)}>HP {hpState !== 'healthy' && <span className="ml-1 text-[10px] opacity-70">({hpState})</span>}</span>
                    <span className="text-muted-foreground">{hp} / {maxHp}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${hpPct}%` }} className={cn('h-full rounded-full', hpColor)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-primary">XP</span>
                    <span className="text-muted-foreground">{formatNumber(xp)} / {formatNumber(xpNeeded)}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} className="h-full bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col">
              <p className="text-xs font-medium text-muted-foreground mb-3">Achievements</p>
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

      {/* ─── Main Content + Activity Feed ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          {/* Mobile tab switcher */}
          <div className="flex lg:hidden bg-muted p-1 rounded-lg border border-border mb-4 gap-1">
            {[
              { id: 'habits', label: 'Habits' },
              { id: 'dailies', label: 'Dailies' },
              { id: 'todo', label: 'To-Do' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div variants={itemAnim} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Habits Panel */}
            <div className={cn("flex flex-col bg-card border border-border rounded-xl p-4 space-y-3", activeTab !== 'habits' && 'hidden lg:flex')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Habits</h2>
                </div>
                <button onClick={() => { setEditingHabit(null); setIsHabitModalOpen(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {habits.length === 0 ? (
                  <div className="p-5 rounded-lg border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">No active habits</p>
                    <Link href={ROUTES.TIME} className="text-xs text-primary mt-1 block hover:underline">+ New Habit</Link>
                  </div>
                ) : habits.slice(0, 4).map(habit => (
                  <div
                    key={habit.id}
                    className={cn("flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors", habit.is_completed_this_cycle ? 'opacity-50 bg-muted border-border' : 'bg-muted border-border hover:bg-secondary')}
                    onClick={() => { setEditingHabit(habit); setIsHabitModalOpen(true); }}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); !habit.is_completed_this_cycle && handleLogHabit(habit.id); }}
                      disabled={habit.is_completed_this_cycle || loggingHabit === habit.id}
                      className={cn("w-8 h-8 flex items-center justify-center rounded-lg border transition-colors shrink-0",
                        habit.is_completed_this_cycle ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-muted-foreground')}
                    >
                      {loggingHabit === habit.id ? <Loader2 size={13} className="animate-spin" /> : habit.is_completed_this_cycle ? <Check size={13} /> : <Plus size={13} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{habit.title}</p>
                      <p className="text-xs text-muted-foreground">+{habit.xp_reward || 10} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dailies Panel */}
            <div className={cn("flex flex-col bg-card border border-border rounded-xl p-4 space-y-3", activeTab !== 'dailies' && 'hidden lg:flex')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#5db8a0]" />
                  <h2 className="text-sm font-semibold text-foreground">Dailies</h2>
                </div>
                <button onClick={() => { setEditingDaily(null); setIsDailyModalOpen(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {dailies.length === 0 ? (
                  <div className="p-5 rounded-lg border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">No active dailies</p>
                  </div>
                ) : dailies.slice(0, 4).map(daily => (
                  <div
                    key={daily.id}
                    onClick={() => handleCompleteDaily(daily)}
                    className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-colors group",
                      daily.is_completed ? 'opacity-50 bg-muted border-border cursor-default' : 'bg-muted border-border hover:bg-secondary cursor-pointer')}
                  >
                    <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                      daily.is_completed ? 'bg-[#5db8a0]/20 border-[#5db8a0]/40' : 'border-border group-hover:border-[#5db8a0]/40')}>
                      {completingDaily === daily.id
                        ? <Loader2 className="text-[#5db8a0] animate-spin" size={10} />
                        : <Check className={cn("text-[#5db8a0]", daily.is_completed ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity')} size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 overflow-hidden" onClick={e => { e.stopPropagation(); setEditingDaily(daily); setIsDailyModalOpen(true); }}>
                      <p className={cn("text-sm font-medium truncate", daily.is_completed ? 'text-muted-foreground line-through' : 'text-foreground')}>{daily.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* To-Do Panel */}
            <div className={cn("flex flex-col bg-card border border-border rounded-xl p-4 space-y-3", activeTab !== 'todo' && 'hidden lg:flex')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <h2 className="text-sm font-semibold text-foreground">To-Do</h2>
                </div>
                <button onClick={() => { setEditingTodo(null); setIsTodoModalOpen(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {tasks.filter((t: any) => !t.is_completed).length === 0 ? (
                  <div className="p-5 rounded-lg border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">No pending tasks</p>
                  </div>
                ) : tasks.filter((t: any) => !t.is_completed).slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="bg-muted p-3 rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer group"
                    onClick={() => { setEditingTodo(task); setIsTodoModalOpen(true); }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{task.title}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-card border border-border text-muted-foreground capitalize">{task.priority}</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleCompleteTask(task); }}
                        className="w-5 h-5 rounded border border-border flex items-center justify-center shrink-0 hover:border-rose-400/50 hover:bg-rose-400/10 transition-colors mt-0.5"
                      >
                        <Check size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity Feed */}
        <motion.div variants={itemAnim} className="bg-card border border-border rounded-xl p-4 max-h-[520px] overflow-y-auto">
          <p className="text-sm font-semibold text-foreground mb-3 sticky top-0 bg-card pb-2 border-b border-border -mx-4 px-4">Activity</p>
          <ActivityFeed />
        </motion.div>
      </div>

      {/* ─── Attributes Section ─── */}
      <motion.section variants={itemAnim} className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Attributes</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Your core stats and growth progress</p>
          </div>
          <Link href={ROUTES.ANALYSIS} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Analysis <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {ATTRIBUTES.map((attr) => (
            <Gauge
              key={attr.key}
              percent={Math.min(100, (attrs[attr.key] / 50) * 100)}
              colorClass={attr.key === 'str' ? 'text-rose-400' : attr.key === 'int' ? 'text-[#5db8a0]' : 'text-primary'}
              label={attr.key.toUpperCase()}
              title={attr.name}
            />
          ))}
          {statPoints > 0 && (
            <div className="flex flex-col items-center justify-center gap-2">
              <button
                onClick={() => setShowStatAllocationModal(true)}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
              >
                <span className="text-lg font-medium text-amber-400">+{statPoints}</span>
              </button>
              <p className="text-xs font-medium text-amber-400">Allocate</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Dungeon Section ─── */}
      {activeDungeons.length > 0 && (
        <motion.section variants={itemAnim} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-foreground">Active Challenges</h2>
            {dungeonCountdown && <span className="text-xs text-destructive tabular-nums ml-auto">{dungeonCountdown}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDungeons.map(dungeon => (
              <div key={dungeon.id} className="p-4 rounded-lg border border-border bg-muted">
                <h3 className="text-sm font-medium text-foreground mb-3">{dungeon.title}</h3>
                <div className="space-y-2.5">
                  {dungeon.objectives.map((obj, i) => {
                    const current = dungeon.progress[`obj_${i}`] ?? 0
                    const pct = Math.min(100, (current / obj.target) * 100)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{obj.label}</span>
                          <span>{current}/{obj.target}</span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", pct >= 100 ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
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
      <StatAllocationModal isOpen={showStatAllocationModal} onClose={() => setShowStatAllocationModal(false)} statPoints={statPoints} attributes={attrs} onAllocate={handleAllocateStat} />
    </motion.div>
  )
}
