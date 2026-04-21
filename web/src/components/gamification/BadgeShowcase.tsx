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
  common: 'text-on-surface-variant',
  rare: 'text-primary',
  epic: 'text-pink-500',
  legendary: 'text-amber-500'
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
          <div key={i} className="w-12 h-12 rounded-xl bg-surface-container animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60 flex items-center gap-2">
          <Trophy size={12} className="text-amber-500" /> Earned Badges
        </h3>
        <Link href={ROUTES.SOCIAL_LEADERBOARD} className="text-[8px] font-black uppercase text-primary hover:underline flex items-center gap-1">
          Full Collection <ChevronRight size={10} />
        </Link>
      </div>

      {badges.length === 0 ? (
        <div className="p-4 rounded-2xl bg-surface-container-highest/20 border border-dashed border-outline-variant/10 text-center">
          <p className="text-[9px] font-black text-on-surface-variant/30 uppercase tracking-widest">No badges earned yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {badges.slice(0, 8).map((ub) => (
            <motion.div
              key={ub.id}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant/10 shadow-lg relative cursor-help group",
                ub.badges.rarity === 'legendary' ? 'ring-2 ring-amber-500/30' : 
                ub.badges.rarity === 'epic' ? 'ring-2 ring-pink-500/30' : ''
              )}
            >
              <span className="text-2xl filter drop-shadow-sm group-hover:drop-shadow-lg transition-all">
                {ub.badges.icon}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl border border-outline-variant/10">
                <span className={cn(RARITY_COLORS[ub.badges.rarity])}>{ub.badges.rarity}</span>: {ub.badges.name}
              </div>
            </motion.div>
          ))}
          {badges.length > 8 && (
            <Link href={ROUTES.SOCIAL_LEADERBOARD} className="flex-shrink-0 w-14 h-14 rounded-2xl bg-surface-container-highest/50 flex flex-col items-center justify-center border border-outline-variant/10 text-on-surface-variant/40 hover:text-primary transition-colors">
              <span className="text-[10px] font-black">+{badges.length - 8}</span>
              <span className="text-[6px] font-black uppercase tracking-tighter">More</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
