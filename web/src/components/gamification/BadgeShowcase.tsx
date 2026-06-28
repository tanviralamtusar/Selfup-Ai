'use client'

import { motion } from 'framer-motion'
import { Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { useUserBadges, type Badge } from '@/lib/hooks/useUser'

const RARITY_BORDER = {
  common:    'border-border',
  rare:      'border-primary/30',
  epic:      'border-purple-500/40',
  legendary: 'border-amber-500/40'
}

export function BadgeShowcase() {
  const { data: badges = [], isLoading } = useUserBadges()

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-12 h-12 rounded-xl bg-muted border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Trophy size={13} className="text-amber-400" /> Badges
        </h3>
        <Link href={ROUTES.LEADERBOARD} className="text-xs text-primary hover:underline flex items-center gap-0.5">
          View All <ChevronRight size={11} />
        </Link>
      </div>

      {badges.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">No badges earned yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
          {badges.filter((b: any) => !!b).slice(0, 8).map((badge: Badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.08 }}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center border cursor-help relative group transition-colors",
                RARITY_BORDER[badge.rarity as keyof typeof RARITY_BORDER] || 'border-border'
              )}
            >
              <span className="text-2xl">{badge.icon}</span>

              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-foreground px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none z-20 shadow-md">
                <span className="capitalize text-muted-foreground">{badge.rarity}:</span> {badge.name}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
              </div>
            </motion.div>
          ))}
          {badges.length > 8 && (
            <Link href={ROUTES.LEADERBOARD} className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex flex-col items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors group">
              <span className="text-xs font-medium">+{badges.length - 8}</span>
              <span className="text-[10px] text-muted-foreground">more</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
