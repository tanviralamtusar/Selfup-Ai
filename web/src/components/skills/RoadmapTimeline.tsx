'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Clock, Info, ExternalLink, Play, ChevronDown, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface Milestone {
  id: string
  title: string
  description: string
  order_index: number
  estimated_hours: number
  is_completed: boolean
}

interface RoadmapTimelineProps {
  skillName: string
  milestones: Milestone[]
  onToggleMilestone: (id: string, isCompleted: boolean) => void
  isLoading?: string | null // ID of milestone being toggled
  roadmapStatus: 'not_started' | 'pending' | 'processing' | 'completed' | 'failed'
  roadmapError: string | null
}

export function RoadmapTimeline({ skillName, milestones, onToggleMilestone, isLoading, roadmapStatus, roadmapError }: RoadmapTimelineProps) {
  const { session } = useAuthStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resources, setResources] = useState<Record<string, any[]>>({})
  const [isFetchingResources, setIsFetchingResources] = useState<string | null>(null)

  const handleFetchResources = async (e: React.MouseEvent, milestone: Milestone) => {
    e.stopPropagation() // prevent bubbling if we click a button
    
    // Toggle expand/collapse
    if (expandedId === milestone.id) {
      setExpandedId(null)
      return
    }
    
    setExpandedId(milestone.id)

    // If we already have resources for this milestone, don't refetch
    if (resources[milestone.id] && resources[milestone.id].length > 0) return

    setIsFetchingResources(milestone.id)
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        // We use the skill name to provide context (e.g. "Python: Variables" instead of just "Variables")
        body: JSON.stringify({ query: `${skillName} ${milestone.title}` })
      })

      if (res.ok) {
        const data = await res.json()
        setResources(prev => ({ ...prev, [milestone.id]: data }))
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err)
    } finally {
      setIsFetchingResources(null)
    }
  }

  const isGenerating = roadmapStatus === 'pending' || roadmapStatus === 'processing'
  const isFailed = roadmapStatus === 'failed'
  const error = roadmapError

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 bg-slate-950/20 rounded-3xl border border-blue-500/10 backdrop-blur-md">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-blue-400 animate-pulse" size={24} />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black font-headline tracking-[0.3em] italic text-blue-100 uppercase">
            {roadmapStatus === 'pending' ? 'Queuing Architect...' : 'System is Architecting...'}
          </h3>
          <p className="text-xs text-blue-400/60 max-w-[280px] font-bold italic tracking-widest uppercase">
            {roadmapStatus === 'pending' 
              ? `Waiting for System to begin mapping your journey for ${skillName}.` 
              : `Analyzing millions of data points to create your personalized ${skillName} roadmap.`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
        </div>
      </div>
    )
  }

  if (isFailed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 bg-slate-950/20 rounded-3xl border border-red-500/20 backdrop-blur-md">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black font-headline tracking-[0.3em] italic text-red-400 uppercase">Architectural Error</h3>
          <p className="text-xs text-red-400/60 max-w-[280px] font-bold italic tracking-widest uppercase">
            {error || "System encountered an unexpected turbulence while mapping your path."}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="h-12 px-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] italic border border-red-500/30 transition-all"
        >
          Retry Blueprinting
        </button>
      </div>
    )
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/40 mb-2">
          <Sparkles size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant/60">No Roadmap Found</h3>
          <p className="text-xs text-on-surface-variant/40 max-w-[200px]">This mastery hasn't been architected yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 pl-10 pr-4 py-4">
      {/* Connector Line */}
      <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-blue-500/10" />

      {milestones.map((milestone, idx) => {
        const isNext = !milestone.is_completed && (idx === 0 || milestones[idx - 1].is_completed)
        const isLocked = !milestone.is_completed && idx > 0 && !milestones[idx - 1].is_completed
        const isUpdating = isLoading === milestone.id

        return (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "relative group transition-all duration-500",
              isLocked && "opacity-40 grayscale"
            )}
          >
            {/* Status Icon / Node */}
            <div className="absolute -left-[31px] top-1">
              <motion.button
                whileHover={!isLocked ? { scale: 1.2 } : {}}
                whileTap={!isLocked ? { scale: 0.9 } : {}}
                onClick={() => !isLocked && onToggleMilestone(milestone.id, !milestone.is_completed)}
                disabled={isLocked || isUpdating}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 relative z-10",
                  milestone.is_completed
                    ? "bg-cyan-500 border-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                    : isNext
                      ? "bg-slate-950 border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] system-text-glow"
                      : "bg-slate-950 border-blue-500/20 text-blue-500/20"
                )}
              >
                {isUpdating ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : milestone.is_completed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Circle size={10} fill={isNext ? "currentColor" : "transparent"} />
                )}
              </motion.button>
              
              {/* Highlight Line Segment (Animated) */}
              <AnimatePresence>
                {milestone.is_completed && idx < milestones.length - 1 && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    className="absolute top-10 left-[19px] w-[2px] bg-green-500 z-0 origin-top"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Content Card */}
            <div className={cn(
               "p-5 rounded-2xl border transition-all duration-500 backdrop-blur-md relative overflow-hidden",
               milestone.is_completed 
                 ? "bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                 : isNext
                   ? "bg-blue-500/5 border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                   : "bg-slate-950/20 border-blue-500/10"
            )}>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 relative z-10">
                  <h4 className={cn(
                    "font-bold text-sm tracking-widest uppercase italic",
                    milestone.is_completed ? "text-cyan-400 system-text-glow" : "text-blue-100"
                  )}>
                    {milestone.title}
                  </h4>
                  <p className="text-xs text-blue-100/60 leading-relaxed max-w-sm font-medium">
                    {milestone.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] italic text-blue-400/40 relative z-10">
                  <Clock size={10} />
                  <span>~{milestone.estimated_hours}h Depth</span>
                </div>
              </div>

              {/* Find Resources Action */}
              <div className="mt-4 pt-4 border-t border-outline-variant/10">
                <button
                  onClick={(e) => handleFetchResources(e, milestone)}
                  disabled={isLocked}
                  className={cn(
                    "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors",
                    isLocked ? "opacity-50 cursor-not-allowed text-on-surface-variant/40" : "text-primary hover:text-primary/80"
                  )}
                >
                  <Play size={14} />
                  <span>Find Resources</span>
                  <ChevronDown size={14} className={cn(
                    "ml-auto transition-transform duration-300", 
                    expandedId === milestone.id ? "rotate-180" : ""
                  )} />
                </button>

                {/* Sub-content dropdown: YouTube Links */}
                <AnimatePresence>
                  {expandedId === milestone.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 space-y-3"
                    >
                      {isFetchingResources === milestone.id ? (
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium py-2">
                           <Loader2 size={14} className="animate-spin text-primary" />
                           Running deep search...
                        </div>
                      ) : resources[milestone.id] && resources[milestone.id].length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {resources[milestone.id].map((vid: any) => (
                            <a 
                              key={vid.id}
                              href={vid.link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="group flex gap-3 p-2 rounded-xl hover:bg-surface-container border border-transparent hover:border-outline-variant/10 transition-all"
                            >
                              <div className="w-24 h-16 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 relative">
                                <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ExternalLink size={16} className="text-white" />
                                </div>
                              </div>
                              <div className="py-1">
                                <h5 className="text-xs font-bold text-on-surface line-clamp-2 leading-tight group-hover:text-primary transition-colors">{vid.title}</h5>
                                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">{vid.channelTitle}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : resources[milestone.id] ? (
                         <div className="text-xs text-on-surface-variant/40 italic py-2">No videos found.</div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
