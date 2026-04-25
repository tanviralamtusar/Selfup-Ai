'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sword, Trophy, Star, Coins, Clock, CheckCircle2,
  Loader2, Shield, BookOpen, Timer, Dumbbell, Palette, Globe, Medal,
  Zap, AlertCircle, XCircle, ChevronRight, Filter, Info, Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BadgeGrid, Badge } from '@/components/gamification/BadgeGrid'
import { LevelUpModal } from '@/components/gamification/LevelUpModal'
import confetti from 'canvas-confetti'

type QuestType = 'daily' | 'weekly' | 'special'
type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary'
type UserQuestStatus = 'active' | 'completed' | 'expired' | null

interface Quest {
  id: string
  title: string
  description: string
  type: QuestType
  pillar: string
  xp_reward: number
  coin_reward: number
  difficulty: Difficulty
  icon: string
  is_active: boolean
  user_status: UserQuestStatus
  user_quest_id: string | null
  completed_at: string | null
  current_value: number
  target_value: number
  time_remaining: string | null
  expires_at: string | null
}

const PILLAR_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  fitness: { icon: Dumbbell, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  skills:  { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  time:    { icon: Timer,    color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  style:   { icon: Palette,  color: 'text-sky-400', bg: 'bg-sky-500/10' },
  general: { icon: Globe,    color: 'text-slate-400', bg: 'bg-slate-500/10' },
}

const TYPE_CONFIG: Record<QuestType, { label: string; color: string; bgCard: string; borderGlow: string }> = {
  daily:   { label: 'DAILY',   color: 'text-blue-400', bgCard: 'bg-slate-950/40', borderGlow: 'hover:border-blue-500/40' },
  weekly:  { label: 'WEEKLY',  color: 'text-cyan-400',    bgCard: 'bg-slate-950/40', borderGlow: 'hover:border-cyan-500/40' },
  special: { label: 'SPECIAL', color: 'text-amber-400',  bgCard: 'bg-slate-950/60', borderGlow: 'hover:border-amber-500/50' },
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy:      { label: 'Easy',      color: 'text-green-400', bg: 'bg-green-500/10' },
  medium:    { label: 'Medium',    color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  hard:      { label: 'Hard',      color: 'text-red-400',    bg: 'bg-red-500/10' },
  legendary: { label: 'Legendary', color: 'text-amber-400',  bg: 'bg-amber-500/20' },
}

function QuestCard({ quest, onAccept, onComplete, onAbandon, isActioning }: {
  quest: Quest
  onAccept: (id: string) => void
  onComplete: (id: string) => void
  onAbandon: (id: string) => void
  isActioning: string | null
}) {
  const pillar = PILLAR_CONFIG[quest.pillar] || PILLAR_CONFIG.general
  const typeConf = TYPE_CONFIG[quest.type]
  const diffConf = DIFFICULTY_CONFIG[quest.difficulty] || DIFFICULTY_CONFIG.medium
  const PillarIcon = pillar.icon
  const isCompleted = quest.user_status === 'completed'
  const isExpired = quest.user_status === 'expired'
  const isActive = quest.user_status === 'active'
  const loading = isActioning === quest.id
  
  const progress = Math.min((quest.current_value / quest.target_value) * 100, 100)
  const canComplete = quest.current_value >= quest.target_value

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative rounded-3xl border border-blue-500/20 p-6 transition-all group overflow-hidden bg-slate-950/40 backdrop-blur-md",
        "before:absolute before:inset-0 before:bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px)] before:bg-[size:100%_4px] before:pointer-events-none",
        quest.difficulty === 'legendary' && !isCompleted && 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        (isCompleted || isExpired) && 'opacity-60'
      )}
    >
      {/* Background Icon/Glow */}
      <div className="absolute -top-4 -right-4 text-6xl opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform">
        {quest.icon}
      </div>

      <div className="flex items-start gap-4 relative z-10">
        {/* Left Side: Icon & Pillar */}
        <div className="flex flex-col items-center gap-2">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/20", pillar.bg)}>
            <PillarIcon size={24} className={pillar.color} />
          </div>
          <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] italic border border-current", diffConf.color, diffConf.bg)}>
            {diffConf.label}
          </div>
        </div>

        {/* Middle: Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn("text-[9px] font-black uppercase tracking-[0.3em] italic", typeConf.color)}>
              {typeConf.label} Protocol
            </span>
            {quest.time_remaining && isActive && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-blue-400/40 uppercase tracking-widest italic">
                <Clock size={10} /> {quest.time_remaining}
              </span>
            )}
          </div>
          
          <h3 className="text-base font-black text-blue-100 mb-1 leading-tight uppercase italic tracking-wider">{quest.title}</h3>
          <p className="text-xs text-blue-100/60 leading-relaxed mb-4 line-clamp-2 group-hover:line-clamp-none transition-all">
            {quest.description}
          </p>

          {/* Progress Section */}
          {isActive && (
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold italic tracking-widest uppercase text-blue-400/60">
                <span>Progress Trace</span>
                <span className="text-blue-400">{quest.current_value} / {quest.target_value}</span>
              </div>
              <div className="h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden border border-blue-500/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    progress >= 100 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-blue-500'
                  )}
                />
              </div>
            </div>
          )}

          {/* Rewards */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap size={12} className="text-blue-400" />
              <span className="text-xs font-black text-blue-400">+{quest.xp_reward} <span className="text-[10px] opacity-60">XP</span></span>
            </div>
            {quest.coin_reward > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Star size={12} className="text-amber-400" />
                <span className="text-xs font-black text-amber-400">+{quest.coin_reward} <span className="text-[10px] opacity-60">AiC</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim border border-tertiary-fixed-dim/20">
              <CheckCircle2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 text-error border border-error/20">
              <XCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Failed</span>
            </div>
          ) : isActive ? (
            <>
              <button
                onClick={() => onComplete(quest.id)}
                disabled={loading || !canComplete}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all italic",
                  canComplete 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 border border-blue-400'
                    : 'bg-slate-900 text-blue-500/20 cursor-not-allowed border border-blue-500/10'
                )}
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={14} />}
                Extract Rewards
              </button>
              <button 
                onClick={() => onAbandon(quest.id)}
                className="text-[9px] font-bold text-on-surface-variant/30 hover:text-error/60 transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                <XCircle size={10} /> Abandon
              </button>
            </>
          ) : (
            <button
              onClick={() => onAccept(quest.id)}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl italic",
                quest.difficulty === 'legendary'
                  ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-400 border border-amber-400'
                  : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-500 border border-blue-400'
              )}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Sword size={14} />}
              Initialize Quest
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function QuestsPage() {
  const { session } = useAuthStore()
  const [quests, setQuests] = useState<Quest[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [activeMajorTab, setActiveMajorTab] = useState<'quests' | 'badges'>('quests')
  const [activeTypeTab, setActiveTypeTab] = useState<QuestType>('daily')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBadges, setIsLoadingBadges] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  
  // Level up state
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpData, setLevelUpData] = useState({ newLevel: 2, totalXp: 100, coinsRewarded: 50 })

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`
  }), [session])

  const fetchQuests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/quests', { headers: headers() })
      const data = await res.json()
      if (res.ok) setQuests(data)
    } catch { toast.error('Failed to load quests') }
    finally { setIsLoading(false) }
  }

  const fetchBadges = async () => {
    setIsLoadingBadges(true)
    try {
      const res = await fetch('/api/gamification/badges', { headers: headers() })
      const data = await res.json()
      if (res.ok) setBadges(data.badges || [])
    } catch { console.error('Failed to load badges') }
    finally { setIsLoadingBadges(false) }
  }

  useEffect(() => {
    if (session?.access_token) {
      fetchQuests()
      fetchBadges()
    }
  }, [session])

  const handleAccept = async (questId: string) => {
    setActioning(questId)
    try {
      const res = await fetch(`/api/quests/${questId}/accept`, {
        method: 'POST', headers: headers()
      })
      if (res.ok) {
        toast.success('Quest accepted! Good luck, hero.')
        fetchQuests()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to accept quest')
      }
    } catch { toast.error('Failed to accept quest') }
    finally { setActioning(null) }
  }

  const handleComplete = async (questId: string) => {
    setActioning(questId)
    try {
      const res = await fetch(`/api/quests/${questId}/complete`, {
        method: 'POST', headers: headers()
      })
      const data = await res.json()
      if (res.ok) {
        // Trigger Confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#f59e0b', '#10b981', '#ec4899']
        })

        toast.success(`Victory! +${data.xpReward} XP Earned.`)
        
        if (data.leveledUp && data.levelUpDetails) {
          setLevelUpData(data.levelUpDetails)
          setTimeout(() => setShowLevelUp(true), 1000)
        }
        
        fetchQuests()
      } else {
        toast.error(data.error || 'Failed to complete quest')
      }
    } catch { toast.error('Failed to complete quest') }
    finally { setActioning(null) }
  }

  const handleAbandon = async (questId: string) => {
    if (!confirm('Are you sure you want to abandon this quest? You will lose all progress.')) return
    
    setActioning(questId)
    try {
      const res = await fetch(`/api/quests/${questId}/abandon`, {
        method: 'POST', headers: headers()
      })
      if (res.ok) {
        toast.info('Quest abandoned.')
        fetchQuests()
      }
    } catch { toast.error('Failed to abandon quest') }
    finally { setActioning(null) }
  }

  const filteredQuests = useMemo(() => {
    return quests.filter(q => {
      const matchesType = q.type === activeTypeTab
      const matchesStatus = statusFilter === 'all' || q.user_status === statusFilter
      return matchesType && matchesStatus
    })
  }, [quests, activeTypeTab, statusFilter])

  const stats = useMemo(() => {
    return {
      active: quests.filter(q => q.user_status === 'active').length,
      completed: quests.filter(q => q.user_status === 'completed').length,
      available: quests.filter(q => !q.user_status).length,
    }
  }, [quests])

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <motion.div 
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-16 h-16 rounded-3xl bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <Sword size={32} className="text-blue-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-[0.3em] text-blue-400 system-text-glow">System Quests</h1>
            <p className="text-blue-400/60 text-[10px] font-black tracking-[0.2em] uppercase italic">Earn experience points and unlock legendary rewards.</p>
          </div>
        </div>

        {/* AI Generator Button */}
        <button
          onClick={async () => {
            const loadingToast = toast.loading('System is crafting personalized missions...')
            try {
              const res = await fetch('/api/quests/generate', { method: 'POST', headers: headers() })
              if (res.ok) {
                toast.success('Missions generated!', { id: loadingToast })
                fetchQuests()
              } else {
                toast.error('Failed to generate protocols', { id: loadingToast })
              }
            } catch {
              toast.error('Sync error', { id: loadingToast })
            }
          }}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/50 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500/30 transition-all shadow-lg shadow-blue-500/10"
        >
          <Sparkles size={14} className="group-hover:animate-spin" />
          Protocol Initializer
        </button>

        {/* Quick Stats */}
        <div className="flex gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/40 border border-blue-500/20 flex flex-col items-center min-w-[80px] shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <span className="text-xl font-black text-blue-400">{stats.active}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/40">Active</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/40 border border-blue-500/20 flex flex-col items-center min-w-[80px] shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <span className="text-xl font-black text-cyan-400">{stats.completed}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400/40">Sync</span>
          </div>
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between border-b border-outline-variant/10 pb-6">
        {/* Main Mode Toggle */}
        <div className="flex gap-2 p-1.5 bg-slate-950/40 border border-blue-500/20 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <button
            onClick={() => setActiveMajorTab('quests')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all flex items-center gap-2",
              activeMajorTab === 'quests' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-blue-400/40 hover:text-blue-400'
            )}
          >
            <Sword size={16} /> Quests
          </button>
          <button
            onClick={() => setActiveMajorTab('badges')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all flex items-center gap-2",
              activeMajorTab === 'badges' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-amber-400/40 hover:text-amber-400'
            )}
          >
            <Medal size={16} /> Badges
          </button>
        </div>

        {activeMajorTab === 'quests' && (
          <div className="flex flex-wrap gap-3 items-center">
            {/* Type Filters */}
            <div className="flex gap-1 p-1 bg-slate-950/40 border border-blue-500/10 rounded-xl">
              {(['daily', 'weekly', 'special'] as QuestType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTypeTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] italic transition-all",
                    activeTypeTab === tab ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-blue-400/30 hover:text-blue-400'
                  )}
                >
                  {tab === 'daily' ? 'DAILY PROTOCOLS' : tab === 'weekly' ? 'WEEKLY TRIALS' : 'SPECIAL MISSIONS'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex gap-1 p-1 bg-slate-950/40 border border-blue-500/10 rounded-xl">
              {(['all', 'active', 'completed', 'expired'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] italic transition-all",
                    statusFilter === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-blue-400/30 hover:text-blue-400'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeMajorTab === 'quests' ? (
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/40">Loading Quests...</p>
            </div>
          ) : filteredQuests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/10">
                <Trophy size={32} className="text-on-surface-variant/20" />
              </div>
              <div>
                <h3 className="text-lg font-black text-on-surface mb-1">No quests found</h3>
                <p className="text-xs text-on-surface-variant/40 max-w-[250px] mx-auto">Try changing your filters or check back later for new challenges.</p>
              </div>
              <button 
                onClick={() => { setStatusFilter('all'); setActiveTypeTab('daily'); }}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredQuests.map(quest => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onAccept={handleAccept}
                    onComplete={handleComplete}
                    onAbandon={handleAbandon}
                    isActioning={actioning}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <BadgeGrid badges={badges} isLoading={isLoadingBadges} />
      )}

      {/* Modals & Overlays */}
      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel={levelUpData.newLevel}
        totalXp={levelUpData.totalXp}
        coinsReward={levelUpData.coinsRewarded}
      />

      {/* Helper Info */}
      {activeMajorTab === 'quests' && !isLoading && (
        <div className="flex items-center justify-center gap-6 pt-12 text-on-surface-variant/20">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Quests auto-track as you complete tasks</span>
          </div>
        </div>
      )}
    </div>
  )
}
