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
  common: { color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-slate-950/40', ring: 'ring-0', icon: Shield },
  rare:   { color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', ring: 'ring-0', icon: Sparkles },
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
        "relative rounded-3xl p-5 border transition-all duration-300 flex flex-col items-center text-center group overflow-hidden backdrop-blur-md",
        isEarned ? conf.bg : 'bg-slate-950/20 grayscale opacity-40',
        isEarned ? conf.border : 'border-blue-500/5'
      )}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
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
        isEarned ? 'bg-slate-950 shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20' : 'bg-slate-950/40 border border-blue-500/5',
        isEarned ? conf.ring : ''
      )}>
        {badge.icon ? (
          <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{badge.icon}</span>
        ) : (
          <conf.icon size={28} className={isEarned ? conf.color : 'text-blue-500/10'} />
        )}
        
        {!isEarned && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-950 border-2 border-blue-500/10 flex items-center justify-center">
            <Lock size={12} className="text-blue-500/20" />
          </div>
        )}
      </div>

      <h4 className={cn("font-black text-sm mb-1 line-clamp-1 uppercase italic tracking-widest", isEarned ? 'text-blue-100' : 'text-blue-400/20')}>
        {badge.title}
      </h4>
      <p className={cn("text-[10px] leading-relaxed line-clamp-2 min-h-[2.5em] font-medium", isEarned ? 'text-blue-400/60' : 'text-blue-500/10')}>
        {badge.description}
      </p>

      {/* Rarity/Date Tag */}
      <div className="mt-4 pt-4 border-t border-blue-500/10 w-full">
        {isEarned ? (
          <div className="flex flex-col items-center gap-1">
            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] italic", conf.color)}>
              {badge.rarity} MODULE
            </span>
            <span className="text-[9px] font-bold text-blue-400/40 italic">
              EARNED: {new Date(badge.earned_at!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
            </span>
          </div>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-[0.2em] italic text-blue-500/10">
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
          <div key={i} className="h-56 rounded-3xl bg-surface-container animate-pulse border border-outline-variant/5" />
        ))}
      </div>
    )
  }

  if (!badges.length) {
    return (
      <div className="py-20 text-center border border-dashed border-blue-500/20 rounded-3xl bg-slate-950/20 backdrop-blur-sm">
        <Trophy size={48} className="mx-auto text-blue-500/10 mb-4" />
        <h3 className="text-xl font-black text-blue-100 uppercase italic tracking-[0.3em]">No Registry Entries</h3>
        <p className="text-xs text-blue-400/40 max-w-sm mx-auto mt-2 font-bold italic tracking-widest uppercase">
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
