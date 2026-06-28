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
  common: { color: 'text-primary', border: 'border-border', bg: 'bg-card', ring: 'ring-0', icon: Shield },
  rare:   { color: 'text-[#5db8a0]', border: 'border-border', bg: 'bg-[#5db8a0]/5', ring: 'ring-0', icon: Sparkles },
  epic:   { color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10', ring: 'ring-purple-500/20 ring-4', icon: Trophy },
  legendary: { color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30 ring-4', icon: Trophy },
}

export function BadgeItem({ badge }: { badge: Badge }) {
  const isEarned = badge.is_earned
  const conf = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "relative rounded-xl p-5 border transition-all duration-300 flex flex-col items-center text-center group overflow-hidden ",
        isEarned ? conf.bg : 'bg-background/20 grayscale opacity-40',
        isEarned ? conf.border : 'border-border'
      )}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0  bg-[size:100%_4px] pointer-events-none" />
      {/* Dynamic Background Glow for high rarities */}
      {isEarned && (badge.rarity === 'legendary' || badge.rarity === 'epic') && (
        <div className={cn(
          "absolute top-0 inset-x-0 h-24 blur-2xl pointer-events-none opacity-50",
          badge.rarity === 'legendary' ? 'bg-amber-500/20' : 'bg-pink-500/20'
        )} />
      )}

      {/* Icon Hexagon */}
      <div className={cn(
        "relative w-16 h-16 flex items-center justify-center rounded-xl mb-4 transition-all duration-300",
        isEarned ? 'bg-background  border border-border' : 'bg-card border border-border',
        isEarned ? conf.ring : ''
      )}>
        {badge.icon ? (
          <span className="text-3xl filter">{badge.icon}</span>
        ) : (
          <conf.icon size={28} className={isEarned ? conf.color : 'text-muted-foreground'} />
        )}
        
        {!isEarned && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
            <Lock size={12} className="text-muted-foreground" />
          </div>
        )}
      </div>

      <h4 className={cn(" text-sm mb-1 line-clamp-1 ", isEarned ? 'text-foreground' : 'text-primary/20')}>
        {badge.title}
      </h4>
      <p className={cn("text-[10px] leading-relaxed line-clamp-2 min-h-[2.5em] font-medium", isEarned ? 'text-primary/60' : 'text-muted-foreground')}>
        {badge.description}
      </p>

      {/* Rarity/Date Tag */}
      <div className="mt-4 pt-4 border-t border-border w-full">
        {isEarned ? (
          <div className="flex flex-col items-center gap-1">
            <span className={cn("text-[9px]   ", conf.color)}>
              {badge.rarity} MODULE
            </span>
            <span className="text-[9px] font-medium text-primary/40 ">
              EARNED: {new Date(badge.earned_at!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
            </span>
          </div>
        ) : (
          <span className="text-[9px]    text-muted-foreground">
            [ LOCKED PROTOCOL ]
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
          <div key={i} className="h-56 rounded-xl bg-muted animate-pulse border border-border" />
        ))}
      </div>
    )
  }

  if (!badges.length) {
    return (
      <div className="py-20 text-center border border-dashed border-border rounded-xl bg-background/20">
        <Trophy size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl  text-foreground  ">No Registry Entries</h3>
        <p className="text-xs text-primary/40 max-w-sm mx-auto mt-2 font-medium ">
          Complete protocols and maintain synchronization to earn system honors.
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
