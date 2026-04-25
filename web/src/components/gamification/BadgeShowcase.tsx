'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

interface UserBadge {
  id: string
  earned_at: string
  badges: {
    name: string
    icon: string
    category: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  }
}

const RARITY_COLORS = {
  common: 'text-blue-500/50',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400'
}

export function BadgeShowcase() {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { session } = useAuthStore()

  useEffect(() => {
    if (session?.access_token) {
      fetchBadges()
    }
  }, [session])

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/user/badges', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      })
      if (res.ok) {
        setBadges(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch badges')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 py-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-12 h-12 rounded-xl bg-slate-900 border border-blue-500/10 animate-pulse shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/60 flex items-center gap-2 italic">
          <Trophy size={12} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" /> Earned Badges
        </h3>
        <Link href={ROUTES.LEADERBOARD} className="text-[8px] font-black uppercase text-blue-400/80 hover:text-blue-300 transition-colors flex items-center gap-1 italic">
          Full Collection <ChevronRight size={10} />
        </Link>
      </div>

      {badges.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-blue-500/20 text-center">
          <p className="text-[9px] font-black text-blue-500/40 uppercase tracking-widest italic">No badges earned yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
          {badges.slice(0, 8).map((ub) => (
            <motion.div
              key={ub.id}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative cursor-help group",
                ub.badges.rarity === 'legendary' ? 'ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 
                ub.badges.rarity === 'epic' ? 'ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''
              )}
            >
              <span className="text-2xl filter drop-shadow-sm group-hover:drop-shadow-lg transition-all">
                {ub.badges.icon}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-blue-50 px-2 py-1.5 rounded border border-blue-500/40 text-[8px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className={cn(RARITY_COLORS[ub.badges.rarity])}>{ub.badges.rarity}</span>: {ub.badges.name}
              </div>
            </motion.div>
          ))}
          {badges.length > 8 && (
            <Link href={ROUTES.LEADERBOARD} className="flex-shrink-0 w-14 h-14 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center border border-blue-500/10 text-blue-500/40 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-inner">
              <span className="text-[10px] font-black">+{badges.length - 8}</span>
              <span className="text-[6px] font-black uppercase tracking-tighter">More</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
