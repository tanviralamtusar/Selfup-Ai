'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell,
  Brain,
  Clock,
  CheckCircle2,
  Trophy,
  Sparkles,
  Shirt,
  Calendar,
  TrendingUp,
  Loader2,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/store/authStore'

interface Activity {
  id: string
  type: 'habit' | 'workout' | 'skill' | 'task' | 'badge' | 'quest' | 'outfit'
  title: string
  pillar: string | null
  xp_earned: number
  timestamp: string
  user_id?: string
  username?: string
  avatar_url?: string | null
  metadata?: Record<string, any>
}

const TYPE_CONFIG = {
  habit:   { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  workout: { icon: Dumbbell,     color: 'text-rose-400', bg: 'bg-rose-400/10' },
  skill:   { icon: Brain,        color: 'text-[#5db8a0]', bg: 'bg-[#5db8a0]/10' },
  task:    { icon: Calendar,     color: 'text-primary', bg: 'bg-primary/10' },
  badge:   { icon: Trophy,       color: 'text-amber-400', bg: 'bg-amber-400/10' },
  quest:   { icon: Sparkles,     color: 'text-purple-400', bg: 'bg-purple-400/10' },
  outfit:  { icon: Shirt,        color: 'text-pink-400', bg: 'bg-pink-400/10' }
}

interface ActivityFeedProps {
  activities?: Activity[]
  isLoading?: boolean
}

export function ActivityFeed({ activities: initialActivities, isLoading: initialLoading }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities || [])
  const [isLoading, setIsLoading] = useState(initialLoading !== undefined ? initialLoading : true)
  const [feedMode, setFeedMode] = useState<'personal' | 'world'>('personal')
  const { session } = useAuthStore()

  useEffect(() => {
    if (initialActivities && feedMode === 'personal') {
      setActivities(initialActivities)
    }
  }, [initialActivities, feedMode])

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [session, feedMode])

  const fetchActivities = async () => {
    if (!session?.access_token) return
    try {
      const endpoint = feedMode === 'personal' ? '/api/user/activities' : '/api/social/activities'
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        setActivities(await res.json())
      }
    } catch {
      console.error('Failed to fetch activities')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Feed Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4 border border-border">
        <button
          onClick={() => { setFeedMode('personal'); setIsLoading(true); }}
          className={cn(
            "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
            feedMode === 'personal' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mine
        </button>
        <button
          onClick={() => { setFeedMode('world'); setIsLoading(true); }}
          className={cn(
            "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
            feedMode === 'world' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Community
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <Clock size={28} className="mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No activity yet. Start completing goals!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {activities.map((activity, index) => {
              const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.habit
              const Icon = config.icon

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border hover:bg-secondary transition-colors group"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", config.bg, config.color)}>
                    <Icon size={15} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {activity.username && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                          {activity.avatar_url
                            ? <img src={activity.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <User size={8} className="text-muted-foreground" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.username}</span>
                      </div>
                    )}
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                      {activity.pillar && (
                        <span className="text-xs text-muted-foreground capitalize">{activity.pillar}</span>
                      )}
                    </div>

                    {activity.metadata?.icon && activity.type === 'badge' && (
                      <div className="mt-2 p-2 rounded-lg bg-card border border-border flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-muted border border-border">
                          {activity.metadata.icon}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground capitalize">{activity.metadata.rarity as string} badge earned</p>
                          <p className="text-xs text-muted-foreground">Added to collection</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {activity.xp_earned > 0 && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md self-start border border-primary/20 shrink-0">
                      <TrendingUp size={10} />
                      <span className="text-xs font-medium tabular-nums">+{activity.xp_earned}</span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
