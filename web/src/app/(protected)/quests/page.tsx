'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sword, Trophy, Star, Coins, Clock, CheckCircle2,
  Loader2, Shield, BookOpen, Timer, Dumbbell, Palette, Globe, Medal
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BadgeGrid, Badge } from '@/components/gamification/BadgeGrid'
import { LevelUpModal } from '@/components/gamification/LevelUpModal'

type QuestType = 'daily' | 'weekly' | 'special'
type UserQuestStatus = 'active' | 'completed' | 'expired' | null

interface Quest {
  id: string
  title: string
  description: string
  type: QuestType
  pillar: string
  xp_reward: number
  coin_reward: number
  is_active: boolean
  user_status: UserQuestStatus
  user_quest_id: string | null
  completed_at: string | null
}

const PILLAR_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  fitness: { icon: Dumbbell, color: 'text-green-400', bg: 'bg-green-500/10' },
  skills:  { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
  time:    { icon: Timer,    color: 'text-secondary', bg: 'bg-secondary/10' },
  style:   { icon: Palette,  color: 'text-pink-400', bg: 'bg-pink-500/10' },
  general: { icon: Globe,    color: 'text-on-surface-variant/60', bg: 'bg-surface-container-highest' },
}

const TYPE_CONFIG: Record<QuestType, { label: string; color: string; bgCard: string; borderGlow: string }> = {
  daily:   { label: 'Daily',   color: 'text-yellow-400', bgCard: 'bg-surface-container-low', borderGlow: 'hover:border-yellow-500/20' },
  weekly:  { label: 'Weekly',  color: 'text-primary',    bgCard: 'bg-surface-container-low', borderGlow: 'hover:border-primary/20' },
  special: { label: 'Special', color: 'text-amber-400',  bgCard: 'bg-gradient-to-br from-amber-900/20 to-surface-container-low', borderGlow: 'hover:border-amber-500/30' },
}

const RARITY_GLOW: Record<QuestType, string> = {
  daily:   '',
  weekly:  'shadow-primary/5',
  special: 'shadow-amber-500/10 shadow-lg',
}

