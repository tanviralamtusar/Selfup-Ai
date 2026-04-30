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
import { SystemKnowledge } from '@/components/dashboard/SystemKnowledge'

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
  name: string
  pillar: string
  streak: number
  completed_today: boolean
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

  // Real HP from profile
  const hp = profile?.hp ?? 100
  const maxHp = profile?.max_hp ?? 100
  const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0
  const hpState = (profile?.hp_state as HpState) ?? 'healthy'

  // Rank from profile
  const rankInfo = useMemo(() => getRank(level), [level])
  const rankLetter = profile?.rank ?? getRankLetter(level)

  // Attributes from profile
  const attrs = useMemo(() => ({
    str: profile?.attr_str ?? 0,
    int: profile?.attr_int ?? 0,
    agi: profile?.attr_agi ?? 0,
    vit: profile?.attr_vit ?? 0,
    cha: profile?.attr_cha ?? 0,
  }), [profile])
  const statPoints = profile?.stat_points ?? 0

  // Live habits
  const [habits, setHabits] = useState<Habit[]>([])
  const [loggingHabit, setLoggingHabit] = useState<string | null>(null)

  // Activity feed
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  // Badges
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [badgesLoading, setBadgesLoading] = useState(true)

  // Level up state
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ newLevel: 2, totalXp: 100, coinsRewarded: 50, statPointsAwarded: 1, rankUp: undefined as { oldRank: string; newRank: string; rankTitle: string } | undefined })

  // Active dungeons
  const [activeDungeons, setActiveDungeons] = useState<ActiveDungeon[]>([])
  const [dungeonCountdown, setDungeonCountdown] = useState<string>('')

  // Wallet state
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showSystemKnowledge, setShowSystemKnowledge] = useState(false)

  // Streak Stats
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
    }
  }, [session])

  // Dungeon countdown timer
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
      if (res.ok) setHabits(await res.json())
    } catch { /* silently fail — habits are non-critical */ }
  }

  const fetchActivities = async () => {
    setActivitiesLoading(true)
    try {
      const res = await fetch('/api/user/activities', { headers: headers() })
      if (res.ok) setActivities(await res.json())
    } catch { /* silently fail */ }
    finally { setActivitiesLoading(false) }
  }

  const fetchBadges = async () => {
    setBadgesLoading(true)
    try {
      // Fetch earned badges with badge info
      const res = await fetch('/api/user/badges', { headers: headers() })
      if (res.ok) setBadges(await res.json())
    } catch { /* silently fail — badges endpoint may not exist yet */ }
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
    } catch { /* silently fail */ }
  }

  const fetchDungeons = async () => {
    try {
      const res = await fetch('/api/gamification?type=dungeons', { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        if (data.data?.dungeons) setActiveDungeons(data.data.dungeons)
      }
    } catch { /* silently fail */ }
  }

  const handleLogHabit = async (habitId: string) => {
    setLoggingHabit(habitId)
    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST', headers: headers()
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`+${data.xpEarned} XP — Habit logged! 🔥`)

        if (data.leveledUp && data.levelUpDetails) {
          setLevelUpData(data.levelUpDetails)
          setShowLevelUp(true)
        }

        // Update streak in local profile state
        if (profile && data.streak) {
          setProfile({
            ...profile,
            streak_overall: data.streak,
            streak_best: Math.max(data.streak, profile.streak_best ?? 0),
            streak_last_date: new Date().toISOString().split('T')[0],
          })
        }

        fetchHabits()
        fetchActivities() // Refresh feed
      } else if (res.status === 409) {
        toast.info('Already logged today!')
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
            {/* Left: Avatar & Basic Stats */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-blue-400/30 p-1 bg-blue-500/5 group-hover:border-blue-400 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center justify-center bg-slate-950 font-black text-blue-400 text-2xl">
                    {profile?.avatar_url ? (
                      <img
                        className="w-full h-full object-cover rounded-xl"
                        alt="Avatar"
                        src={profile.avatar_url}
                      />
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
                    <button
                      onClick={() => setShowWalletModal(true)}
                      className="bg-blue-500/10 px-4 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-2 hover:bg-blue-500/20 transition-all active:scale-95 group/wallet"
                    >
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Health (HP) */}
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${hpPct}%` }}
                      className={cn('h-full', hpState === 'healthy' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : hpState === 'weakened' ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]')}
                    />
                  </div>
                </div>

                {/* Experience (XP) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 system-text-glow">XP</span>
                    <span className="text-[10px] font-black text-blue-100/60 tabular-nums">{formatNumber(xp)} / {formatNumber(xpNeeded)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-sm p-[1px] border border-blue-500/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPercent}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Streak Card Area */}
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

      {/* ─── Achievements Row ─── */}
      <motion.div variants={itemAnim} className="bg-slate-950/40 rounded-xl p-5 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-4 h-px bg-blue-400" />
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-400/80 italic">ACHIEVEMENTS ACQUIRED</p>
        </div>
        <BadgeShowcase />
      </motion.div>

      {/* ─── Main Content: 4-Column Grid + Activity Feed ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Left 3 columns: Habits, Dailies, To-Dos */}
        <div className="xl:col-span-3">
          <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {/* Column: Habits */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  Habit Protocols
                </h2>
                <Link href={ROUTES.TIME} className="text-blue-500/40 hover:text-blue-400 transition-all hover:scale-110 active:scale-90">
                  <PlusCircle size={16} />
                </Link>
              </div>
              <div className="space-y-3">
                {habits.length === 0 ? (
                  <div className="p-6 rounded border border-dashed border-blue-500/10 text-center bg-slate-900/20">
                    <p className="text-[10px] text-blue-500/30 font-black uppercase tracking-[0.2em] italic">No active protocols</p>
                    <Link href={ROUTES.TIME} className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-2 block hover:underline italic">
                      + Initialize Protocol
                    </Link>
                  </div>
                ) : habits.slice(0, 4).map(habit => (
                  <div key={habit.id} className={cn(
                    "group bg-slate-900/40 hover:bg-slate-900/60 p-2.5 rounded-lg transition-all border relative overflow-hidden italic",
                    habit.completed_today ? 'border-blue-500/10 opacity-50' : 'border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                  )}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => !habit.completed_today && handleLogHabit(habit.id)}
                        disabled={habit.completed_today || loggingHabit === habit.id}
                        className={cn(
                          "w-9 h-9 flex items-center justify-center rounded border transition-all active:scale-90",
                          habit.completed_today
                            ? 'bg-blue-500/5 text-blue-500/30 border-blue-500/10'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                        )}
                      >
                        {loggingHabit === habit.id ? <Loader2 size={14} className="animate-spin" /> :
                          habit.completed_today ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                      <div className="flex-1">
                        <p className="text-xs font-black tracking-wide text-blue-50 uppercase italic">{habit.name}</p>
                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] italic">+10 EXP</p>
                      </div>
                      {habit.streak > 0 && (
                        <div className="flex items-center gap-1 pr-1">
                          <Zap size={12} className="text-blue-300" />
                          <span className="text-[10px] font-black text-blue-300 tabular-nums">{habit.streak}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column: Dailies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  Daily Quests
                </h2>
                <button className="text-blue-500/40 hover:text-blue-400 transition-all hover:scale-110 active:scale-90">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-blue-500/20 hover:bg-slate-900/60 transition-all group cursor-pointer italic relative overflow-hidden">
                  <div className="w-5 h-5 rounded border border-blue-500/30 group-hover:border-blue-400 flex items-center justify-center transition-all bg-slate-950">
                    <Check className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={12} strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-blue-50 uppercase tracking-tight">Selfup Maintenance: Read 20 Pgs</p>
                    <div className="w-full h-1 bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-blue-500/10">
                      <div className="bg-blue-500 h-full w-[40%] transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/20 p-3 rounded-lg border border-blue-500/10 opacity-50 cursor-default italic grayscale">
                  <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Check className="text-blue-400" size={12} strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-blue-500/60 uppercase line-through decoration-blue-500/40 tracking-tight">Code Refactoring: Practice</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column: To-Dos + Rewards */}
            <div className="space-y-6">
              {/* Core Cognition Status */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    Cognitive Status
                  </h2>
                </div>
                <button
                  onClick={() => setShowSystemKnowledge(true)}
                  className="w-full group relative overflow-hidden bg-slate-900/40 p-4 rounded-lg border border-blue-500/20 hover:border-blue-400/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.05)] text-left italic"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full -mr-8 -mt-8" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                      <Brain size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-blue-50 uppercase tracking-tight">Selfup Cognition</p>
                      <p className="text-[8px] text-blue-500/60 uppercase tracking-widest mt-0.5 group-hover:text-blue-400 transition-colors">Access Memory Fragments</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* To-Dos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                    Critical Tasks
                  </h2>
                  <button className="text-blue-500/40 hover:text-blue-400 transition-all hover:scale-110 active:scale-90">
                    <PlusCircle size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-900/40 p-3.5 rounded-lg border border-blue-500/20 hover:border-blue-400/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.05)] cursor-pointer group relative overflow-hidden italic">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-xl rounded-full" />
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="space-y-2">
                        <p className="text-[11px] font-black leading-snug text-blue-50 group-hover:text-blue-400 transition-colors uppercase tracking-tight">Finalize Core Specs</p>
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[7px] font-black uppercase tracking-[0.3em] border border-rose-500/20">PRIORITY: HIGH</span>
                      </div>
                      <div className="w-4 h-4 rounded-sm bg-slate-950 border border-blue-500/20 flex items-center justify-center transition-all group-hover:border-blue-400">
                        <div className="w-1.5 h-1.5 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 font-headline uppercase text-blue-100 italic">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    Exchange Hub
                  </h2>
                  <button className="text-blue-500/40 hover:text-blue-400 transition-all">
                    <Filter size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Gamepad2, title: 'Restoration: 1hr', cost: '150 AiC', color: 'text-blue-400' },
                    { icon: Shield, title: 'Selfup Guard', cost: '2.5K AiC', color: 'text-cyan-400' }
                  ].map(reward => (
                    <div key={reward.title} className="group relative overflow-hidden bg-slate-900/40 p-2.5 rounded-lg border border-blue-500/10 hover:bg-slate-900/60 hover:border-blue-500/30 transition-all flex items-center gap-3 italic cursor-pointer">
                      <div className={cn("w-9 h-9 rounded bg-slate-950 flex items-center justify-center border border-blue-500/10 shadow-inner group-hover:scale-110 transition-transform", reward.color)}>
                        <reward.icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black tracking-tight text-blue-50 uppercase">{reward.title}</p>
                        <p className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.2em]">{reward.cost}</p>
                      </div>
                      <button className="px-3 py-1.5 bg-blue-500/10 rounded text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 hover:bg-blue-500 hover:text-white transition-all active:scale-95 border border-blue-500/20 italic">Exchange</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column: Activity Feed */}
        <motion.div variants={itemAnim} className="bg-slate-950/40 rounded-xl p-5 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)] max-h-[600px] overflow-y-auto custom-scrollbar relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
          <div className="flex items-center gap-1.5 mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md pb-2 z-10 -mx-1 px-1">
            <div className="w-4 h-px bg-blue-500" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-500 italic">SELFUP EVENT LOG</p>
          </div>
          <ActivityFeed />
        </motion.div>
      </div>

      {/* ─── Attributes of the Awakened ─── */}
      <motion.section variants={itemAnim} className="bg-slate-950/40 rounded-xl p-8 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-px bg-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 italic">STATUS ATTRIBUTES</p>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-blue-50 font-headline leading-none italic uppercase system-text-glow">Attributes of the Awakened</h2>
          </div>
          <Link href={ROUTES.SKILLS} className="px-6 py-2.5 hover:bg-blue-500 hover:text-white transition-all text-blue-400 bg-blue-500/10 rounded border border-blue-500/20 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
            DETAILED ANALYSIS <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
          {ATTRIBUTES.map((attr) => {
            const value = attrs[attr.key] ?? 0
            const percent = Math.min(100, (value / 50) * 100)
            const colorMap: Record<string, string> = { str: 'text-red-400', int: 'text-cyan-400', agi: 'text-blue-300', vit: 'text-green-400', cha: 'text-purple-400' }
            return (
              <Gauge
                key={attr.key}
                percent={percent}
                colorClass={colorMap[attr.key] || 'text-blue-400'}
                label={attr.key.toUpperCase()}
                title={attr.name.toUpperCase()}
              />
            )
          })}
          {statPoints > 0 && (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center bg-amber-500/5 animate-pulse">
                <div className="text-center">
                  <span className="text-lg font-black text-amber-300">+{statPoints}</span>
                  <span className="text-[7px] font-black text-amber-400/60 block uppercase tracking-widest">Points</span>
                </div>
              </div>
              <p className="text-[8px] font-black text-amber-400 uppercase tracking-[0.3em]">Allocate</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Dungeon Gate Panel */}
      {activeDungeons.length > 0 && (
        <motion.section variants={itemAnim} className="relative overflow-hidden rounded-xl bg-slate-950/60 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-rose-500/5 pointer-events-none" />
          <div className="p-6 relative z-10">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-5 h-px bg-purple-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 italic">DUNGEON GATES</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDungeons.map((dungeon) => {
                const objectives = dungeon.objectives || []
                const allCleared = objectives.every((obj, i) => (dungeon.progress[`obj_${i}`] ?? 0) >= obj.target)
                return (
                  <div key={dungeon.id} className={cn('p-4 rounded-lg border relative overflow-hidden', dungeon.status === 'cleared' ? 'bg-emerald-500/5 border-emerald-500/20' : dungeon.status === 'expired' || dungeon.status === 'failed' ? 'bg-slate-900/40 border-slate-700/30 opacity-50' : 'bg-slate-900/40 border-purple-500/20 hover:border-purple-400/40 transition-all')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', dungeon.tier === 'S' ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' : dungeon.tier === 'A' ? 'text-purple-300 border-purple-500/30 bg-purple-500/10' : dungeon.tier === 'C' ? 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10' : 'text-blue-300 border-blue-500/30 bg-blue-500/10')}>{dungeon.tier}-Rank</span>
                        <h3 className="text-xs font-black text-blue-50 uppercase tracking-tight italic">{dungeon.title}</h3>
                      </div>
                      {dungeon.status === 'active' && dungeonCountdown && (
                        <span className="text-[10px] font-black text-rose-400 tabular-nums animate-pulse">{dungeonCountdown}</span>
                      )}
                      {dungeon.status === 'cleared' && (
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">✅ Cleared</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {objectives.map((obj, i) => {
                        const current = dungeon.progress[`obj_${i}`] ?? 0
                        const pct = Math.min(100, (current / obj.target) * 100)
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-[9px] font-bold text-blue-200/70 italic">{obj.label}</span>
                              <span className="text-[9px] font-black text-blue-300/50 tabular-nums">{current}/{obj.target}</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-blue-500/10">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-purple-500')} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-blue-500/10">
                      <span className="text-[8px] font-black text-blue-400/60 uppercase tracking-wider">+{dungeon.xpReward} XP</span>
                      <span className="text-[8px] font-black text-amber-400/60 uppercase tracking-wider">+{dungeon.coinReward} AiC</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.section>
      )}

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel={levelUpData.newLevel}
        totalXp={levelUpData.totalXp}
        coinsReward={levelUpData.coinsRewarded}
      />

      <SystemKnowledge
        isOpen={showSystemKnowledge}
        onClose={() => setShowSystemKnowledge(false)}
      />

      <AiCoinWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />

      <StreakHistory
        isOpen={showStreakHistory}
        onClose={() => setShowStreakHistory(false)}
        currentStreak={profile?.streak_overall ?? 0}
        bestStreak={profile?.streak_best ?? 0}
        freezeCount={profile?.streak_freeze_count ?? 0}
        lastDate={profile?.streak_last_date}
      />
    </motion.div>
  )
}
