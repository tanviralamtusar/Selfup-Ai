'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, ExternalLink, Play, BookOpen, FileQuestion, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopicCardProps {
  topic: {
    id: string
    title: string
    type: 'theory' | 'practical' | 'project' | 'quiz'
    estimated_minutes: number
    xp_reward: number
    is_completed: boolean
    topic_resources?: { id: string; url: string; title: string }[]
  }
  isLocked: boolean
  onComplete: (topicId: string) => void
  onFindResource: (topicId: string, topicTitle: string) => void
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  theory: { icon: BookOpen, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Theory' },
  practical: { icon: Play, color: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'Practice' },
  project: { icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Project' },
  quiz: { icon: FileQuestion, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Quiz' },
}

export function TopicCard({ topic, isLocked, onComplete, onFindResource }: TopicCardProps) {
  const config = typeConfig[topic.type] || typeConfig.theory
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all group",
        topic.is_completed
          ? "bg-cyan-500/5 border-cyan-500/20"
          : isLocked
            ? "bg-slate-950/20 border-blue-500/5 opacity-40"
            : "bg-slate-950/30 border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/5"
      )}
    >
      {/* Completion Toggle */}
      <button
        onClick={() => !isLocked && !topic.is_completed && onComplete(topic.id)}
        disabled={isLocked || topic.is_completed}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
          topic.is_completed
            ? "text-cyan-400"
            : isLocked
              ? "text-blue-500/10"
              : "text-blue-400/30 hover:text-blue-400 hover:scale-110"
        )}
      >
        {topic.is_completed ? (
          <CheckCircle2 size={18} />
        ) : (
          <Circle size={14} fill={!isLocked ? "transparent" : "transparent"} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className={cn(
            "text-xs font-bold truncate",
            topic.is_completed ? "text-cyan-400/80 line-through" : "text-blue-100"
          )}>
            {topic.title}
          </h5>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn("text-[8px] font-black uppercase tracking-[0.15em] italic px-1.5 py-0.5 rounded border", config.color)}>
            <Icon size={8} className="inline mr-0.5 -mt-0.5" />
            {config.label}
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.15em] italic text-blue-400/30">
            <Clock size={8} className="inline mr-0.5 -mt-0.5" /> ~{topic.estimated_minutes}m
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.15em] italic text-cyan-400/40">
            +{topic.xp_reward} XP
          </span>
        </div>
      </div>

      {/* Resource links */}
      <div className="flex items-center gap-1 shrink-0">
        {topic.topic_resources && topic.topic_resources.length > 0 ? (
          <a
            href={topic.topic_resources[0].url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-blue-400/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Open resource"
          >
            <ExternalLink size={14} />
          </a>
        ) : !isLocked && !topic.is_completed ? (
          <button
            onClick={() => onFindResource(topic.id, topic.title)}
            className="p-1.5 rounded-lg text-blue-400/20 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Find resource"
          >
            <Play size={14} />
          </button>
        ) : null}
      </div>
    </motion.div>
  )
}