function QuestCard({ quest, onAccept, onComplete, isActioning }: {
  quest: Quest
  onAccept: (id: string) => void
  onComplete: (id: string) => void
  isActioning: string | null
}) {
  const pillar = PILLAR_CONFIG[quest.pillar] || PILLAR_CONFIG.general
  const typeConf = TYPE_CONFIG[quest.type]
  const PillarIcon = pillar.icon
  const isCompleted = quest.user_status === 'completed'
  const isActive = quest.user_status === 'active'
  const loading = isActioning === quest.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-3xl border border-outline-variant/10 p-6 transition-all",
        typeConf.bgCard, typeConf.borderGlow,
        RARITY_GLOW[quest.type],
        isCompleted && 'opacity-40 grayscale'
      )}
    >
      {/* Special glow effect */}
      {quest.type === 'special' && !isCompleted && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl rounded-full pointer-events-none" />
      )}

      <div className="flex items-start gap-4 relative z-10">
        {/* Pillar Icon */}
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", pillar.bg)}>
          <PillarIcon size={22} className={pillar.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn("text-[9px] font-black uppercase tracking-[0.3em]", typeConf.color)}>
              {typeConf.label}
            </span>
            {quest.type === 'special' && (
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                ✦ Legendary
              </span>
            )}
          </div>
          <h3 className="text-sm font-black text-on-surface mb-1.5">{quest.title}</h3>
          <p className="text-xs text-on-surface-variant/60 leading-relaxed">{quest.description}</p>

          {/* Rewards */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-primary" />
              <span className="text-xs font-black text-primary">+{quest.xp_reward} XP</span>
            </div>
            {quest.coin_reward > 0 && (
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-amber-400" />
                <span className="text-xs font-black text-amber-400">+{quest.coin_reward} AiC</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-tertiary-fixed-dim/10 text-tertiary-fixed-dim">
              <CheckCircle2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Done</span>
            </div>
          ) : isActive ? (
            <button
              onClick={() => onComplete(quest.id)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30 hover:bg-tertiary-fixed-dim hover:text-on-surface text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
              Complete
            </button>
          ) : (
            <button
              onClick={() => onAccept(quest.id)}
              disabled={loading}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                quest.type === 'special'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-on-primary'
              )}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Sword size={12} />}
              Accept
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
  const [activeTab, setActiveTab] = useState<QuestType>('daily')
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

  useEffect(() => {
    if (session?.access_token) {
      fetchQuests()
      fetchBadges()
    }
  }, [session])

  const fetchBadges = async () => {
    setIsLoadingBadges(true)
    try {
      const res = await fetch('/api/gamification/badges', { headers: headers() })
      const data = await res.json()
      if (res.ok) setBadges(data.badges || [])
    } catch { console.error('Failed to load badges') }
    finally { setIsLoadingBadges(false) }
  }

  const fetchQuests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/quests', { headers: headers() })
      const data = await res.json()
      if (res.ok) setQuests(data)
    } catch { toast.error('Failed to load quests') }
    finally { setIsLoading(false) }
  }

  const handleAccept = async (questId: string) => {
    setActioning(questId)
    try {
      const res = await fetch(`/api/quests/${questId}/accept`, {
        method: 'POST', headers: headers()
      })
      if (res.ok) {
        toast.success('Quest accepted! Time to grind.')
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
        toast.success(`Quest complete! +${data.xpReward} XP${data.coinReward > 0 ? ` & +${data.coinReward} AiCoins` : ''}`)
        
        if (data.leveledUp && data.levelUpDetails) {
          setLevelUpData(data.levelUpDetails)
          setShowLevelUp(true)
        }
        
        fetchQuests()
      } else {
        toast.error(data.error || 'Failed to complete quest')
      }
    } catch { toast.error('Failed to complete quest') }
    finally { setActioning(null) }
  }

  const filteredQuests = quests.filter(q => q.type === activeTab)
  const activeQuestCount = quests.filter(q => q.user_status === 'active').length
  const completedQuestCount = quests.filter(q => q.user_status === 'completed').length

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Sword size={28} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Quest Board</h1>
            <p className="text-on-surface-variant/60 text-sm">Complete quests. Earn glory. Level up.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="px-5 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-center">
            <p className="text-xl font-black font-headline text-primary">{activeQuestCount}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Active</p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 text-center">
            <p className="text-xl font-black font-headline text-tertiary-fixed-dim">{completedQuestCount}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Done</p>
          </div>
        </div>
      </div>

      {/* Major Tabs */}
      <div className="flex gap-2 p-1.5 bg-surface-container-low border border-outline-variant/10 rounded-2xl w-fit">
        <button
          onClick={() => setActiveMajorTab('quests')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeMajorTab === 'quests' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
          )}
        >
          <Sword size={14} className="inline mr-2" /> Quests
        </button>
        <button
          onClick={() => setActiveMajorTab('badges')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeMajorTab === 'badges' ? 'bg-amber-500/10 text-amber-400 shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
          )}
        >
          <Medal size={14} className="inline mr-2" /> Badges
        </button>
      </div>

      {activeMajorTab === 'quests' && (
        <>
          {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 w-fit">
        {(['daily', 'weekly', 'special'] as QuestType[]).map(tab => {
          const conf = TYPE_CONFIG[tab]
          const count = quests.filter(q => q.type === tab).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === tab
                  ? 'bg-surface-container text-on-surface shadow-sm'
                  : 'text-on-surface-variant/40 hover:text-on-surface-variant'
              )}
            >
              <span className={activeTab === tab ? conf.color : ''}>{conf.label}</span>
              <span className={cn(
                "ml-2 text-[9px] px-1.5 py-0.5 rounded-full",
                activeTab === tab ? 'bg-surface-container-highest text-on-surface-variant' : ''
              )}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Quest Grid */}
      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="py-24 text-center">
          <Trophy size={40} className="text-on-surface-variant/10 mx-auto mb-4" />
          <h3 className="text-lg font-black text-on-surface-variant/30">No quests available</h3>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredQuests.map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onAccept={handleAccept}
                onComplete={handleComplete}
                isActioning={actioning}
              />
            ))}
            </AnimatePresence>
          </motion.div>
        )}
        </>
      )}

      {activeMajorTab === 'badges' && (
        <BadgeGrid badges={badges} isLoading={isLoadingBadges} />
      )}

      {/* Active Quest Banner */}
      {activeQuestCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface-container border border-primary/20 shadow-2xl shadow-primary/10 backdrop-blur-xl"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black text-on-surface-variant">
              <span className="text-primary">{activeQuestCount}</span> quest{activeQuestCount > 1 ? 's' : ''} in progress
            </span>
          </motion.div>
        </div>
      )}

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel={levelUpData.newLevel}
        totalXp={levelUpData.totalXp}
        coinsReward={levelUpData.coinsRewarded}
      />
    </div>
  )
}
