'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
  Loader2, Sparkles, AlertCircle, Trophy, Layers, BookOpen,
  FileQuestion
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { TopicCard } from './TopicCard'

interface Topic {
  id: string
  title: string
  type: 'theory' | 'practical' | 'project' | 'quiz'
  estimated_minutes: number
  xp_reward: number
  is_completed: boolean
  order_index: number
  topic_resources?: { id: string; url: string; title: string }[]
}

interface Milestone {
  id: string
  title: string
  description: string
  order_index: number
  estimated_hours: number
  xp_reward: number
  is_completed: boolean
  skill_topics?: Topic[]
  milestone_tests?: { id: string; title: string; passing_score_pct: number }[]
}

interface Phase {
  id: string
  phase_number: number
  phase_name: string
  estimated_weeks: number
  xp_bonus: number
  status: string
  skill_milestones?: Milestone[]
}

interface RoadmapTimelineProps {
  skillId: string
  skillName: string
  roadmap: {
    id: string
    title: string
    goal: string
    difficulty: string
    plan_type: string
    daily_study_minutes: number
    status: string
    skill_phases?: Phase[]
  } | null
  progress?: { completed: number; total: number; percentage: number }
  roadmapStatus: string
  onCompleteMilestone: (milestoneId: string) => void
  onCompleteTopic: (topicId: string) => void
  onStartTest: (testId: string) => void
}

