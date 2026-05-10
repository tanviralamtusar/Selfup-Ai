'use client'

import { useState } from 'react'
import { Send, Plus, Settings2, ChevronDown, Square, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface AIModel {
  id: string
  name: string
}

interface ChatInputProps {
  onSend: (content: string) => void
  isDisabled?: boolean
  aiName?: string
  models?: AIModel[]
  selectedModel?: string
  onModelChange?: (modelId: string) => void
}

export function ChatInput({ 
  onSend, 
  isDisabled, 
  aiName = 'System',
  models = [{ id: 'Pro', name: 'Pro' }],
  selectedModel: externalSelectedModel,
  onModelChange
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [internalModel, setInternalModel] = useState('Pro')

  const currentModelId = externalSelectedModel || internalModel
  const currentModelName = models.find(m => m.id === currentModelId)?.name || currentModelId

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (onModelChange) {
      onModelChange(val)
    } else {
      setInternalModel(val)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isDisabled) return
    onSend(input)
    setInput('')
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <form 
        onSubmit={handleSubmit}
        className="w-full bg-[#1e1f20] border border-white/5 rounded-[28px] p-4 pb-3 flex flex-col shadow-2xl focus-within:border-white/10 transition-colors relative group"
      >
        {/* Top section: Input */}
        <div className="flex items-start justify-between gap-4">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as any)
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
              }
            }}
            placeholder={`Ask ${aiName}`}
            disabled={isDisabled}
            rows={1}
            className="flex-1 bg-transparent py-1 text-[15px] text-gray-200 placeholder:text-gray-400 outline-none resize-none overflow-y-auto"
            style={{ minHeight: '40px', maxHeight: '200px' }}
          />
        </div>
        
        {/* Bottom section: Tools and Submit */}
        <div className="flex items-center justify-between mt-1 pt-1">
          {/* Left tools */}
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-400 transition-colors"
            >
              <Plus size={20} />
            </button>
            <button 
              type="button" 
              className="h-10 px-3 rounded-full hover:bg-white/5 flex items-center gap-2 text-gray-400 transition-colors text-[13px] font-medium"
            >
              <Settings2 size={16} />
              Tools
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <Sparkles size={12} className="text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">1 Coin</span>
            </div>
            
            <div className="relative">
              <select 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={currentModelId}
                onChange={handleModelChange}
              >
                {models.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#1e1f20] text-gray-200">
                    {m.name}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                className="h-10 px-3 rounded-full hover:bg-white/5 flex items-center gap-1.5 text-gray-300 transition-colors text-[13px] font-medium pointer-events-none"
              >
                {currentModelName}
                <ChevronDown size={14} className="text-gray-500" />
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isDisabled || !input.trim()}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full transition-all",
                isDisabled 
                  ? "bg-[#2c2d30] text-gray-400" 
                  : input.trim() 
                    ? "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10" 
                    : "bg-[#2c2d30] text-gray-500"
              )}
            >
              {isDisabled ? <Square size={14} className="fill-current" /> : <Send size={16} className="ml-0.5" />}
            </button>
          </div>
        </div>
      </form>
      
      {/* Footer Text */}
      <div className="text-[11px] text-gray-500 font-medium">
        {aiName} is AI and can make mistakes.
      </div>
    </div>
  )
}
