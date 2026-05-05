'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Brain, User } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { ActionWidget } from './ActionWidget'

interface ChatMessageProps {
  id?: string
  role: 'user' | 'assistant'
  content: string
  metadata?: any
  isLast?: boolean
  name?: string
  style?: 'friendly' | 'strict' | 'motivational' | 'neutral'
}

export function ChatMessage({ id, role, content, metadata, isLast, name = 'SYSTEM', style = 'friendly' }: ChatMessageProps) {
  const isAssistant = role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 mb-6",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
          <Brain size={20} className="text-primary" />
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-w-[80%]">
        {isAssistant && (
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.2em] ml-1",
            style === 'strict' ? 'text-red-500' :
            style === 'motivational' ? 'text-secondary' :
            style === 'neutral' ? 'text-blue-400' : 'text-primary'
          )}>
            {name}
          </span>
        )}
        
        {content ? (
          <div className={cn(
            "px-5 py-3.5 rounded-2xl shadow-lg border",
            isAssistant 
              ? cn(
                  "bg-surface-container-low text-on-surface rounded-tl-sm",
                  style === 'strict' ? 'border-red-500/20 shadow-red-500/5' :
                  style === 'motivational' ? 'border-secondary/20 shadow-secondary/5' :
                  style === 'neutral' ? 'border-blue-400/20 shadow-blue-400/5' : 'border-outline-variant/10 shadow-primary/5'
                )
              : "bg-secondary/10 border-secondary/20 text-on-surface rounded-tr-sm"
          )}>
            {isAssistant ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            )}

            {isLast && isAssistant && (
              <div className="flex gap-1 mt-2">
                <div className={cn("w-1 h-1 rounded-full animate-bounce", style === 'strict' ? 'bg-red-500/40' : style === 'motivational' ? 'bg-secondary/40' : 'bg-primary/40')} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce [animation-delay:0.2s]", style === 'strict' ? 'bg-red-500/40' : style === 'motivational' ? 'bg-secondary/40' : 'bg-primary/40')} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce [animation-delay:0.4s]", style === 'strict' ? 'bg-red-500/40' : style === 'motivational' ? 'bg-secondary/40' : 'bg-primary/40')} />
              </div>
            )}
          </div>
        ) : (
          isLast && isAssistant && (
            <div className="px-5 py-3.5 rounded-2xl shadow-lg border bg-surface-container-low text-on-surface rounded-tl-sm border-outline-variant/10 shadow-primary/5 w-fit">
              <div className="flex gap-1">
                <div className={cn("w-1 h-1 rounded-full animate-bounce", style === 'strict' ? 'bg-red-500/40' : style === 'motivational' ? 'bg-secondary/40' : 'bg-primary/40')} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce [animation-delay:0.2s]", style === 'strict' ? 'bg-red-500/40' : style === 'motivational' ? 'bg-secondary/40' : 'bg-primary/40')} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce [animation-delay:0.4s]", style === 'strict' ? 'bg-red-500/40' : style === 'motivational' ? 'bg-secondary/40' : 'bg-primary/40')} />
              </div>
            </div>
          )
        )}

        {/* Render Action Widgets OUTSIDE the text bubble */}
        {metadata?.actions?.map((action: any, idx: number) => (
          <ActionWidget key={idx} action={action} messageId={id} className={content ? "mt-2" : "mt-0"} />
        ))}
      </div>

      {!isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 border border-secondary/20">
          <User size={20} className="text-secondary" />
        </div>
      )}
    </motion.div>
  )
}