export function RoadmapTimeline({ 
  skillId, skillName, roadmap, progress, roadmapStatus,
  onCompleteMilestone, onCompleteTopic, onStartTest
}: RoadmapTimelineProps) {
  const { session } = useAuthStore()
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)
  const [isFetchingResources, setIsFetchingResources] = useState<string | null>(null)
  const [topicResources, setTopicResources] = useState<Record<string, any[]>>({})

  const isGenerating = roadmapStatus === 'pending' || roadmapStatus === 'processing'
  const isFailed = roadmapStatus === 'failed'

  const handleFindResource = async (topicId: string, topicTitle: string) => {
    if (topicResources[topicId]) return
    setIsFetchingResources(topicId)
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ query: `${skillName} ${topicTitle}` })
      })
      if (res.ok) {
        const data = await res.json()
        setTopicResources(prev => ({ ...prev, [topicId]: data }))
      }
    } catch (err) {
      console.error('[RoadmapTimeline] Resource fetch failed:', err)
    } finally {
      setIsFetchingResources(null)
    }
  }

  // Auto-expand first incomplete phase
  const autoExpandPhase = () => {
    if (!roadmap?.skill_phases) return null
    const firstIncomplete = roadmap.skill_phases.find(p => 
      p.skill_milestones?.some(m => !m.is_completed)
    )
    return firstIncomplete?.id || roadmap.skill_phases[0]?.id || null
  }

  // Set initial expanded state
  if (expandedPhase === null && roadmap?.skill_phases?.length) {
    const autoId = autoExpandPhase()
    if (autoId) setExpandedPhase(autoId)
  }

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
            Building Roadmap...
          </h3>
          <p className="text-xs text-blue-400/60 max-w-[280px] font-bold italic tracking-widest uppercase">
            AI is crafting your personalized {skillName} learning path.
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
          <h3 className="text-xl font-black font-headline tracking-[0.3em] italic text-red-400 uppercase">Generation Error</h3>
          <p className="text-xs text-red-400/60 max-w-[280px] font-bold italic tracking-widest uppercase">
            Something went wrong while building your roadmap. Please try again.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="h-12 px-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] italic border border-red-500/30 transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!roadmap || !roadmap.skill_phases || roadmap.skill_phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400/40 mb-2 border border-blue-500/20">
          <Sparkles size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-blue-400/60">No Roadmap Found</h3>
          <p className="text-xs text-blue-400/40 max-w-[200px]">Start the Scholar interview in Chat to generate one.</p>
        </div>
      </div>
    )
  }

  const phases = roadmap.skill_phases

  return (
    <div className="space-y-3 p-4">
      {/* Roadmap Header */}
      <div className="px-2 pb-4 border-b border-blue-500/10 mb-2">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] italic text-blue-100 mb-1">{roadmap.title}</h3>
        <p className="text-[10px] text-blue-400/40 italic">{roadmap.goal}</p>
        {progress && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] italic text-blue-400/40">Overall Progress</span>
              <span className="text-sm font-black italic text-blue-400">{progress.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Phases */}
      {phases.map((phase, phaseIdx) => {
        const phaseMilestones = phase.skill_milestones || []
        const phaseCompleted = phaseMilestones.filter(m => m.is_completed).length
        const phaseTotal = phaseMilestones.length
        const phaseProgress = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0
        const isExpanded = expandedPhase === phase.id
        const isPhaseComplete = phaseCompleted === phaseTotal && phaseTotal > 0

        return (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: phaseIdx * 0.1 }}
            className="rounded-2xl border border-blue-500/10 overflow-hidden"
          >
            {/* Phase Header */}
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 transition-all text-left",
                isPhaseComplete 
                  ? "bg-cyan-500/5 hover:bg-cyan-500/10" 
                  : "bg-slate-950/30 hover:bg-blue-500/5"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-black italic",
                isPhaseComplete
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {isPhaseComplete ? <CheckCircle2 size={16} /> : phase.phase_number}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "text-xs font-black uppercase tracking-[0.15em] italic truncate",
                  isPhaseComplete ? "text-cyan-400" : "text-blue-100"
                )}>
                  {phase.phase_name}
                </h4>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] italic text-blue-400/30">
                    {phaseCompleted}/{phaseTotal} milestones
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] italic text-blue-400/30">
                    ~{phase.estimated_weeks}w
                  </span>
                  {phase.xp_bonus > 0 && (
                    <span className="text-[8px] font-black uppercase tracking-[0.15em] italic text-cyan-400/40">
                      +{phase.xp_bonus} XP bonus
                    </span>
                  )}
                </div>
              </div>

              {/* Mini progress */}
              <div className="w-12 shrink-0">
                <div className="h-1 w-full bg-blue-500/10 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", isPhaseComplete ? "bg-cyan-400" : "bg-blue-500")} style={{ width: `${phaseProgress}%` }} />
                </div>
              </div>

              <ChevronDown size={16} className={cn(
                "text-blue-400/30 transition-transform shrink-0",
                isExpanded && "rotate-180"
              )} />
            </button>

            {/* Phase Content (Milestones) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    {phaseMilestones.map((milestone, mIdx) => {
                      const isNext = !milestone.is_completed && (mIdx === 0 || phaseMilestones[mIdx - 1].is_completed)
                      const isLocked = !milestone.is_completed && mIdx > 0 && !phaseMilestones[mIdx - 1].is_completed
                      const isMilestoneExpanded = expandedMilestone === milestone.id
                      const topics = milestone.skill_topics || []
                      const topicsCompleted = topics.filter(t => t.is_completed).length
                      const allTopicsDone = topicsCompleted === topics.length && topics.length > 0

                      return (
                        <div
                          key={milestone.id}
                          className={cn(
                            "rounded-xl border transition-all",
                            milestone.is_completed
                              ? "bg-cyan-500/5 border-cyan-500/20"
                              : isNext
                                ? "bg-blue-500/5 border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                                : "bg-slate-950/20 border-blue-500/5",
                            isLocked && "opacity-40"
                          )}
                        >
                          {/* Milestone Header */}
                          <button
                            onClick={() => !isLocked && setExpandedMilestone(isMilestoneExpanded ? null : milestone.id)}
                            disabled={isLocked}
                            className="w-full flex items-center gap-3 p-3 text-left"
                          >
                            {/* Status circle */}
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all",
                              milestone.is_completed
                                ? "bg-cyan-500 border-cyan-500 text-slate-950"
                                : isNext
                                  ? "border-blue-400 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                  : "border-blue-500/20 text-blue-500/20"
                            )}>
                              {milestone.is_completed ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <Circle size={8} fill={isNext ? "currentColor" : "transparent"} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h5 className={cn(
                                "text-[11px] font-bold truncate",
                                milestone.is_completed ? "text-cyan-400" : "text-blue-100"
                              )}>
                                {milestone.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-black uppercase tracking-[0.1em] italic text-blue-400/30">
                                  <Clock size={8} className="inline mr-0.5 -mt-0.5" /> ~{milestone.estimated_hours}h
                                </span>
                                {topics.length > 0 && (
                                  <span className="text-[8px] font-black uppercase tracking-[0.1em] italic text-blue-400/30">
                                    <Layers size={8} className="inline mr-0.5 -mt-0.5" /> {topicsCompleted}/{topics.length} topics
                                  </span>
                                )}
                                {milestone.milestone_tests && milestone.milestone_tests.length > 0 && (
                                  <span className="text-[8px] font-black uppercase tracking-[0.1em] italic text-purple-400/50">
                                    <FileQuestion size={8} className="inline mr-0.5 -mt-0.5" /> Test
                                  </span>
                                )}
                                <span className="text-[8px] font-black uppercase tracking-[0.1em] italic text-cyan-400/40">
                                  +{milestone.xp_reward} XP
                                </span>
                              </div>
                            </div>

                            {!isLocked && (
                              <ChevronRight size={14} className={cn(
                                "text-blue-400/20 transition-transform shrink-0",
                                isMilestoneExpanded && "rotate-90"
                              )} />
                            )}
                          </button>

                          {/* Milestone Content (Topics) */}
                          <AnimatePresence>
                            {isMilestoneExpanded && !isLocked && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 space-y-1.5 border-t border-blue-500/10 pt-3">
                                  {milestone.description && (
                                    <p className="text-[10px] text-blue-100/50 italic mb-2 leading-relaxed">{milestone.description}</p>
                                  )}

                                  {topics.length > 0 ? (
                                    topics.map(topic => (
                                      <TopicCard
                                        key={topic.id}
                                        topic={topic}
                                        isLocked={false}
                                        onComplete={onCompleteTopic}
                                        onFindResource={handleFindResource}
                                      />
                                    ))
                                  ) : (
                                    <p className="text-[10px] text-blue-400/30 italic py-2 text-center">No topics in this milestone</p>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 pt-2 border-t border-blue-500/5 mt-2">
                                    {/* Complete milestone button */}
                                    {!milestone.is_completed && allTopicsDone && (
                                      <button
                                        onClick={() => onCompleteMilestone(milestone.id)}
                                        className="flex-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg font-black uppercase text-[9px] tracking-[0.2em] italic border border-cyan-500/20 transition-all"
                                      >
                                        <Trophy size={10} className="inline mr-1 -mt-0.5" />
                                        Complete Milestone (+{milestone.xp_reward} XP)
                                      </button>
                                    )}

                                    {/* Test button */}
                                    {milestone.milestone_tests && milestone.milestone_tests.length > 0 && (
                                      <button
                                        onClick={() => onStartTest(milestone.milestone_tests![0].id)}
                                        className="flex-1 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg font-black uppercase text-[9px] tracking-[0.2em] italic border border-purple-500/20 transition-all"
                                      >
                                        <FileQuestion size={10} className="inline mr-1 -mt-0.5" />
                                        Take Assessment
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
