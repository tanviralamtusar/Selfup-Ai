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
  habit: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  workout: { icon: Dumbbell, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  skill: { icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  task: { icon: Calendar, color: 'text-blue-300', bg: 'bg-blue-500/10' },
  badge: { icon: Trophy, color: 'text-blue-100', bg: 'bg-blue-500/20' },
  quest: { icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  outfit: { icon: Shirt, color: 'text-blue-200', bg: 'bg-blue-500/10' }
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
    // Poll for updates every 30 seconds to simulate real-time
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [session, feedMode])

  const fetchActivities = async () => {
    if (!session?.access_token) return
    
    try {
      const endpoint = feedMode === 'personal' ? '/api/user/activities' : '/api/social/activities'
      const res = await fetch(endpoint, {
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

  return (
    <div className="relative">
      {/* Feed Toggle */}
      <div className="flex gap-1 p-1 bg-slate-900/50 rounded-lg mb-6 border border-blue-500/10">
        <button
          onClick={() => { setFeedMode('personal'); setIsLoading(true); }}
          className={cn(
            "flex-1 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded transition-all italic",
            feedMode === 'personal' ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "text-blue-500/40 hover:text-blue-400"
          )}
        >
          Chronicle
        </button>
        <button
          onClick={() => { setFeedMode('world'); setIsLoading(true); }}
          className={cn(
            "flex-1 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded transition-all italic",
            feedMode === 'world' ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "text-blue-500/40 hover:text-blue-400"
          )}
        >
          World Echoes
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={24} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/40 italic">Synchronizing Logs...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-blue-500/10 rounded-2xl bg-slate-900/20">
          <Clock size={32} className="mx-auto text-blue-500/20 mb-3" />
          <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest leading-relaxed italic">
            No data recovered.<br />Proceed with initialization.
          </p>
        </div>
      ) : (
        <>
          {/* Timeline Line */}
          <div className="absolute left-[19px] top-16 bottom-4 w-[2px] bg-gradient-to-b from-blue-500/50 via-blue-500/10 to-transparent" />

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
                      "absolute left-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all duration-500 ring-4 ring-slate-950 group-hover:scale-110",
                      config.bg,
                      config.color
                    )}>
                      <Icon size={18} />
                    </div>

                    <div className="bg-slate-900/40 hover:bg-slate-900/60 p-4 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group/item">
                      {/* Scanline overlay on hover */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-0 group-hover/item:opacity-20 pointer-events-none" />

                      <div className="flex justify-between items-start gap-4 relative z-10">
                        <div className="space-y-1">
                          {activity.username && (
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-4 h-4 rounded-full bg-slate-950 border border-blue-500/20 flex items-center justify-center overflow-hidden">
                                {activity.avatar_url ? (
                                  <img src={activity.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User size={8} className="text-blue-500/40" />
                                )}
                              </div>
                              <span className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest italic">{activity.username}</span>
                            </div>
                          )}
                          <p className="text-xs font-black text-blue-50 tracking-tight group-hover/item:text-blue-400 transition-colors uppercase italic">
                            {activity.title}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-blue-500/40 uppercase tracking-widest">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                            {activity.pillar && (
                              <span className={cn(
                                "flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] italic",
                                activity.pillar === 'fitness' ? 'text-rose-500' :
                                activity.pillar === 'skills' ? 'text-cyan-400' :
                                activity.pillar === 'style' ? 'text-blue-300' :
                                activity.pillar === 'time' ? 'text-blue-400' : 'text-blue-500'
                              )}>
                                <span className={cn("w-1 h-1 rounded-full", 
                                  activity.pillar === 'fitness' ? 'bg-rose-500' :
                                  activity.pillar === 'skills' ? 'bg-cyan-400' :
                                  activity.pillar === 'style' ? 'bg-blue-300' :
                                  activity.pillar === 'time' ? 'bg-blue-400' : 'bg-blue-500'
                                )} />
                                {activity.pillar}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {activity.xp_earned > 0 && (
                          <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md self-start border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                            <TrendingUp size={10} />
                            <span className="text-[9px] font-black tabular-nums">+{activity.xp_earned} XP</span>
                          </div>
                        )}
                      </div>
    
                      {/* Metadata display if exists */}
                      {activity.metadata?.icon && activity.type === 'badge' && (
                        <div className="mt-3 p-2.5 rounded-xl bg-blue-500/5 flex items-center gap-3 border border-blue-500/10 relative overflow-hidden group/badge">
                           <div className={cn(
                             "absolute inset-0 opacity-10 blur-xl",
                             activity.metadata.rarity === 'legendary' ? 'bg-blue-400' : 'bg-blue-500'
                           )} />

                           <div className={cn(
                             "w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-950 shadow-lg relative z-10 border border-blue-500/30",
                           )}>
                             {activity.metadata.icon}
                           </div>
                           <div className="relative z-10">
                             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-100 italic system-text-glow">
                               {activity.metadata.rarity} ACQUIRED
                             </p>
                             <p className="text-[8px] font-bold text-blue-500/40 uppercase tracking-widest">Entry added to Chronicle</p>
                           </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            <button className="w-full py-3 rounded-xl border border-dashed border-blue-500/10 text-[9px] font-black uppercase tracking-[0.4em] text-blue-500/30 hover:text-blue-400 hover:border-blue-500/30 transition-all active:scale-[0.98] italic">
              Access Data Archives
            </button>
          </div>
        </>
      )}
    </div>
  )
}
