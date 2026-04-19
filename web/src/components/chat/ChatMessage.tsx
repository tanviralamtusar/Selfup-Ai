'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Brain, User } from 'lucide-react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isLast?: boolean
}

export function ChatMessage({ role, content, isLast }: ChatMessageProps) {
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

      <div className={cn(
        "max-w-[80%] px-5 py-3.5 rounded-2xl shadow-lg border",
        isAssistant 
          ? "bg-surface-container-low border-outline-variant/10 text-on-surface rounded-tl-sm" 
          : "bg-secondary/10 border-secondary/20 text-on-surface rounded-tr-sm"
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        
        {isLast && isAssistant && (
          <div className="flex gap-1 mt-2">
            <div className="w-1 h-1 bg-primary/40 rounded-full animate-bounce" />
            <div className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 border border-secondary/20">
          <User size={20} className="text-secondary" />
        </div>
      )}
    </motion.div>
  )
}
