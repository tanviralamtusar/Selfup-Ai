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
  ChevronRight,
  TrendingUp,
  Loader2
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
  metadata?: Record<string, any>
}

const TYPE_CONFIG = {
  habit: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  workout: { icon: Dumbbell, color: 'text-red-500', bg: 'bg-red-500/10' },
  skill: { icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  task: { icon: Calendar, color: 'text-secondary', bg: 'bg-secondary/10' },
  badge: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  quest: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  outfit: { icon: Shirt, color: 'text-pink-500', bg: 'bg-pink-500/10' }
}

interface ActivityFeedProps {
  activities?: Activity[]
  isLoading?: boolean
}

export function ActivityFeed({ activities: initialActivities, isLoading: initialLoading }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities || [])
  const [isLoading, setIsLoading] = useState(initialLoading !== undefined ? initialLoading : true)
  const { session } = useAuthStore()

  useEffect(() => {
    if (initialActivities) {
      setActivities(initialActivities)
    }
  }, [initialActivities])

  useEffect(() => {
    if (initialLoading !== undefined) {
      setIsLoading(initialLoading)
    }
  }, [initialLoading])

  useEffect(() => {
    if (!initialActivities && session?.access_token) {
      fetchActivities()
    }
  }, [session, initialActivities])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/user/activities', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      })
      if (res.ok) {
        setActivities(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch activities')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Syncing Chronicle...</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-outline-variant/10 rounded-3xl">
        <Clock size={32} className="mx-auto text-on-surface-variant/20 mb-3" />
        <p className="text-xs font-black text-on-surface-variant/40 uppercase tracking-widest leading-relaxed">
          No echoes in your journey yet.<br />Start an activity to begin your legacy.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/30 via-outline-variant/10 to-transparent" />

      <div className="space-y-6">
        <AnimatePresence initial={false}>
          {activities.map((activity, index) => {
            const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.habit
            const Icon = config.icon

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-12 group"
              >
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute left-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all duration-500 ring-4 ring-surface-container-low group-hover:scale-110",
                  config.bg,
                  config.color
                )}>
                  <Icon size={18} />
                </div>

                  <div className="bg-surface-container-low/40 hover:bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5 hover:border-outline-variant/20 transition-all duration-300 shadow-sm relative overflow-hidden group/item">
                    {/* Subtle Glow Effect on Hover */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover/item:opacity-10 transition-opacity duration-500",
                      config.bg
                    )} />

                    <div className="flex justify-between items-start gap-4 relative z-10">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-on-surface tracking-tight group-hover/item:text-primary transition-colors">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-wider">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                          {activity.pillar && (
                            <span className={cn(
                              "flex items-center gap-1 text-[8px] font-black uppercase tracking-widest",
                              activity.pillar === 'fitness' ? 'text-red-500' :
                              activity.pillar === 'skills' ? 'text-blue-500' :
                              activity.pillar === 'style' ? 'text-pink-500' :
                              activity.pillar === 'time' ? 'text-emerald-500' : 'text-secondary'
                            )}>
                              <span className={cn("w-1 h-1 rounded-full", 
                                activity.pillar === 'fitness' ? 'bg-red-500' :
                                activity.pillar === 'skills' ? 'bg-blue-500' :
                                activity.pillar === 'style' ? 'bg-pink-500' :
                                activity.pillar === 'time' ? 'bg-emerald-500' : 'bg-secondary'
                              )} />
                              {activity.pillar}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {activity.xp_earned > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-md self-start border border-yellow-500/20">
                          <TrendingUp size={10} />
                          <span className="text-[9px] font-black tabular-nums">+{activity.xp_earned} XP</span>
                        </div>
                      )}
                    </div>
  
                    {/* Metadata display if exists */}
                    {activity.metadata?.icon && activity.type === 'badge' && (
                      <div className="mt-3 p-2.5 rounded-xl bg-surface-container-highest/30 flex items-center gap-3 border border-outline-variant/10 relative overflow-hidden group/badge">
                         {/* Badge specific glow */}
                         <div className={cn(
                           "absolute inset-0 opacity-10 blur-xl",
                           activity.metadata.rarity === 'legendary' ? 'bg-amber-500' : 
                           activity.metadata.rarity === 'epic' ? 'bg-purple-500' : 'bg-primary'
                         )} />

                         <div className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center text-xl bg-surface-container-low shadow-lg relative z-10",
                           activity.metadata.rarity === 'legendary' ? 'ring-2 ring-amber-500/50' : 
                           activity.metadata.rarity === 'epic' ? 'ring-2 ring-purple-500/50' : 'ring-2 ring-primary/50'
                         )}>
                           {activity.metadata.icon}
                         </div>
                         <div className="relative z-10">
                           <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", 
                             activity.metadata.rarity === 'legendary' ? 'text-amber-500' : 
                             activity.metadata.rarity === 'epic' ? 'text-purple-500' : 'text-primary'
                           )}>
                             {activity.metadata.rarity} Achievement
                           </p>
                           <p className="text-[8px] font-bold text-on-surface-variant/60 uppercase">Unlocked Forever</p>
                         </div>
                      </div>
                    )}
                  </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        <button className="w-full py-3 rounded-2xl border border-dashed border-outline-variant/10 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 hover:text-primary hover:border-primary/30 transition-all active:scale-[0.98]">
          View Full Chronicle
        </button>
      </div>
    </div>
  )
}
