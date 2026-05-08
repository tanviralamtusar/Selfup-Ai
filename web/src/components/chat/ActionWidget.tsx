'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  ClipboardList,
  Map,
  ArrowRight,
  Check,
  X,
  ListTodo,
  Repeat,
  CalendarClock,
  Brain,
  Calendar,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './MarkdownRenderer'

interface Action {
  type: string
  payload: any
  requires_confirmation?: boolean
  confirmed?: boolean
}

interface ActionWidgetProps {
  action: Action
  messageId?: string
  className?: string
  onConfirm?: (action: Action) => Promise<void>
  onCancel?: (action: Action) => void
}

export function ActionWidget({ action, messageId, className, onConfirm, onCancel }: ActionWidgetProps) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'confirmed' | 'cancelled'>(
    action.confirmed ? 'confirmed' : 'idle'
  )

  const handleConfirm = async () => {
    setStatus('confirming')
    try {
      if (onConfirm) {
        await onConfirm(action)
      } else {
        // Get current session for JWT token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No active session found. Please log in.')

        // Default: Call the backend confirmation API
        const response = await fetch('/api/ai/chat/confirm', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ action, messageId }),
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.error || 'Failed to confirm action')
        
        if (result.data?.message) {
          toast.success(result.data.message)
        }
      }
      setStatus('confirmed')
    } catch (err: any) {
      console.error('[ActionWidget] Confirmation failed:', err)
      setStatus('idle')
      toast.error(err.message || 'Action confirmation failed')
    }
  }

  const handleCancel = () => {
    setStatus('cancelled')
    onCancel?.(action)
  }

  // If requires confirmation and hasn't been acted upon yet
  if (action.requires_confirmation && status === 'idle') {
    return (
      <ConfirmationWidget
        action={action}
        className={className}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )
  }

  if (status === 'confirming') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20', className)}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
          <span className="text-sm text-yellow-300">Processing...</span>
        </div>
      </motion.div>
    )
  }

  if (status === 'confirmed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20', className)}
      >
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-300 font-medium">Action confirmed and executed.</span>
        </div>
      </motion.div>
    )
  }

  if (status === 'cancelled') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className={cn('mt-4 p-3 rounded-xl bg-gray-500/10 border border-gray-500/20', className)}
      >
        <div className="flex items-center gap-3">
          <X className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">Action cancelled.</span>
        </div>
      </motion.div>
    )
  }

  // Non-confirmation actions — render status widgets
  switch (action.type) {
    case 'fitness_plan_generate':
      return (
        <StatusWidget
          icon={<Dumbbell size={20} />}
          title="Fitness Plan Created!"
          description="Your custom fitness plan is being finalized. Head over to the Fitness Dashboard to review and activate it."
          linkHref="/fitness"
          linkText="Review Plan"
          color="green"
          className={className}
        />
      )

    case 'fitness_interview_start':
      return (
        <StatusWidget
          icon={<ClipboardList size={20} />}
          title="Fitness Assessment Active"
          description="Answer my questions above so I can design your perfect fitness plan."
          color="blue"
          className={className}
        />
      )

    case 'skill_roadmap_generate':
      return (
        <StatusWidget
          icon={<Map size={20} />}
          title="Skill Roadmap Created"
          description="A new learning roadmap has been generated based on your goals."
          linkHref="/skills"
          linkText="View Skills"
          color="purple"
          className={className}
        />
      )

    case 'schedule_day':
      return (
        <StatusWidget
          icon={<Calendar size={20} />}
          title="Day Scheduled"
          description={`Your schedule for ${action.payload.date || 'today'} has been optimized.`}
          linkHref="/time"
          linkText="View Schedule"
          color="cyan"
          className={className}
        />
      )

    case 'weekly_summary_generate':
      return (
        <StatusWidget
          icon={<Brain size={20} />}
          title="Weekly Summary Generating"
          description="Your system performance report is being compiled."
          color="amber"
          className={className}
        />
      )

    case 'suggest_guild_action':
      return (
        <StatusWidget
          icon={<Shield size={20} />}
          title="Guild Action Suggested"
          description={action.payload.suggestion_text || 'A guild action has been suggested.'}
          color="orange"
          className={className}
        />
      )

    default:
      return null
  }
}

