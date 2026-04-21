'use client'

import { motion } from 'framer-motion'
import { Shield, Sparkles, Trophy, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Badge {
  id: string
  key: string
  title: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  is_earned?: boolean
  earned_at?: string | null
}

const RARITY_CONFIG: Record<string, { color: string, border: string, bg: string, ring: string, icon: any }> = {
  common: { color: 'text-on-surface-variant', border: 'border-outline-variant/10', bg: 'bg-surface-container', ring: 'ring-0', icon: Shield },
  rare:   { color: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/5', ring: 'ring-0', icon: Sparkles },
  epic:   { color: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-500/10', ring: 'ring-pink-500/20 ring-4', icon: Trophy },
  legendary: { color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30 ring-4', icon: Trophy },
}

export function BadgeItem({ badge }: { badge: Badge }) {
  const isEarned = badge.is_earned
  const conf = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "relative rounded-3xl p-5 border transition-all duration-300 flex flex-col items-center text-center group overflow-hidden",
        isEarned ? conf.bg : 'bg-surface-container-low grayscale opacity-60',
        isEarned ? conf.border : 'border-outline-variant/10'
      )}
    >
      {/* Dynamic Background Glow for high rarities */}
      {isEarned && (badge.rarity === 'legendary' || badge.rarity === 'epic') && (
        <div className={cn(
          "absolute top-0 inset-x-0 h-24 blur-2xl pointer-events-none opacity-50",
          badge.rarity === 'legendary' ? 'bg-amber-500/20' : 'bg-pink-500/20'
        )} />
      )}

      {/* Icon Hexagon */}
      <div className={cn(
        "relative w-16 h-16 flex items-center justify-center rounded-2xl mb-4 transition-all duration-300",
        isEarned ? 'bg-surface-container-high shadow-lg' : 'bg-surface-container',
        isEarned ? conf.ring : ''
      )}>
        {badge.icon ? (
          <span className="text-3xl filter drop-shadow-md">{badge.icon}</span>
        ) : (
          <conf.icon size={28} className={isEarned ? conf.color : 'text-on-surface-variant/40'} />
        )}
        
        {!isEarned && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface-container-low flex items-center justify-center">
            <Lock size={12} className="text-on-surface-variant" />
          </div>
        )}
      </div>

      <h4 className={cn("font-black text-sm mb-1 line-clamp-1", isEarned ? 'text-on-surface' : 'text-on-surface-variant')}>
        {badge.title}
      </h4>
      <p className="text-[10px] text-on-surface-variant/70 leading-relaxed line-clamp-2 min-h-[2.5em]">
        {badge.description}
      </p>

      {/* Rarity/Date Tag */}
      <div className="mt-4 pt-4 border-t border-outline-variant/5 w-full">
        {isEarned ? (
          <div className="flex flex-col items-center gap-1">
            <span className={cn("text-[9px] font-black uppercase tracking-widest", conf.color)}>
              {badge.rarity}
            </span>
            <span className="text-[9px] font-bold text-on-surface-variant/40">
              {new Date(badge.earned_at!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
            </span>
          </div>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
            Locked
          </span>
        )}
      </div>

    </motion.div>
  )
}

export function BadgeGrid({ badges, isLoading }: { badges: Badge[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-56 rounded-3xl bg-surface-container animate-pulse border border-outline-variant/5" />
        ))}
      </div>
    )
  }

  if (!badges.length) {
    return (
      <div className="py-20 text-center border border-dashed border-outline-variant/20 rounded-3xl">
        <Trophy size={48} className="mx-auto text-on-surface-variant/20 mb-4" />
        <h3 className="text-xl font-black text-on-surface-variant">No Badges Yet</h3>
        <p className="text-sm text-on-surface-variant/50 max-w-sm mx-auto mt-2">
          Complete quests and maintain streaks to earn your first badge.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map(b => <BadgeItem key={b.id} badge={b} />)}
    </div>
  )
}
