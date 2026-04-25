'use client'

import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (content: string) => void
  isDisabled?: boolean
  aiName?: string
}

export function ChatInput({ onSend, isDisabled, aiName = 'SYSTEM' }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isDisabled) return
    onSend(input)
    setInput('')
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative flex items-center gap-3 bg-surface-container-low p-2 pl-5 rounded-[2rem] border border-outline-variant/10 shadow-xl focus-within:border-primary/30 transition-all"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Ask ${aiName} anything...`}
        disabled={isDisabled}
        className="flex-1 bg-transparent py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
      />
      
      <div className="flex items-center gap-2 pr-2">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest/50 border border-outline-variant/10">
          <Sparkles size={12} className="text-secondary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">1 Coin</span>
        </div>
        
        <button
          type="submit"
          disabled={isDisabled || !input.trim()}
          className={cn(
            "w-11 h-11 flex items-center justify-center rounded-full transition-all btn-press",
            input.trim() 
              ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
              : "bg-surface-container-highest text-on-surface-variant/40"
          )}
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  )
}