// ─── Confirmation Widget ────────────────────────

function ConfirmationWidget({
  action,
  className,
  onConfirm,
  onCancel,
}: {
  action: Action
  className?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = getConfirmationConfig(action)
  
  // Use provided description or generate a fallback from payload fields
  const description = action.payload.description || getFallbackDescription(action)
  const hasDetailedPlan = !!description

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'mt-4 p-4 rounded-xl border shadow-lg overflow-hidden',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            config.iconBgClass,
            config.textClass
          )}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={cn('font-bold text-xs uppercase tracking-wider', config.textClass)}>
              {config.label}
            </h4>
            {hasDetailedPlan && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={12} /> HIDE DETAILS
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} /> VIEW FULL PLAN
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-white font-headline font-bold text-lg mb-1 truncate">
            {action.payload.title || action.payload.skill_name || action.payload.goal || 'Untitled'}
          </p>

          {/* Parameters Tags */}
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {action.payload.priority && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold uppercase tracking-tight">
                {action.payload.priority}
              </span>
            )}
            {action.payload.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold uppercase tracking-tight">
                {action.payload.category}
              </span>
            )}
            {action.payload.due_date && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                Due: {action.payload.due_date}
              </span>
            )}
            {action.payload.scheduled_time && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                {action.payload.scheduled_time}
              </span>
            )}
            {action.payload.days_per_week && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                {action.payload.days_per_week}x/week
              </span>
            )}
            {action.payload.experience_level && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-bold uppercase tracking-tight">
                {action.payload.experience_level}
              </span>
            )}
          </div>

          {/* Expandable Plan Detail */}
          {hasDetailedPlan && (
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? 'auto' : '0px', opacity: isExpanded ? 1 : 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="mt-2 p-3 rounded-lg bg-black/40 border border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                <MarkdownRenderer content={description} />
              </div>
            </motion.div>
          )}

          {/* Simple Description (fallback/unexpanded) */}
          {!isExpanded && description && (
            <p className="text-xs text-gray-400 mb-4 line-clamp-2 italic">
              {description.replace(/[#*`]/g, '')}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={onConfirm}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-black/20 active:scale-95',
                config.confirmBtnClass
              )}
            >
              <Check size={16} /> Confirm Plan
            </button>
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-lg text-sm font-medium transition-colors border border-white/5"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function getFallbackDescription(action: Action): string {
  const p = action.payload
  if (action.type === 'fitness_plan_generate') {
    return `### Plan Summary
- **Goal**: ${p.goal || 'Overall'}
- **Level**: ${p.experience_level || 'Beginner'}
- **Schedule**: ${p.days_per_week || 3} sessions per week
- **Equipment**: ${p.equipment || 'Bodyweight'}
- **Session Length**: ${p.session_duration_minutes || 30} minutes
${p.rest_days ? `- **Rest Days**: ${p.rest_days.join(', ')}` : ''}
${p.includes_diet ? `- **Includes Nutrition**: Yes (${p.food_preference || 'Balanced'})` : ''}

*Click Confirm to finalize and generate your full workout schedule.*`
  }

  if (action.type === 'skill_roadmap_generate') {
    return `### Roadmap Summary
- **Skill**: ${p.skill_name}
- **Category**: ${p.skill_category}
- **Goal**: ${p.goal || 'General Mastery'}
- **Study Time**: ${p.daily_study_minutes || 30} min/day

*Click Confirm to generate your personalized learning path.*`
  }

  if (action.type === 'tasks_clear_all') {
    return `### ⚠️ Warning: Destructive Action
This will permanently remove your current **${p.task_type || 'all'}** tasks.

- **Type**: ${p.task_type || 'All Tasks'}
- **Reason**: ${p.reason || 'Manual cleanup'}

*Confirm if you are sure you want to wipe this list.*`
  }

  return p.description || ''
}

// ─── Status Widget (non-confirmation) ───────────

function StatusWidget({
  icon,
  title,
  description,
  linkHref,
  linkText,
  color,
  className,
}: {
  icon: React.ReactNode
  title: string
  description: string
  linkHref?: string
  linkText?: string
  color: string
  className?: string
}) {
  const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string; linkBg: string; linkHover: string }> = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', iconBg: 'bg-green-500/20', text: 'text-green-400', linkBg: 'bg-green-500/20', linkHover: 'hover:bg-green-500/30' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconBg: 'bg-blue-500/20', text: 'text-blue-400', linkBg: 'bg-blue-500/20', linkHover: 'hover:bg-blue-500/30' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500/20', text: 'text-purple-400', linkBg: 'bg-purple-500/20', linkHover: 'hover:bg-purple-500/30' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/20', text: 'text-cyan-400', linkBg: 'bg-cyan-500/20', linkHover: 'hover:bg-cyan-500/30' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20', text: 'text-amber-400', linkBg: 'bg-amber-500/20', linkHover: 'hover:bg-amber-500/30' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconBg: 'bg-orange-500/20', text: 'text-orange-400', linkBg: 'bg-orange-500/20', linkHover: 'hover:bg-orange-500/30' },
  }

  const c = colorMap[color] || colorMap.blue

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('mt-4 p-4 rounded-xl border shadow-lg', c.bg, c.border, className)}
    >
      <div className="flex items-start gap-4">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', c.iconBg, c.text)}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className={cn('font-bold mb-1', c.text)}>{title}</h4>
          <p className="text-sm text-gray-300 mb-3 leading-relaxed">{description}</p>
          {linkHref && linkText && (
            <Link
              href={linkHref}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border',
                c.linkBg,
                c.linkHover,
                c.text,
                `border-${color}-500/30`
              )}
            >
              {linkText} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Helpers ────────────────────────────────────

