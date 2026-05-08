'use client'

import { motion } from 'framer-motion'
import { Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { useUserBadges, type Badge } from '@/lib/hooks/useUser'

const RARITY_COLORS = {
  common: 'text-blue-500/50',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400'
}

export function BadgeShowcase() {
  const { data: badges = [], isLoading } = useUserBadges()

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 py-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-14 h-14 rounded-2xl bg-slate-900 border border-blue-500/10 animate-pulse shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2 italic">
          <Trophy size={14} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" /> Earned Badges
        </h3>
        <Link href={ROUTES.LEADERBOARD} className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 italic tracking-widest">
          View All <ChevronRight size={12} />
        </Link>
      </div>

      {badges.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-dashed border-blue-500/20 text-center">
          <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.2em] italic">No badges earned yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-1 px-1">
          {badges.filter((b: any) => !!b).slice(0, 8).map((badge: Badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative cursor-help group transition-all",
                badge.rarity === 'legendary' ? 'border-amber-500/40 ring-2 ring-amber-500/20 shadow-[0_0_25px_rgba(251,191,36,0.2)]' : 
                badge.rarity === 'epic' ? 'border-purple-500/40 ring-2 ring-purple-500/20 shadow-[0_0_25px_rgba(168,85,247,0.2)]' : 
                badge.rarity === 'rare' ? 'border-blue-400/40 shadow-[0_0_20px_rgba(96,165,250,0.2)]' : ''
              )}
            >
              <span className="text-3xl filter drop-shadow-md group-hover:drop-shadow-xl transition-all">
                {badge.icon}
              </span>
              
              {/* Improved Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-950 text-blue-50 px-3 py-2 rounded-lg border border-blue-500/40 text-[10px] font-black uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none z-20 shadow-[0_10px_20px_rgba(0,0,0,0.5),0_0_15px_rgba(59,130,246,0.2)]">
                <span className={cn("mr-1", badge.rarity && RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS])}>{badge.rarity}</span>: {badge.name}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-blue-500/40 rotate-45" />
              </div>
            </motion.div>
          ))}
          {badges.length > 8 && (
            <Link href={ROUTES.LEADERBOARD} className="flex-shrink-0 w-16 h-16 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center border border-blue-500/10 text-blue-500/40 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-inner group">
              <span className="text-xs font-black group-hover:scale-110 transition-transform">+{badges.length - 8}</span>
              <span className="text-[7px] font-black uppercase tracking-tighter">More</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

