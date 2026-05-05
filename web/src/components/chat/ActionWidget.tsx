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
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Action {
  type: string
  payload: any
  requires_confirmation?: boolean
}

interface ActionWidgetProps {
  action: Action
  className?: string
  onConfirm?: (action: Action) => Promise<void>
  onCancel?: (action: Action) => void
}

export function ActionWidget({ action, className, onConfirm, onCancel }: ActionWidgetProps) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'confirmed' | 'cancelled'>('idle')

  const handleConfirm = async () => {
    setStatus('confirming')
    try {
      await onConfirm?.(action)
      setStatus('confirmed')
    } catch {
      setStatus('idle')
    }
  }

  const handleCancel = () => {
    setStatus('cancelled')
    onCancel?.(action)
  }

  // If requires confirmation and hasn't been acted upon yet
  if (action.requires_confirmation && status === 'idle') {
    return renderConfirmationWidget(action, className, handleConfirm, handleCancel)
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
          title="Fitness Protocol Generated!"
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
          title="Fitness Interview Active"
          description="Answer my questions above so I can design your perfect physical vessel upgrade."
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

function renderConfirmationWidget(
  action: Action,
  className: string | undefined,
  onConfirm: () => void,
  onCancel: () => void
) {
  const config = getConfirmationConfig(action)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'mt-4 p-4 rounded-xl border shadow-lg',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', config.iconBgClass, config.textClass)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-bold mb-1 text-sm', config.textClass)}>
            {config.label}
          </h4>
          <p className="text-white font-semibold text-base mb-1">
            {action.payload.title || action.payload.skill_name || action.payload.goal || 'Untitled'}
          </p>

          {/* Details */}
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {action.payload.priority && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 capitalize">
                {action.payload.priority}
              </span>
            )}
            {action.payload.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 capitalize">
                {action.payload.category}
              </span>
            )}
            {action.payload.due_date && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                Due: {action.payload.due_date}
              </span>
            )}
            {action.payload.scheduled_time && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                {action.payload.scheduled_time}
              </span>
            )}
            {action.payload.repeat_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 capitalize">
                {action.payload.repeat_type}
              </span>
            )}
            {action.payload.days_per_week && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                {action.payload.days_per_week}x/week
              </span>
            )}
            {action.payload.experience_level && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 capitalize">
                {action.payload.experience_level}
              </span>
            )}
          </div>

          {action.payload.description && (
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{action.payload.description}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onConfirm}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                config.confirmBtnClass
              )}
              aria-label={`Confirm ${config.label}`}
            >
              <Check size={14} /> Confirm
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 rounded-lg text-sm font-medium transition-colors"
              aria-label={`Cancel ${config.label}`}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
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
        label: 'GENERATE FITNESS PROTOCOL',
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