function getConfirmationConfig(action: Action) {
  switch (action.type) {
    case 'create_daily':
      return {
        label: 'CREATE DAILY',
        icon: <CalendarClock size={20} />,
        bgClass: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/5',
        borderClass: 'border-blue-500/20',
        iconBgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
        confirmBtnClass: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30',
      }
    case 'create_habit':
      return {
        label: 'CREATE HABIT',
        icon: <Repeat size={20} />,
        bgClass: 'bg-gradient-to-r from-purple-500/10 to-violet-500/5',
        borderClass: 'border-purple-500/20',
        iconBgClass: 'bg-purple-500/20',
        textClass: 'text-purple-400',
        confirmBtnClass: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30',
      }
    case 'create_todo':
      return {
        label: 'CREATE TO-DO',
        icon: <ListTodo size={20} />,
        bgClass: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5',
        borderClass: 'border-amber-500/20',
        iconBgClass: 'bg-amber-500/20',
        textClass: 'text-amber-400',
        confirmBtnClass: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30',
      }
    case 'fitness_plan_generate':
      return {
        label: 'CREATE FITNESS PLAN',
        icon: <Dumbbell size={20} />,
        bgClass: 'bg-gradient-to-r from-green-500/10 to-emerald-500/5',
        borderClass: 'border-green-500/20',
        iconBgClass: 'bg-green-500/20',
        textClass: 'text-green-400',
        confirmBtnClass: 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30',
      }
    case 'skill_roadmap_generate':
      return {
        label: 'GENERATE SKILL ROADMAP',
        icon: <Map size={20} />,
        bgClass: 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5',
        borderClass: 'border-violet-500/20',
        iconBgClass: 'bg-violet-500/20',
        textClass: 'text-violet-400',
        confirmBtnClass: 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30',
      }
    case 'tasks_clear_all':
      return {
        label: 'CLEAR ALL TASKS',
        icon: <X size={20} />,
        bgClass: 'bg-gradient-to-r from-red-500/10 to-orange-500/5',
        borderClass: 'border-red-500/20',
        iconBgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
        confirmBtnClass: 'bg-red-500/60 hover:bg-red-500/70 text-white border border-red-500/30',
      }
    default:
      return {
        label: action.type.replace(/_/g, ' ').toUpperCase(),
        icon: <ClipboardList size={20} />,
        bgClass: 'bg-white/5',
        borderClass: 'border-white/10',
        iconBgClass: 'bg-white/10',
        textClass: 'text-gray-300',
        confirmBtnClass: 'bg-white/10 hover:bg-white/20 text-gray-300 border border-white/20',
      }
  }
}
